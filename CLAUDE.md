# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Next.js dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next`)

There is no test suite configured in this project.

## Environment setup

**Never read, write, or otherwise access `.env.local`.** It holds live secrets (Steam refresh token/password, API keys) for the user's real account. Don't Read/Edit/cat/grep it, don't curl endpoints that would exercise it, and don't ask the user to paste its contents. If a task needs a value from it (e.g. testing a new env var), tell the user what to add and let them do it themselves.

Steam login requires env vars in `.env.local` (copy from `.env.example`). One of:

- `STEAM_REFRESH_TOKEN` — recommended long-lived login
- `STEAM_ACCOUNT_NAME` + `STEAM_PASSWORD` — password login (may require `STEAM_2FA_CODE`/prompted 2FA)

`STEAM_WEBAPI_KEY` is optional, needed only for future Steam WebAPI calls (e.g. `GetPlayerBans`).

The app's own login (NextAuth) requires:

- `NEXTAUTH_SECRET` — signs the JWT session cookie.
- `CRON_SECRET` — authorizes `/api/cron/profile-theme`; must also be set in the Vercel project's env vars so Vercel's own cron invocations send a matching `Authorization: Bearer` header.

Optional, only needed to enable the external biometric/passkey auth service instead of the default direct `STEAM_ACCOUNT_NAME`/`STEAM_PASSWORD` comparison:

- `USE_EXTERNAL_AUTH_SERVICE` (server-side) and `NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE` (client-side) — both must be set to `"true"` together; keep them in sync.
- `AUTH_SERVICE_URL` / `AUTH_SERVICE_API_KEY` — base URL and API key for the external auth microservice.
- `NEXT_PUBLIC_BASE_URL` — this app's own public URL, sent to the auth service as the WebAuthn `origin`.

## Architecture

This is a Next.js (App Router) app that wraps the `steam-user` package to expose a Steam bot/account session over HTTP API routes, with a minimal shadcn/ui-based frontend to trigger those routes.

**Single shared Steam client (`lib/steam-client.ts`)**: The module keeps one module-level `SteamUser` instance (`steamClient`) that is lazily logged in on first use via `getSteamClient()` and reused across requests. Where `steam-user` exposes a natively typed Promise-returning overload (`getTradeURL`, `getCredentialChangeTimes`, `getSteamGuardDetails`), call it directly wrapped only in `withTimeout` (default 5s timeout); only fall back to a hand-rolled `promisifyX` callback wrapper for calls that don't have one (see `promisifyPersonas`).

- `getSteamClient()` logs in using `STEAM_REFRESH_TOKEN` only — it does not fall back to password login. A missing token throws `Error("STEAM_REFRESH_TOKEN_MISSING")`; a login attempt Steam rejects (revoked/expired token) throws `Error("STEAM_REFRESH_TOKEN_INVALID")`. Both propagate out of `getAccountSummary` and are mapped by the account route to a 401 with `needsRefreshToken: true`.
- `createSteamRefreshToken()` is a separate login path (always creates a _new_ `SteamUser` and logs in with account/password, optionally with a 2FA code) used specifically to mint a `STEAM_REFRESH_TOKEN` to put in `.env.local`.
- `getAccountSummary(options)` returns a typed `AccountSummary` (`lib/types/steam-account.ts`) built from data already cached on the `SteamUser` client (persona, licenses, VAC, wallet, etc.) plus a few live calls (trade URL, credential change times, Steam Guard details). All fields are individually try/caught so a single failing sub-call doesn't fail the whole summary. Sensitive fields (email info, wallet, trade URL) are gated behind `options.includeSensitive`; heavy lists (owned apps, friends, groups, inventory) are each gated behind their own `include*` flag to avoid unnecessary Steam API calls.
- Steam Guard 2FA is surfaced as a thrown `Error("STEAM_GUARD_REQUIRED")`, which API routes translate into a `401` response with `needsTwoFactorCode: true` for the client to prompt and retry.
- `@types/steam-user` is stale for a few shapes actually returned at runtime (`vac` is missing `ranges`; `ProfileItem`/`ProfileItems` are missing several fields/categories and mistype `communityitemid` as a number). `lib/types/steam-account.ts` defines corrected local override types for these instead of importing the library's versions — update that file if Steam's payloads change again, not the `@types/steam-user` typings.

