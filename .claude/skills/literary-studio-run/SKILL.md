---
name: literary-studio-run
description: Launch and drive apps/studio (the Literary Studio Next.js app) in Literary-Architect-Framework — dev server for interactive use, or a scratch-port production server for live verification. Use whenever you need to see a change working, start the app for the Product Owner, or spin up a real server for a Step Card's live-verification step. This is the project-specific skill the generic "run" skill's own bootstrap check looks for — prefer it over rediscovering these commands from scratch.
---

# Running Literary Studio

The app lives in `apps/studio/` (Next.js, Turbopack). Always `cd` there first
(or use `npm --prefix apps/studio ...`).

## Prerequisite: environment

`apps/studio/.env.local` must contain `ANTHROPIC_API_KEY` — without it, every
AI Expert call (`/api/line-editor`, `/api/critic`, `/api/reader`,
`/api/coauthor`, `/api/book-field`) fails at runtime even though the app
builds and starts fine. `apps/studio/.env` (added Sprint 23) holds
`DATABASE_URL` for Prisma — irrelevant to the app today (Phase 1 still uses
`localStorage`; the Prisma layer isn't wired into the app's data flow yet),
but `prisma generate`/`migrate` commands need it.

## Interactive use (Product Owner wants to click around)

```bash
npm run dev
```

Serves on `http://localhost:3000` by default. Turbopack hot-reloads on file
save — no restart needed after an edit. If port 3000 is already taken (a
previous session's server still running), pass `-- -p <port>`:

```bash
npm run dev -- -p 3001
```

Confirm it's actually up before handing a link to the Product Owner:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:<port>/
```

(`127.0.0.1`, not `localhost` — this environment has occasionally failed
IPv6 `localhost` resolution from Node/curl even when the server is healthy.)

## Live verification (Step Card validation — production-like, isolated)

This project's established pattern for verifying a change against a real
server with real Claude responses (see `literary-studio-live-verify` for the
full technique) needs a server that reflects the actual build output, on a
port that won't collide with anyone's dev server:

```bash
npm run build && npx next start -p <scratch-port>   # e.g. 3417, pick something unused
```

Run this with `run_in_background: true`, then poll for readiness (grep the
log for `"Ready"`, or loop `curl` until it returns `200`) before hitting it.
**Always tear the server down after verification** — find the PID bound to
the port and kill it (`netstat`/`taskkill` on this Windows environment; the
port number is the identifying detail, not the process name).

## Common failure modes

- **`npm run build` succeeds but a route 500s at runtime:** almost always
  the missing `ANTHROPIC_API_KEY` above — check `.env.local` before
  debugging the code.
- **Stale dev server on the port you want:** `netstat -ano | grep
  LISTENING | grep :<port>` to find the PID, confirm it's actually this
  project's server (not something unrelated) before killing it.
- **E2E tests** (`apps/studio/e2e/smoke.spec.ts`, Playwright, added Sprint
  16-17): `npm run test:e2e` from `apps/studio/`; `test:e2e:ui` for headed
  mode, `test:e2e:debug` for step-through. These start their own server —
  don't run them against a server you started manually.
