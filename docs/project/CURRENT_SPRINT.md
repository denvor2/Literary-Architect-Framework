# Current Sprint

**Sprint 30 — Мультипользовательская система: Админ + Пользователи (see ROADMAP_18-27.md)** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress — scope pending (ADR-0012/ADR-0013 context required before decomposition).
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/project/ROADMAP_18-27.md` (Sprint 30 row, Definition of Done requirements
  are auth/roles/Admin/User/password recovery; see ROADMAP for full Definition).

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

## Sprint 30 — in progress

Мультипользовательская система: Админ + Пользователи — replace the temporary single-user
stopgap (Sprint 24, ADR-0012) with role-based authentication and authorization. Scope pending:
step-executor should read ADR-0012 (Sprint 24 single-user decision, hard deadline context) and
ADR-0013 (Sprint 25 AI Expert settings, per-assistant gating model) for context before
decomposing this sprint's Step Cards.

**Definition of Done (from ROADMAP_18-27.md):**
- ADR accepted: role model (Admin/User), authentication schema, password storage
- Registration, authorization, password recovery, security questions, CAPTCHA implemented
- Admin can create/edit users and block new registrations
- Admin sees database health and can take backups
- Temporary single-user stopgap (Sprint 24) replaced/migrated
- tsc, eslint, prettier, build clean

See `docs/project/ROADMAP_18-27.md` (Sprint 30 section, lines 303-356) for the full scope
charter, requirements, and hard deadline context (no buffer remaining, critical-path item).
