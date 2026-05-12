# Tixify

A concert-discovery app that pulls a user's top artists from Spotify and matches them against upcoming Ticketmaster events.

Stack: Next.js 16 (App Router), TypeScript, NextAuth v5 (Spotify provider), Prisma 6 + PostgreSQL, Tailwind v4.

> **Status:** active development. Auth, Spotify/Ticketmaster sync, and a dashboard skeleton are in place. Friend management, notifications, and the full event-discovery UI are not yet built.

## Prerequisites

- Node.js (tested on 22.12.0 — note that Prisma 6 is pinned because Prisma 7 requires 20.19+ but is otherwise incompatible with this setup)
- A PostgreSQL database (the dev DB is hosted on `db.prisma.io`, but any Postgres works)
- A [Spotify developer app](https://developer.spotify.com/dashboard) with `http://127.0.0.1:3000/api/auth/callback/spotify` registered as a redirect URI
- A [Ticketmaster Discovery API](https://developer.ticketmaster.com/) key

## Setup

All commands run from the `nextjs-prisma/` directory (the app does **not** live at the repo root).

```bash
cd nextjs-prisma
npm install
```

### Environment variables

Create `nextjs-prisma/.env` with:

```bash
DATABASE_URL=postgresql://...

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify

TICKETMASTER_API_KEY=...
TICKETMASTER_SECRET=...

AUTH_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
AUTH_SECRET=...        # generate with: npx auth secret
```

> **Use `127.0.0.1`, not `localhost`.** Spotify's redirect-URI policy (April 2025) rejects `http://localhost` at the token-exchange step. The dev script already binds Next to `127.0.0.1` — keep your env vars and Spotify dashboard entry on the same host.

### Database

Apply migrations and generate the Prisma client:

```bash
npx prisma migrate dev
```

(Optional) Seed the database with sample users, artists, and events:

```bash
npx tsx prisma/seed.ts
```

### Run the dev server

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) — again, not `localhost`. Sign in with Spotify, then visit `/dashboard`.

## Useful routes

- `GET /api/user/me` — current session user
- `GET /api/user/artists` — syncs and returns the user's top Spotify artists
- `GET /api/events` — Ticketmaster event search
- `POST /api/events/[id]/interest` — mark interest in an event

`/dashboard/*` and `/api/user/*` require an authenticated session.