**Shared API types (`lib/types/*.ts`)**: every route has an explicit request/response type.

- `lib/types/api.ts` — generic `ApiErrorResponse<Extra>` used by all error bodies.
- `lib/types/steam-account.ts` — the `AccountSummary` domain model (and its nested types) returned by `getAccountSummary`.
- `lib/types/steam-api.ts` — per-route types: `AccountQueryParams`/`AccountResponse`/`AccountErrorResponse`, `RefreshTokenRequestBody`/`RefreshTokenResponse`/`RefreshTokenErrorResponse`.

**API routes (`app/api/steam/*/route.ts`)**: Thin wrappers around `lib/steam-client.ts` functions, typed against `lib/types/steam-api.ts` via `satisfies` on every `NextResponse.json(...)` call. **Response convention: there is no `{ ok }` envelope.** A 2xx response body _is_ the result data directly; a 4xx/5xx response body is `{ error: string, ...extra }` (e.g. `needsTwoFactorCode`, `needsRefreshToken`) — callers must branch on `response.ok`/status, not on a body field. Follow this same `satisfies`-typed, status-code-driven convention for new routes.

- `GET /api/steam/account` — 200 body is `AccountResponse` (= `AccountSummary`); supports `includeSensitive`, `includeOwnedApps`, `includeFriendsList`, `includeGroupsList`, `includeInventory` query params (`"true"` to enable); 401 with `needsRefreshToken: true` when the refresh token is missing/invalid.
- `POST /api/steam/refresh-token` — body `{ twoFactorCode? }`, 200 body `{ refreshToken }` (also logged to the server console).

**Frontend (`app/(private)/*.tsx`)**: Client components (`"use client"`) that fetch through `@tanstack/react-query`, wired up via `app/providers.tsx` (`QueryClientProvider`, mounted in `app/layout.tsx`) and `lib/query-client.ts` (`makeQueryClient()` factory with shared defaults). Data fetching goes through `lib/api-client.ts`'s `fetchJson`/`ApiRequestError` (throws on non-2xx, carrying `status`/`needsTwoFactorCode`/`needsRefreshToken` off the error body) — don't call `fetch` directly in a component.

- `lib/hooks/use-account-summary.ts` — `useAccountSummary(params)` wraps the account query; `AccountDetailsCard` consumes it and reads `error instanceof ApiRequestError && error.needsRefreshToken` to drive its "need a new refresh token" `AlertDialog`.
- `lib/hooks/use-steam-action.ts` — `useSteamAction<TBody, TSuccess>(url)` wraps a `useMutation` for POST actions, encapsulating the "retry once on `needsTwoFactorCode` via `window.prompt`" flow. `SteamRefreshRequestButton` uses this instead of hand-rolling the retry logic.
- `lib/query-keys.ts` — central query key factory (`steamKeys.account(params)`); add new keys here rather than inlining array literals in hooks.

**UI components**: shadcn/ui (`components/ui/`), configured via `components.json` (style `radix-lyra`, base color `mist`, icon library `lucide`). Use the `@/*` path alias (maps to repo root, per `tsconfig.json`) for imports, e.g. `@/components/ui/button`, `@/lib/steam-client`.

