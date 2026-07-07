# Steam Toolkit

A self-hosted Next.js app that logs into your own Steam account (via [`steam-user`](https://www.npmjs.com/package/steam-user)) and exposes account info and profile actions through a small web UI and API — with its own login (password or optional passkey/biometric) so you can safely deploy it and access it from anywhere.

## Features

- **Account summary** — persona, licenses, VAC status, wallet balance, trade URL, and more, with sensitive/heavy fields opt-in via query params.
- **Refresh-token bootstrap** — mint a long-lived `STEAM_REFRESH_TOKEN` from a one-time password login (with 2FA support), so the app never needs to store your Steam password long-term.
- **Profile theme picker** — equip Steam profile themes/modifiers from the UI, plus a scheduled cron job to auto-swap a day/night theme.
- **App login** — NextAuth-based session so the app itself is gated behind a login, with optional WebAuthn passkey/biometric login via an external auth service.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
git clone <this-repo-url>
cd steam-toolkit
npm install
cp .env.example .env.local
```

### 1. Steam login

Fill in **one** of these in `.env.local`:

- `STEAM_REFRESH_TOKEN` — recommended. A long-lived token that doesn't need your password on every login.
- `STEAM_ACCOUNT_NAME` + `STEAM_PASSWORD` — password login (Steam may prompt for a 2FA code).

If you only have a password, start the app with `STEAM_ACCOUNT_NAME`/`STEAM_PASSWORD` set, log in through the UI, and use the "Get refresh token" action (`POST /api/steam/refresh-token`) to mint a `STEAM_REFRESH_TOKEN` — then switch to that for subsequent runs. It's also logged to the server console when generated.

`STEAM_WEBAPI_KEY` is optional, only needed for future Steam Web API calls (e.g. `GetPlayerBans`).

### 2. App login (NextAuth)

Set `NEXTAUTH_SECRET` — generate one with:

```bash
openssl rand -base64 32
```

By default (no external auth service configured), logging into the app itself uses `STEAM_ACCOUNT_NAME`/`STEAM_PASSWORD` directly as the app's login credentials.

Optional: if you run a compatible external auth microservice, set `USE_EXTERNAL_AUTH_SERVICE=true` (and its client-visible twin `NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE=true`), plus `AUTH_SERVICE_URL`, `AUTH_SERVICE_API_KEY`, and `NEXT_PUBLIC_BASE_URL`, to enable password verification via that service and WebAuthn passkey/biometric login. See `CLAUDE.md` for how this flow is wired up.

### 3. Cron secret (optional)

`CRON_SECRET` authorizes the profile-theme cron job (`/api/cron/profile-theme`). Only needed if you want that automation running; any random string works for local testing.

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Log in with the credentials from step 2 above.

## API examples

`proxy.ts` gates all `/api/steam/*` routes behind an authenticated session, so these are easiest to try from the browser once logged in (or with a copied session cookie):

```bash
curl "http://localhost:3000/api/steam/account" -H "Cookie: <your-session-cookie>"
curl "http://localhost:3000/api/steam/account?includeSensitive=true&includeOwnedApps=true" -H "Cookie: <your-session-cookie>"
```

## Deploy to Vercel (Free / Hobby plan)

This app runs comfortably on Vercel's free Hobby tier.

1. **Push to GitHub** and import the repo into Vercel: [vercel.com/new](https://vercel.com/new) → select your repository.
2. **Set environment variables** in Project Settings → Environment Variables — mirror everything you put in `.env.local`:
   - `STEAM_REFRESH_TOKEN` (or `STEAM_ACCOUNT_NAME` + `STEAM_PASSWORD`)
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_BASE_URL` — set this to your final `https://<your-project>.vercel.app` URL
   - `CRON_SECRET` — required if you want the profile-theme cron to run (set the same value here as Vercel will send it as the cron job's `Authorization: Bearer` header)
   - Only if using the external auth service: `USE_EXTERNAL_AUTH_SERVICE`, `NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE`, `AUTH_SERVICE_URL`, `AUTH_SERVICE_API_KEY`
3. **Deploy.** Vercel builds and deploys automatically on push.
4. **Cron job**: `vercel.json` already schedules the profile-theme cron twice a day (`0 11 * * *` and `0 23 * * *`, UTC). Vercel's Hobby plan supports cron jobs at daily granularity or coarser, and these already qualify — no plan upgrade needed.
5. **Serverless bundling**: `next.config.ts` already forces the `lzma` package into the `/api/steam/**` serverless bundle (a `steam-user` dynamic-`require` dependency that Vercel's bundler can't trace on its own), so Steam calls work out of the box on Vercel.
6. **Function timeout**: Steam calls are wrapped with a 5s timeout, well under Hobby's default 10s serverless function timeout — no config needed unless you add slower operations later.
7. Once deployed, visit your Vercel URL, log in, and — if you started with `STEAM_ACCOUNT_NAME`/`STEAM_PASSWORD` — use the refresh-token action to mint a `STEAM_REFRESH_TOKEN` for production and add it to your Vercel env vars.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [steam-user](https://github.com/DoctorMcKay/node-steam-user)
