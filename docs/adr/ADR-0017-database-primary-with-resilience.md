# ADR-0017: Database Primary Storage with Offline Resilience

**Status:** Accepted (Product Owner decision, 2026-07-15)

**Date:** 2026-07-15

**Related ADRs:** [ADR-0012](ADR-0012-persistence-migration.md) (Persistence Migration — Dual-Mode), [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack)

---

## Problem

Since Sprint 24 (ADR-0012), Literary Studio uses dual-mode persistence: `localStorage` is written first, then asynchronous sync to Postgres via `/api/workspace`. This creates several friction points:

1. **Data fragmentation:** Books exist in two places with different sync states, requiring complex race-condition handling (`SYNC_PENDING_KEY` workaround).
2. **State complexity:** `workspaceStorage.ts` maintains intricate logic to detect, retry, and recover from sync failures.
3. **User experience:** Users don't know their data is falling back to `localStorage`; silent fallback masks connectivity issues.
4. **Production concern:** As the app scales to multi-user workspaces (Sprint 30, now complete) and cloud deployment, the dual-mode approach becomes increasingly brittle.

**Current status:** Postgres is live (Sprint 23), multi-user auth is live (Sprint 30), but the primary source of truth remains localStorage with database as async fallback.

Sprint 37 rectifies this: Postgres becomes the primary source of truth; `localStorage` is used only when the database is temporarily unavailable, with explicit user warnings and fallback options (export to file).

---

## Decision

### 1. Database Primary (Postgres)

For all persistent book data (`Workspace.books`, `Workspace.series`, associated Characters, Ideas, AssistantThreads):

- **Primary source of truth:** Postgres (via Prisma schema, Sprint 23)
- **Load order:** Always query database first
- **Write order:** Write to database; only fall back to `localStorage` if the database write fails
- **Result:** Simplified state machine — no race conditions, no `SYNC_PENDING_KEY` workaround

### 2. Offline Fallback Strategy (Hybrid, Option B)

When the database is unreachable:

1. **First load:** Try to load books from Postgres.
   - Success → Use database data
   - Failure → Fall back to `localStorage` data (if available)
   
2. **Subsequent saves:** 
   - If database is reachable → Write to database
   - If database is unreachable → Write to `localStorage` (ephemeral fallback)
   - Show warning banner: "Saving locally (offline mode)"
   
3. **Sync recovery:** When database reconnects, queue any local changes for merge/sync (exact merge strategy deferred to Step-02).

4. **Disable cloud-dependent features** when offline:
   - No multi-user sync (workspace sharing, collaborative edit notifications)
   - No audit logging (Sprint 32, when live)
   - No AI Expert calls (require database context for history/billing/audit)

### 3. User Communication & Safety

When the app detects DB unavailability:

- **SyncStatusBanner component** displays:
  - Status: "Offline (using local backup)"
  - Last successful sync time
  - Export status ("Ready to export" / "Exported to [filename]")
  
- **Export prompt:** 
  - **Immediate:** "Your changes are being saved locally. Export to file as a backup?"
  - **Manual:** Button in SyncStatusBanner to trigger export at any time
  
- **Data safety guarantee:** 
  - No data is lost if database is temporarily unavailable
  - User is warned and offered export options
  - On reconnection, local data is flagged for merge (not silently discarded)

### 4. Ephemeral State (Remains in localStorage Only)

The following fields are **never persisted to the database**, only stored in `localStorage` for session convenience:

- `activeBookId` (which book is currently open)
- `selectedChapterId` (which chapter is highlighted in the sidebar)
- `selectedSceneId` (which scene is highlighted)
- `selectedCharacterId` (which character is highlighted)
- `selectedAssistantMode` (which Product Role mode was last active: Editor/Critic/Reader/Co-author)
- `collapseState` (book/chapter/scene expand/collapse toggles — ephemeral UI state, already not persisted per Sprint 16-17)

**Rationale:** These are UI navigation and focus states, not content. They restore user's working context per session but have no narrative value if lost.

### 5. Auto-Export Configuration (User-Configurable)

New user settings for automated backups:

- **Toggle:** "Auto-export to file"
- **Interval options:**
  - Hourly
  - Daily
  - Weekly
  - Manual only (no auto-export)
- **Storage location:** User-configurable directory (file picker on first enable)
- **Filename pattern:** `[book-title]-backup-[YYYY-MM-DD-HHmmss].json`
- **Trigger:**
  - On schedule (per interval)
  - After every save (if "Hourly" is too infrequent)
  - When DB becomes unavailable (force export as immediate backup)

**SyncStatusBanner tracks:**
- Last auto-export time
- Export location (path)
- Export status ("Ready" / "Exported 2 hours ago" / "Export failed")

### 6. Data Migration & Activation

**Assumption (for Step-02 to detail):** When the app first runs with the new database-primary code:

