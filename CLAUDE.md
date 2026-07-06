# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Next.js dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next`)

There is no test suite configured in this project.

## Environment setup

Steam login requires env vars in `.env.local` (copy from `.env.example`). One of:

- `STEAM_REFRESH_TOKEN` — recommended long-lived login
- `STEAM_ACCOUNT_NAME` + `STEAM_PASSWORD` — password login (may require `STEAM_2FA_CODE`/prompted 2FA)

`STEAM_WEBAPI_KEY` is optional, needed only for future Steam WebAPI calls (e.g. `GetPlayerBans`).

## Architecture

This is a Next.js (App Router) app that wraps the `steam-user` package to expose a Steam bot/account session over HTTP API routes, with a minimal shadcn/ui-based frontend to trigger those routes.

**Single shared Steam client (`lib/steam-client.ts`)**: The module keeps one module-level `SteamUser` instance (`steamClient`) that is lazily logged in on first use via `getSteamClient()` and reused across requests. Where `steam-user` exposes a natively typed Promise-returning overload (`getTradeURL`, `getCredentialChangeTimes`, `getSteamGuardDetails`), call it directly wrapped only in `withTimeout` (default 5s timeout); only fall back to a hand-rolled `promisifyX` callback wrapper for calls that don't have one (see `promisifyPersonas`).

- `getSteamClient()` logs in using `STEAM_REFRESH_TOKEN` only — it does not fall back to password login. A missing token throws `Error("STEAM_REFRESH_TOKEN_MISSING")`; a login attempt Steam rejects (revoked/expired token) throws `Error("STEAM_REFRESH_TOKEN_INVALID")`. Both propagate out of `getAccountSummary` and are mapped by the account route to a 401 with `needsRefreshToken: true`.
- `createSteamRefreshToken()` is a separate login path (always creates a _new_ `SteamUser` and logs in with account/password, optionally with a 2FA code) used specifically to mint a `STEAM_REFRESH_TOKEN` to put in `.env.local`.
- `createSteamAuthSessionTicket(appId)` returns a hex-encoded Steam auth session ticket for a given app ID (used for game-ownership/session verification flows).
- `getAccountSummary(options)` returns a typed `AccountSummary` (`lib/types/steam-account.ts`) built from data already cached on the `SteamUser` client (persona, licenses, VAC, wallet, etc.) plus a few live calls (trade URL, credential change times, Steam Guard details). All fields are individually try/caught so a single failing sub-call doesn't fail the whole summary. Sensitive fields (email info, wallet, trade URL) are gated behind `options.includeSensitive`; heavy lists (owned apps, friends, groups, inventory) are each gated behind their own `include*` flag to avoid unnecessary Steam API calls.
- Steam Guard 2FA is surfaced as a thrown `Error("STEAM_GUARD_REQUIRED")`, which API routes translate into a `401` response with `needsTwoFactorCode: true` for the client to prompt and retry.
- `@types/steam-user` is stale for a few shapes actually returned at runtime (`vac` is missing `ranges`; `ProfileItem`/`ProfileItems` are missing several fields/categories and mistype `communityitemid` as a number). `lib/types/steam-account.ts` defines corrected local override types for these instead of importing the library's versions — update that file if Steam's payloads change again, not the `@types/steam-user` typings.

**Shared API types (`lib/types/*.ts`)**: every route has an explicit request/response type.

- `lib/types/api.ts` — generic `ApiErrorResponse<Extra>` used by all error bodies.
- `lib/types/steam-account.ts` — the `AccountSummary` domain model (and its nested types) returned by `getAccountSummary`.
- `lib/types/steam-api.ts` — per-route types: `AccountQueryParams`/`AccountResponse`/`AccountErrorResponse`, `AuthTicketRequestBody`/`AuthTicketResponse`/`AuthTicketErrorResponse`, `RefreshTokenRequestBody`/`RefreshTokenResponse`/`RefreshTokenErrorResponse`.

**API routes (`app/api/steam/*/route.ts`)**: Thin wrappers around `lib/steam-client.ts` functions, typed against `lib/types/steam-api.ts` via `satisfies` on every `NextResponse.json(...)` call. **Response convention: there is no `{ ok }` envelope.** A 2xx response body _is_ the result data directly; a 4xx/5xx response body is `{ error: string, ...extra }` (e.g. `needsTwoFactorCode`, `needsRefreshToken`) — callers must branch on `response.ok`/status, not on a body field. Follow this same `satisfies`-typed, status-code-driven convention for new routes.

- `GET /api/steam/account` — 200 body is `AccountResponse` (= `AccountSummary`); supports `includeSensitive`, `includeOwnedApps`, `includeFriendsList`, `includeGroupsList`, `includeInventory` query params (`"true"` to enable); 401 with `needsRefreshToken: true` when the refresh token is missing/invalid.
- `POST /api/steam/auth-ticket` — body `{ appId, twoFactorCode? }`, 200 body `{ appId, sessionTicket }`.
- `POST /api/steam/refresh-token` — body `{ twoFactorCode? }`, 200 body `{ refreshToken }` (also logged to the server console).

**Frontend (`app/*.tsx`)**: Client components (`"use client"`) that fetch through `@tanstack/react-query`, wired up via `app/providers.tsx` (`QueryClientProvider`, mounted in `app/layout.tsx`) and `lib/query-client.ts` (`makeQueryClient()` factory with shared defaults). Data fetching goes through `lib/api-client.ts`'s `fetchJson`/`ApiRequestError` (throws on non-2xx, carrying `status`/`needsTwoFactorCode`/`needsRefreshToken` off the error body) — don't call `fetch` directly in a component.

- `lib/hooks/use-account-summary.ts` — `useAccountSummary(params)` wraps the account query; `AccountDetailsCard` consumes it and reads `error instanceof ApiRequestError && error.needsRefreshToken` to drive its "need a new refresh token" `AlertDialog`.
- `lib/hooks/use-steam-action.ts` — `useSteamAction<TBody, TSuccess>(url)` wraps a `useMutation` for POST actions, encapsulating the "retry once on `needsTwoFactorCode` via `window.prompt`" flow. `SteamButton` and `SteamRefreshRequestButton` both use this instead of hand-rolling the retry logic.
- `lib/query-keys.ts` — central query key factory (`steamKeys.account(params)`); add new keys here rather than inlining array literals in hooks.

**UI components**: shadcn/ui (`components/ui/`), configured via `components.json` (style `radix-lyra`, base color `mist`, icon library `lucide`). Use the `@/*` path alias (maps to repo root, per `tsconfig.json`) for imports, e.g. `@/components/ui/button`, `@/lib/steam-client`.