**App authentication & route protection**: this app has its own login (separate from the Steam bot's own credentials), gating access to the UI and API.

- `proxy.ts` (Next's middleware-equivalent) gates every `/api/**` route except `/api/auth/*` and `/api/cron/*`, requiring either a valid NextAuth JWT (via `getToken`) or an `Authorization: Bearer <CRON_SECRET>` header. Add new API routes under `/api/steam` or similar so they inherit this gate automatically; routes that need to be reachable unauthenticated (webhooks, cron) must live under `/api/auth/` or `/api/cron/`.
- `app/api/auth/[...nextauth]/route.ts` — NextAuth with a single `CredentialsProvider`, JWT session strategy. `authorize()` branches on the submitted fields: a `credentialId` triggers the biometric flow (verified only through the external auth service — throws if `USE_EXTERNAL_AUTH_SERVICE` isn't `"true"`); `username`/`password` triggers the password flow, which compares directly against `STEAM_ACCOUNT_NAME`/`STEAM_PASSWORD` unless `USE_EXTERNAL_AUTH_SERVICE=true`, in which case it delegates to `callAuthService`.
- `lib/auth-service-client.ts`'s `callAuthService<T>(path, body)` — thin `fetch` wrapper (adds `x-api-key: AUTH_SERVICE_API_KEY`) against `AUTH_SERVICE_URL`, used by the NextAuth route plus four dedicated routes (`app/api/auth/register-biometric-challenge`, `app/api/auth/authentication-biometric-challenge`, `app/api/auth/verify-and-create-biometric`, `app/api/auth/verify-credential`, `app/api/me/verify-password`) that proxy WebAuthn passkey registration/challenge/verification and password verification. All five 404 with `{ error: "External auth service is disabled" }` unless `USE_EXTERNAL_AUTH_SERVICE=true`.
- `lib/hooks/use-authentication-identity.ts` (`useAuthenticationIdentity`) is the client-side entry point: `loginPassword` (auto-calls `registerBiometric` afterward when `NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE=true`), `loginBiometrics`, `registerBiometric`, `verifyBiometrics`, `verifyPassword`. WebAuthn ceremonies run via `@simplewebauthn/browser`'s `startRegistration`/`startAuthentication`; the resulting `credentialId` is persisted in `localStorage` under the key from `lib/key-store.ts` (`KeyStore.credentialId`).
- Route groups enforce auth in the UI: `app/(private)/layout.tsx` wraps its pages (`AccountDetailsCard`, `ProfileThemePicker`, `SteamRefreshRequestButton`, `page.tsx`) in `components/guards/PrivateGuard.tsx`, which redirects to `/login` (preserving the current path as a `returnUrl` query param) when `useSession()` is `"unauthenticated"`. `app/(public-only)/login/page.tsx` is wrapped by `components/guards/PublicOnlyGuard.tsx`, which redirects an already-authenticated session away from `/login` to `returnUrl` (or `/`). Both guards reference route constants from `lib/router-path.ts` (`PATH.login`, `PATH.home`) rather than inlining path strings.

**Cron: profile theme (`app/api/cron/profile-theme/route.ts`)**: a `GET` route (`runtime = "nodejs"`) authorized via `Bearer $CRON_SECRET`, taking a `?theme=day|night` query param. Each value maps to a hardcoded `communityitemid` for the "Summer in the City" profile theme (kept in sync with `defaultThemes` in `app/(private)/ProfileThemePicker.tsx` — update both if that theme changes) and calls `setSteamProfileModifier(appId, communityItemId)` from `lib/steam-client.ts` to equip it. `vercel.json` schedules this twice daily (`0 11 * * *` → night, `0 23 * * *` → day, both UTC) via Vercel Cron.

**Serverless deployment note (`next.config.ts`)**: `outputFileTracingIncludes` force-includes `node_modules/lzma/**` for `/api/steam/**` routes, because `steam-user` resolves its (de)compression backend via a dynamic `require(moduleName)` that `@vercel/nft` can't statically trace — without this, Steam calls silently break on Vercel (module not found) even though `next build`/`next start` works fine locally. If a similar "works locally, breaks on Vercel" error shows up after adding a new dependency, suspect the same dynamic-require tracing gap.