- If `localStorage` contains books and database is empty → Prompt user to migrate or use local data
- If both exist → Database wins (fresh migration assumed); local data is archived locally (not deleted, but not loaded)
- Subsequent sessions always load from database

**Rationale:** Ensures no accidental data loss during rollout; operator controls when migration happens.

---

## Consequences

### Positive

1. **Simplified state machine:** No race conditions, no `SYNC_PENDING_KEY`, no retry logic in `workspaceStorage.ts`.
2. **Clear source of truth:** Postgres is always authoritative; storage layer becomes a simple load/save pair, not a sync coordinator.
3. **Better observability:** Explicit warnings tell users when they're in fallback mode; SyncStatusBanner shows connectivity state and export status.
4. **Offline-safe:** Users can continue working locally if the server is down; export lets them back up critical work immediately.
5. **Prepared for scale:** Multi-user workspaces and audit logging (both coming in later sprints) are now built on a reliable, non-racy foundation.
6. **Production-ready:** One source of truth reduces surface area for data-loss bugs (learned the hard way in Sprint 11, Sprint 24).

### Trade-offs & Risks

1. **Database dependency:** The app cannot function for new sessions if the database is unavailable. Mitigation: offline fallback + export options.
2. **Merge complexity:** If local changes accumulate offline, re-syncing with the database on reconnect requires a merge strategy (deferred to Step-02). For now: local changes in fallback mode are queued; exact handling (last-write-wins, manual conflict resolution, etc.) is specified in Step-02.
3. **Performance:** Removing `SYNC_PENDING_KEY` workaround reduces code complexity but doesn't change latency — all changes still go through `/api/workspace` synchronously, same as now.
4. **Auto-export storage:** Frequent backups to disk consume local storage; user must configure intervals responsibly (hourly is minimum, not default).

### Deferred to Step-02

- Exact merge strategy for offline changes (last-write-wins, conflict resolution, etc.)
- Batch-load optimization (if thousands of books are in the database, load performance needs indexing/pagination — Sprint 23 schema already supports, but Step-02 validates)
- Export file format (JSON? SQLITE snapshot? format is user-facing, chosen in Step-02)
- Auto-export failure handling (e.g., if disk is full, what happens? deferred)

---

## Related Decisions

| ADR | Relationship |
|-----|---|
| [ADR-0012](ADR-0012-persistence-migration.md) | **Superseded:** ADR-0012 established dual-mode (localStorage first); ADR-0017 flips the priority: database first, localStorage fallback only. |
| [ADR-0003](ADR-0003-technology-stack-strategy.md) | **Consistent:** Postgres + Prisma remain the approved stack; this ADR simply makes them the primary, not async fallback. |
| [ADR-0015](ADR-0015-multi-user-auth-system.md) | **Foundation:** Multi-user auth (Sprint 30) is now the base layer; database-primary storage ensures each user sees their own books consistently. |
| [ADR-0007](ADR-0007-multi-book-workspace.md) | **Extended:** Multi-book Workspace (Sprint 11) data now lives durably in Postgres, not `localStorage` only. |

---

## Acceptance Criteria

- [x] Problem statement documents current dual-mode friction (ADR-0012 review included)
- [x] Decision specifies database-primary load/write order
- [x] Offline fallback strategy is explicit: try DB → fall back to localStorage → warn user → offer export
- [x] Ephemeral state list is comprehensive and justified
- [x] Auto-export requirements are clear (toggle, intervals, location, filename, tracking)
- [x] SyncStatusBanner component specification defined (DB status, last sync, export status)
- [x] Data migration path is documented (prompt on first run, database wins if both exist)
- [x] Consequences section addresses risks and deferred items
- [x] Related ADRs are referenced
- [x] No implementation code in this ADR (architecture decision only — implementation is Step-02+)

---

## Accepted (with notes)

**Decision owner:** Product Owner (Денис Воробьев, 2026-07-15)

**Acceptance:** Full acceptance of all decisions above. Option B (hybrid fallback with explicit warnings and export options) chosen for user safety.

**Implementation timeline:**
- **Step-01 (this ADR):** Architecture decision and specification
- **Step-02:** Repository layer updates for batch load optimization, database-primary queries
- **Step-03:** Storage layer refactoring (`workspaceStorage.ts` simplified, `SYNC_PENDING_KEY` removed)
- **Step-04:** Workspace Controller and UI integration (`SyncStatusBanner`, offline warning)
- **Step-05:** Auto-export feature (settings, scheduling, file I/O)
- **Step-06+:** Integration testing, live verification on real Postgres

**Live verification in Step-02+ will confirm:**
- Batch load performance (no N+1 queries, index usage)
- Offline fallback behavior (DB disconnect → localStorage read → warning displayed)
- Export file integrity (exported JSON can be re-imported, no data loss)
- Sync recovery (local changes merged or queued on reconnect, no silent data discard)
