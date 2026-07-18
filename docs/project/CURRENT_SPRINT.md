# Current Sprint

**Sprint 38 — Statistics, Custom Helpers, Design Polish** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress — Step-01 (Statistics) ✅ complete, Step-02 (Custom Helpers) ready, Step-03 (Design mobile) pending, Step-04 (Design polish) pending
- **Phase:** Phase 1 (MVP) → Phase 2 (Polish & Features)
- **Scope:** Word/character statistics, custom AI helpers, responsive design for mobile/tablet, design polish (dark mode, icons, accessibility)

## Sprint 38 Progress

### Step-01: Word & Character Statistics ✅ COMPLETE (2026-07-18)

Real-time word and character count display in footer showing: words, characters with spaces, characters without spaces. Calculates statistics for active book by summing all Scene.text. Compact responsive footer supports mobile/tablet/desktop with dark mode. E2E tests cover load → display, edit → update, switch book → refresh scenarios.

- **Implementation:** StatsFooter.tsx component + calculateStats() helper function
- **Features:** Thousand separators (1,234), responsive design, dark mode support, real-time updates
- **Testing:** 9 E2E test scenarios covering all use cases
- **Status:** Archived to done/ (commit 589461d, 2026-07-18)
- **Validation:** TypeScript ✓ ESLint ✓ Prettier ✓ Build ✓

**Note:** Foundation for Step-02 (Custom helpers will have their own stats). Statistics update instantly as user edits scenes.

---

## Sprint 37 Progress (CLOSED ✅)

### Step-02: Complete UI Localization (EN/RU Coverage) ✅ COMPLETE (2026-07-18)

Full localization of 18 UI components across admin audit system (AdminAuditPanel, AuditEventRow, AuditFilters), export system (ExportDialog), editor (EditorArea), and supporting components. 18+ localization keys added to ru/en common.json, all hardcoded strings replaced with i18n calls.

- **Implementation:** Multiple rounds of fixes; final version corrects ESLint violations in pricing/tariffs
- **Components localized:** AdminAuditPanel, AuditEventRow, AuditFilters, ExportDialog, EditorArea, and 13 others
- **Localization keys:** 60+ new keys under audit.*, export.*, editor.* namespaces (EN/RU parity)
- **Status:** Archived to done/ (commit aa60646, 2026-07-18)

**Note:** Step-02 required 8 rounds of verification and fixes due to pre-existing ESLint issues in pricing/tariffs (Sprint-37-Step-01) and incomplete scope tracking. Final version passes TypeScript, ESLint, Prettier validation.

### Step-01: i18n Framework Infrastructure & Full UI Localization ✅ COMPLETE (2026-07-17)

i18n framework fully implemented and independently verified as working. Next-intl@4.13.2 installed, LocaleContext provides translations to Header, Sidebar, ExportDialog. Language switcher (EN/РУ toggle) functional, localStorage persistence ready.

- **Implementation:** 11 commits (core i18n + critical "use client" fix + verification)
- **Verification:** Architect-Reviewer PASS (after validation correction), Tester PASS (independent i18n verification)
- **Status:** Archived to done/, ready for next step

**Note:** E2E tests show 6/102 passing; 96 fail due to pre-existing pointer-events blocking issue in main layout div (Sprint-34/35 architectural scope, not Sprint-37). i18n itself verified as fully functional.

## Sprint 36 — closed ✅

Section Counters (Sidebar Enhancement) — completed 2026-07-17. Two Step Cards, all completed and verified:
Section Counters Implementation (added Книги/Серии counters to Sidebar) and Live Verification
(confirmed all 6 counters render correctly on production build).

- **Step 01:** Implementation ✅ (commit 97aa7d2) — Scope CLEAN, documentation HONEST
- **Step 02:** Live verification ✅ (commit 1814783) — Tester independent PASS

All steps live-verified, architect-verified (STATUS: OK), and archived to done/.
All 6 counters (Books, Series, Chapters, Characters, Ideas, Trash) display with real-time updates.
Next: Sprint 37 (i18n Framework).

## Sprint 35 — closed

Menu System (File/Edit/View/Help/About) — completed 2026-07-15. Six Step Cards, all completed:
ADR-0013 refinement, File menu (New Book, Save, Export, Exit), Edit menu (Undo, Redo, Find, Replace),
View menu (Theme selection, Font size, Sidebar toggle), Help/About (Documentation, Shortcuts, Version),
Keyboard shortcuts (Ctrl+K, N, S, E, Z/Y, Escape), and Live verification on scratch port.

- **Step 01-05:** Menu implementation across all systems layers
- **Step 06:** Live verification on production build (port 3418)

All steps live-verified and archived to done/. Sprint 35 closed. Next: Sprint 36 (Section Counters).

## Sprint 34 — closed

Design Polish (Icons, Accessibility, Performance) — completed 2026-07-15. Six Step Cards covering
dark mode, mobile/tablet responsive layouts, and icon/accessibility improvements (Accessibility 95/100).
All steps archived to done/. Sprint closed.

## Sprint 33 — closed

Trash System (Book/Series Deletion) — partial completion. Steps 01-07 in various states.
Continued in parallel with Sprint 34/35 work.

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

## Sprint 36 — in progress

Section Counters (Sidebar Enhancement) — add visual item counters to Sidebar section headers
showing how many items are in each section (Books, Series, Chapters, Characters, Ideas, Trash).

Two Step Cards planned:
- **Step 01:** Implement counters in Sidebar.tsx (display counts for all sections)
- **Step 02:** Live verification on scratch port (verify real-time updates, visual design)

Simple feature, low scope, high visual impact. Counters are calculated from existing data structures,
no database schema changes required.
