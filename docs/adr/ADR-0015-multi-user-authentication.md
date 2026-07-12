# ADR-0015: Multi-User Authentication & Roles

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0012](ADR-0012-persistence-migration.md) (Persistence Migration — temporary single-user stopgap, hard deadline Sprint 30),
  [ADR-0013](ADR-0013-assistant-settings.md) (AI Expert Settings — gating model assumes roles),
  [ROADMAP_18-27.md](../../project/ROADMAP_18-27.md) (Sprint 30 — Multi-user system with Admin/User roles),
  [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack Strategy)

## Context

Sprint 24 (ADR-0012, Decision 1) established a temporary single-user stopgap: a single local user
per instance, automatically created on first access to satisfy the requirement that `Book.userId`
be non-null. This stopgap had an explicit hard deadline: "no later than 5 sprints after Sprint 24"
(originally Sprint 29, moved to Sprint 30 by Product Owner on 2026-07-11, now the critical-path
hard deadline with no buffer remaining — see `docs/project/ROADMAP_18-27.md`).

Sprint 25 (ADR-0013) introduced Admin-scoped assistant settings (system prompts, display names,
typical-request quick-actions) as an instance-wide feature gated by Admin/User roles that did not
yet exist. ADR-0013's Decision (Implementation constraint for Sprint 25 Step 03) explicitly
deferred the real Admin/User distinction to Sprint 30, requiring Sprint 25 to treat the single
stopgap user as having Admin-equivalent access with no permission UI yet.

This ADR exists to:

1. Freeze the architectural shape of the multi-user system: User schema, role model, authentication
   mechanism, password storage, and migration path from the single-user stopgap.
2. Resolve five explicit product-level decisions that require Product Owner judgment (not
   implementation details that the Programmer can resolve independently).
3. Unblock the remaining Step Cards of Sprint 30 (Steps 02–05) with a concrete, unchanging
   foundation.

Two of the five decisions below (password recovery mechanism, registration openness) were genuine
product forks, not implementation choices, and were confirmed by the Product Owner on 2026-07-12
before this ADR was drafted. They are recorded below as accepted Product Owner decisions.

## Decision

### 1. User Model — Data Schema

New schema for the `User` entity (extends existing single-user placeholder):

```
User {
  id: string                    // CUID (globally unique, already exists in single-user model)
  email: string (unique)        // NEW: required for login, globally unique constraint
  passwordHash: string | null   // NEW: bcrypt-hashed password; null during migration/reset
  role: "admin" | "user"        // NEW: enum, required, determines permission scope
  isBlocked: boolean            // NEW: admin can temporarily block a user, default false
  createdAt: DateTime           // exists in current model
  updatedAt: DateTime           // should exist; add if missing
}
```

**Key fields:**

- `email` is globally unique (database constraint) — prevents duplicate registrations, used as
  login identifier.
- `passwordHash` is null-safe — allows admin-only password resets (admin performs reset without
  knowing user's original password; user receives temp password via external notification, then
  changes it on next login). Null value means "no password set" (used during initial migration or
  admin reset).
- `role` is a strict enum (`admin` | `user`), no third role — Admin manages users and system
  settings; User works with their own books and can override Assistant Settings if gating permits.
- `isBlocked` (default false) allows Admin to suspend an account without deletion, preserving
  data integrity.

### 2. Role Model — Admin vs. User Distinction

**Admin capabilities (instance-wide):**
- Create, edit, view, delete other users
- Block/unblock users
- Set instance-wide default Assistant Settings (system prompts, display names, typical requests)
  for all four Expert modes (Line Editor, Critic, Reader, Co-author)
- Access database health information and backups (Phase 1: backend-only; full Admin Panel UI
  deferred to future sprint)

**User capabilities (scoped to self):**
- Read/write their own books, chapters, scenes, characters, ideas, series
- Override their own Assistant Settings (display name, custom prompt append-suffix, typical
  requests per mode) if gating permit (permission flag or subscription tier — see Known Gaps below)
- Cannot see or edit other users' books or settings
- Cannot access admin functions

### 3. Registration — Open with CAPTCHA Protection

Registration is open to the public (not admin-only invite):

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "captchaToken": "g_token_from_reCAPTCHA_v3"
}
```

**Validation rules:**
- `email`: must be unique (database constraint enforces this; reject with 409 Conflict if duplicate
  exists), must match basic email format (RFC 5321 simplified: local-part@domain)
- `password`: minimum 8 characters, must contain at least one letter (a-z, A-Z) and at least one
  digit (0-9)
- `captchaToken`: valid Google reCAPTCHA v3 token (server-side validation with
  `CAPTCHA_SECRET_KEY` from `.env.local`)

**Response on success (201 Created):**
```json
{
  "id": "clxxxxxxxxxxxxx",
  "email": "user@example.com",
  "role": "user",
  "isBlocked": false
}
```

**CAPTCHA Provider (Product Owner confirmed 2026-07-12):** Google reCAPTCHA v3
- Standard, mature, free for most use cases
- Server-side validation: POST to `https://www.google.com/recaptcha/api/siteverify` with
  secret key and token
