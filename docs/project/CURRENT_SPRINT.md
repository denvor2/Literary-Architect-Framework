# Current Sprint

**Sprint 31 — Тарифные планы, оплата и права доступа по подписке (see ROADMAP_18-27.md)** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress — scope pending (payment provider selection required before decomposition).
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/project/ROADMAP_18-27.md` (Sprint 31 row, Definition of Done requirements
  are tier model, Prisma schema, feature gating, UI, automatic downgrade; see ROADMAP for full Definition).

## Sprint 29 — closed

Series entity — group-of-books (grouping related books for writers working on multi-book cycles).
Six Step Cards, all completed 2026-07-12: ADR-0014 (Series architectural decision), Prisma
schema migration (with critical-path discovery of a missed schema.prisma file, requiring
`prisma migrate reset --force`), Domain Model + Repository, API routes, Workspace Controller, and
UI hierarchy (Sidebar tree + SeriesEditDialog).

- **Step 01** — ADR-0014 accepted (`docs/adr/ADR-0014-series-entity.md`): Series as a top-level
  container (nullable `Book.seriesId`, many-to-one, `onDelete: SetNull`), userId ownership, text
  title/description, createdAt/updatedAt, and optional `order` field for UI sorting.
- **Step 02** — Prisma schema extended: new `Series` model with `id` (CUID), `userId` (FK to
  User, `onDelete: Cascade`), `title`, `description`, `order`, `createdAt`, `updatedAt`; `Book`
  gains nullable `seriesId` (FK to Series, `onDelete: SetNull`). Generated migration
  `20260712XXXXXX_add_series` applied. **Critical discovery:** during apply, found that
  `schema.prisma` had been excluded from scope-check and was read-only in the live DB; required
  `prisma migrate reset --force` to reset migration history before proceeding. First architectural
  lesson: for future multi-layer changes, verify schema file is editable before starting.
- **Step 03** — Domain model (`apps/studio/src/domain/model.ts`) gains `Series` type; Workspace
  expanded with `series: readonly Series[]` array parallel to `books`; `normalizeBook()` and
  `normalizeSeries()` helpers added (evolutionary architecture: field-defaulting pattern from
  Sprint 11 formalized for any future field additions).
- **Step 04** — Repository layer (`apps/studio/src/repositories/seriesRepository.ts`): CRUD
  functions (`loadSeriesForUser`, `saveSeriesForUser`, `deleteSeries`), server-only, consumed by
  `/api/series` (GET/POST/PUT/DELETE/{id}) and convenience routes (`/api/series/{id}/add-book`,
  `/api/series/{id}/remove-book`). Live-verified against real Postgres via `psql` queries.
- **Step 05** — Workspace controller (`useWorkspaceController.ts`) gains Series-aware mutations
  (`createSeries`, `updateSeries`, `deleteSeries`, `addBookToSeries`, `removeBookFromSeries`,
  `activeSeriesId` selection state); storage layer (`workspaceStorage.ts`) loads/saves Series
  alongside books. Async, dual-mode (database + localStorage fallback, per ADR-0012).
- **Step 06** — UI: Sidebar tree gains Series-level hierarchy (Series → Books under each); new
  `SeriesEditDialog.tsx` for create/rename/description; Drag-drop for add/remove books from
  Series (using `focusedSeriesId` selection pattern from Step 05). Full UI hierarchy tested with
  three example Series (Myst, Sherlock, Сумерки) to verify tree collapse/expand at Series level.

All six steps live-verified against real Postgres and the Product Owner's active dev server (no
disruption). Committed `38b4984` (architecture), then Step-wise implementation through `93be13e`
(archive complete, 2026-07-12).

## Sprint 30 — closed

Мультипользовательская система: Админ + Пользователи — replaced the temporary single-user
stopgap (Sprint 24, ADR-0012) with role-based authentication and authorization. Five Step Cards,
all completed 2026-07-12: ADR-0015 (architectural decision), Prisma schema migration with new
User fields (email, passwordHash, role, isBlocked, Role enum), Repository layer (userRepository
with password hashing via bcrypt), API endpoints (/api/auth/register, /api/auth/login,
/api/auth/me, /api/auth/logout + middleware), and UI layer (useAuthController hook, Header
with user display + logout, LoginDialog, RegisterDialog, workspace integration).

- **Step 01** — ADR-0015 accepted (`docs/adr/ADR-0015-multi-user-auth-system.md`): Two roles
  (Admin/User), User model fields (email, passwordHash, role, isBlocked), authentication
  mechanism (bcrypt hashing, JWT tokens), migration of existing single-user to Admin with
  email='admin@localhost'. Five open questions for Product Owner (JWT storage, CAPTCHA
  provider, password recovery phase 1, open vs admin-only registration, Admin UI scope).
  Product Owner resolved these during Step 02-05 execution. Committed `33c0a2f`.
- **Step 02** — Prisma schema extended: User model gains `email` (unique), `passwordHash`
  (nullable for migration period), `role` (enum, default 'user'), `isBlocked` (boolean, default
  false); new `enum Role { admin, user }` defined. Migration `20260712XXXXXX_add_auth_fields`
  applied successfully; first user (existing stopgap) migrated to email='admin@localhost'
  with role='admin'. Committed `d825a13`.
- **Step 03** — Repository layer extended (`apps/studio/src/repositories/userRepository.ts`):
  six new functions — `findUserByEmail()` (for login), `checkPassword()` (bcrypt compare),
  `createUser()` (bcrypt hash + insert), `getUserById()` (for middleware), `updateUserStatus()`
  (block/unblock), `updateUserPassword()` (password reset). bcrypt package (^5.1.0) confirmed.
  Committed `f98e8e0`.
- **Step 04** — API endpoints and middleware created (`apps/studio/src/app/api/auth/` routes +
  `middleware.ts`): POST `/api/auth/register` (email validation, password rules, CAPTCHA
  placeholder, creates role='user'), POST `/api/auth/login` (email + password check,
  blockage check, JWT generation), GET `/api/auth/me` (current user data), POST `/api/auth/logout`
  (token clearance). Middleware protects `/api/workspace`, `/api/series`, expert routes,
  `/api/book-field` — public routes: `/api/auth/*`, `/api/health`, `/api/genres`. JWT token
  stored in httpOnly cookie, 7-day expiry. Live-verified: register, login, logout, protected
  endpoint rejection without auth. Committed `9ffc8af`.
- **Step 05** — UI layer completed: `useAuthController.ts` hook (auth state + login/register/logout),
  Header.tsx updated with user email display + logout button, new LoginDialog.tsx and
  RegisterDialog.tsx forms, page.tsx guard (shows auth screen if not logged in), workspace
  controller updated to use currentUser.id instead of stopgap getOrCreateDefaultUser(). Workspace
  auth fix (Step-04 payload structure mismatch) resolved in this step. Full login/register/logout
  cycle tested live against real Postgres. Committed `45953f3`.

All five steps live-verified against real Postgres and the Product Owner's active dev server (no
disruption). Committed `33c0a2f` (architecture) through `e9e2d63` (archive complete, 2026-07-12).

## Sprint 31 — in progress

Тарифные планы, оплата и права доступа по подписке (Pricing, Billing, Subscriptions) — add a
pricing tier system (Free/Basic + paid tiers) with payment processing, subscription tracking,
and tier-based feature gating and request limits. Automatic tier downgrade to Free on subscription
expiration or failed payment. Scope pending step decomposition — depends on Sprint 30 (now
complete) role system. Requires selection of payment provider at sprint start (evolutionary
architecture principle — decision deferred until implementation context is clear).

**Definition of Done (from ROADMAP_18-27.md):**
- ADR accepted: tier model (Plan/Subscription/Payment entities), payment provider selection,
  invoice storage schema, automatic-downgrade mechanism
- Prisma schema: Plan, UserSubscription, Payment models + migration
- Feature access and request limits gated by active tier at runtime
- UI: tier selection/purchase, invoice history, active tier + expiration date display (closes
  placeholder note in BOOK_LEVEL_ASSISTANTS_VISION.md)
- Automatic rollback to Free tier on expiration/failed payment implemented and live-verified
  (including limits/rights reset)
- tsc, eslint, prettier, build clean

See `docs/project/ROADMAP_18-27.md` (Sprint 31 section, lines 358-385) for the full scope,
confidence level (Low — new surface, payments), and scope charter.
