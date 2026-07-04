# Literary Studio — Security

**Status: Draft placeholder — partially known, not yet ratified.**

Detailed security requirements were discussed during Sprint 02 (outside this repository) but
were not committed to writing at that time. This document captures what can be derived from
the architecture decided so far, plus open questions to resolve before Phase 2.

## What we know from the current architecture

- **Phase 1 (MVP) has a minimal attack surface by design:** single-user, no authentication, no
  network-accessible accounts, and local JSON storage — there is no multi-tenant data to
  isolate and no remote user data store to protect yet.
- **The one external dependency planned for Sprint 04** is the Anthropic API: user-authored
  text will be sent to a third-party API for Expert processing (e.g. the Line Editor). This
  needs an explicit secrets-handling convention (API key storage, `.env` handling, never
  committing keys) before that integration lands — see Remaining Work in the
  [Sprint 03 report](../reports/SPRINT-03.md).

## Secrets Policy

Defined as of Sprint 04, Step 3 — closes the "Next step" below.

- Secrets exist only in `.env.local` (gitignored, never committed).
- `.env.example` contains placeholders only — no real values, ever.
- Secrets are never committed, in any file, at any point in history.
- Secrets are never logged.
- Secrets are never exposed to client-side code (no `NEXT_PUBLIC_` prefix, no client component
  ever reads one).
- Only Next.js Route Handlers may access provider SDKs (e.g. the Anthropic SDK) or read
  provider API keys.

## Provider Integration Rule

**The only approved integration point for external AI providers is a Next.js Route Handler.**
This is an architectural constraint, not a convenience default: no client component, no shared
utility outside a Route Handler, and no build-time code may call a provider SDK or hold a
provider API key.

In Step 4, the Anthropic SDK is expected to be accessed through a single server-side module —
`apps/studio/src/lib/ai/anthropic.ts` — to keep exactly one integration point rather than
scattering SDK calls across multiple Route Handlers. This is not a provider abstraction layer
(ADR-0003's abstraction layer remains deferred, per its evolutionary approach) — it is only a
single point of access to minimize future changes. This module does not exist yet; it is not
created in Step 3, which prepares the project without importing the SDK anywhere.

## Open questions to resolve before Phase 2

- Authentication approach once user accounts are introduced.
- Data isolation and access control between users once storage moves to PostgreSQL (see
  [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md)) with cloud sync.
- Data retention and deletion policy for user-authored manuscripts.
- Whether/how user text sent to AI providers (Anthropic or others) is retained, logged, or
  used — needs a clear policy stated to users.
- Encryption at rest and in transit once cloud sync is introduced.
- Compliance requirements (e.g. GDPR) once the product handles real user accounts and content.

## Next step

Backfill this document with the actual Sprint 02 security discussion. At minimum, a secrets
handling convention for the Anthropic API key should be decided before Sprint 04 begins AI
integration.