- No `.env.local` key required for client (reCAPTCHA v3 site key is public); server requires
  `CAPTCHA_SECRET_KEY`

### 4. Authentication — Session Management via httpOnly Cookie

**Login endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `email` must exist
- `password` must match `passwordHash` (bcrypt compare)
- `isBlocked` must be false (if true, reject with 403 Forbidden)

**Response on success (200 OK):**
- Sets an `httpOnly` cookie named `auth_token` containing a JWT token
- No token in response body (httpOnly means JavaScript cannot read it, preventing XSS exfiltration)
- Response body (for confirmation):
  ```json
  {
    "id": "clxxxxxxxxxxxxx",
    "email": "user@example.com",
    "role": "admin"
  }
  ```

**JWT Token Structure:**
- Payload: `{ sub: userId, email: string, role: "admin" | "user", iat: timestamp }`
- Algorithm: HS256 (HMAC-SHA256, secret in `JWT_SECRET` from `.env.local`)
- Expiration: 24 hours (standard for MVP; can be revised per product security review)

**Token Storage (Product Owner confirmed 2026-07-12):** httpOnly cookie
- Rationale: XSS-safe by construction — even if attacker injects JavaScript, cannot read the
  cookie (no `document.cookie` access), so cannot exfiltrate the token
- Alternative (rejected by Product Owner): localStorage token is faster to implement but requires
  JavaScript to manage, exposing it to XSS if the app contains any unpatched vulnerability
- Consequence: all subsequent API calls must send cookies automatically (browser default); no
  manual `Authorization` header needed

**Session validation endpoint:** `GET /api/auth/me`

**Request:** (cookies sent automatically by browser)

**Response (200 OK if valid):**
```json
{
  "id": "clxxxxxxxxxxxxx",
  "email": "user@example.com",
  "role": "admin",
  "isBlocked": false
}
```

**Response (401 Unauthorized if no/invalid cookie):** clear feedback, no retry semantics

### 5. Password Recovery — Phase 1: Admin-Only Reset

**Phase 1 (this sprint):** Admin-only password reset via backend endpoint

**Endpoint:** `POST /api/auth/reset-password` (admin-only, requires valid admin session)

**Request:**
```json
{
  "userId": "clxxxxxxxxxxxxx"
}
```

**Behavior:**
- Set `passwordHash` to `null` for the target user
- Return success confirmation (no token/password in response)
- Admin notifies the user via out-of-band channel (email, Slack, phone — operator's choice) to
  use a temporary password or password-reset flow
- Alternatively: Admin uses `psql` directly (`UPDATE "User" SET "passwordHash" = NULL WHERE id = ...`)
  or a backend SQL Admin Panel (deferred to Step 05 or future sprint)

**Phase 2 (future sprint, not in scope):** Email-based self-service password recovery
- User clicks "Forgot Password" on login screen
- System sends email with time-limited reset link
- User clicks link, enters new password, updates locally
- Requires SMTP infrastructure (not configured for Phase 1)

**Rationale for Phase 1 design:**
- Simplicity: no email infrastructure required, operator-driven
- Security: password resets are rare events; manual admin action is acceptable for MVP
- Product Owner confirmed this scope on 2026-07-12

### 6. Migration from Single-User Stopgap

The existing single-user model (from Sprint 24) must be migrated to the multi-user schema:

**Migration strategy:**

- Existing `User` record (id, createdAt, existing fields) is preserved as-is
- Add `email` field: set to `"admin@localhost"` (special marker for the bootstrapped admin,
  easily recognizable)
- Add `role` field: set to `"admin"` (existing user becomes Admin by default, owns the instance)
- Add `passwordHash` field: set to `null` (no password yet; admin can set one via Phase 1 reset
  endpoint or manual SQL)
- Add `isBlocked` field: default false
- Add `updatedAt` field if missing

**Why this approach:**
- Preserves existing book/chapter/scene data tied to the existing userId
- Clearly marks the migrated user as Admin (who will manage the new registration system)
- Delays password setup (no forced prompt on first login) — acceptable for Phase 1, can be
  improved with optional password setup on next login if desired
- Sets admin@localhost as a recognizable email so operator can immediately identify this is a
  bootstrapped account, not a real user

**Consequence:** After this migration, the application enters multi-user mode. First time a real
user registers via `/api/auth/register`, they get `role: "user"`. Admin can still use `admin@localhost` if they set a password.

### 7. Storage Layer — Prisma Schema Extension

The existing `User` table (from Sprint 24) gains four new fields:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique  // NEW: enforces uniqueness
  passwordHash  String?  // NEW: nullable (for resets)
  role      String   @default("user")  // NEW: "admin" | "user"
  isBlocked Boolean  @default(false)   // NEW: admin can block users
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // NEW if missing

  // Relations to other entities (existing)
  books     Book[]
  series    Series[]
  assistantSettings AssistantSettings[]  // one-to-many (from ADR-0013, added later if needed)

  @@index([email])  // optimize login queries
}
```

## Consequences

- **Postgres migrations:** Prisma `schema.prisma` will add four fields to `User`, apply via
  `prisma migrate dev --name add_auth_fields` (Step 02)
- **API surface grows:** five new endpoints (`/api/auth/register`, `/api/auth/login`,
  `/api/auth/logout`, `/api/auth/me`, `/api/auth/reset-password`), all non-persisted
  (authentication is stateless except for the session cookie)
- **Repository layer:** new `userRepository.ts` (server-only) with CRUD + lookup by email
- **Middleware:** new `withAuth.ts` that checks the `auth_token` cookie and injects `currentUser`
  into request context — consumed by all protected API routes
- **UI changes:** new Login page (`/login`), new Register page (`/register`), logout button in header
  (Step 05, UI phase)
- **Security dependency:** `bcrypt` (already common; see ADR-0003 for stack confirmation; if not
  already in package.json, add it)
- **Environment variables:** `.env.local` must include:
  - `JWT_SECRET` — random 32+ character string (generate with `openssl rand -base64 32`)
  - `CAPTCHA_SECRET_KEY` — obtained from Google Recaptcha Admin Console (public site key not
    needed in .env, only on client as a constant)
- **ADR-0013 update (Sprint 30 Step 03 responsibility):** The single-user workaround in ADR-0013
  Step 03 (treat stopgap user as Admin-equivalent, no permission UI) must be replaced with real
  role checks: `currentUser.role === "admin"` before showing customization UI, or `role ===
  "user"` before enforcing gating on overrides

## Known Gaps / Review Triggers

1. **Gating mechanism for User overrides** (from ADR-0013, Open Gap 1): Once real Users exist,
   the Assistant Settings override gating (permission flag vs. subscription tier) is not decided
   by this ADR. Flagged for Sprint 30 Step 03 or later when real gating logic is built. Current
   workaround: assume all Users can override.

2. **Email-based password recovery** (Phase 2): Deferred beyond Sprint 30. Requires SMTP
   infrastructure, time-limited reset tokens, and additional UI. Acceptable for Phase 1 because
   operator/admin-initiated resets are infrequent.

3. **OAuth / SSO integration:** Not in scope. If Product Owner requests third-party login
   (Google, GitHub, etc.), a separate ADR will be needed (would affect User schema, token
   exchange flow, and email handling).

4. **User self-registration approval flow:** Not in scope. Registration is open with CAPTCHA;
   Admin does not approve before users can log in. If approval-workflow is desired, a separate ADR
   will be needed.

5. **Admin UI for user management** (full Panel): Deferred beyond Step 02. Step 02 establishes
   backend endpoints (`/api/auth/reset-password` and SQL-level admin operations). Full Admin UI
   (list users, block/unblock, edit roles, see health) is Step 05 scope or a future sprint. Until
   then, Admin must use `psql` directly or the backend endpoint.

6. **Session timeout and refresh tokens:** Not in scope. JWT expiration is fixed at 24 hours
   (stateless). If sliding-window or explicit refresh-token semantics are desired, revisit after
   Phase 1 usage.

7. **CAPTCHA configuration:** Google reCAPTCHA v3 requires administrator to register the domain
   in Google Recaptcha Console and obtain site key / secret key. Setup is operator responsibility,
   documented in deployment guide (not in this ADR).

## References

- [ADR-0012](ADR-0012-persistence-migration.md) — single-user stopgap foundation, hard deadline
  context
- [ADR-0013](ADR-0013-assistant-settings.md) — Assistant Settings gating model, assumes roles
  exist
- [ADR-0003](ADR-0003-technology-stack-strategy.md) — tech stack (confirm bcrypt, JWT libraries
  available)
- [ROADMAP_18-27.md](../../project/ROADMAP_18-27.md) — Sprint 30 scope charter (lines 303–356)

## Stop Condition

Do NOT proceed with Step 02 (Prisma schema migration) until this ADR is accepted by Product
Owner. If Product Owner's clarification differs from the decisions above, update this ADR before
Step 02 executes (do not work around in code).
