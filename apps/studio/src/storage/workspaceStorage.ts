// Workspace persistence — Sprint 06 Step 07 (extraction only).
//
// Moved out of page.tsx unchanged: same key, same JSON shape, same
// fallback-to-empty behavior on missing/corrupted data. No versioning, no
// validation, no async API, no repository — a straight lift of the
// existing logic.
//
// Sprint-24-Step-05 (ADR-0012): loadWorkspace()/saveWorkspace() became
// dual-mode and async. `localStorage` remains the sole owner of ephemeral
// UI state (ADR-0012 Decision 2) and is still written/read exactly as
// before; only `books` additionally round-trips through `/api/workspace`
// (the Sprint-24-Step-04 coarse endpoint), with the database treated as
// primary once it holds data. See ADR-0012 Decision 5 for the exact
// availability-detection/conflict semantics implemented below (checked on
// every call, not just at session start; silent fallback at this layer —
// the UI-visible warning is Sprint-24-Step-06's responsibility).
//
// Sprint-24-Step-07: Step 05's "database non-empty -> database always
// wins" rule had a read-side race ADR-0012 Decision 5 didn't literally
// cover — edits made while the database was unreachable (saved only to
// `localStorage`) were silently lost if the page reloaded after the
// database recovered but before the next successful saveWorkspace(). Fixed
// with a small piece of storage-layer-only bookkeeping (not a Workspace/
// Book domain field — see SYNC_PENDING_KEY below): a "local books are not
// yet confirmed synced to the database" flag, set pessimistically before
// every push attempt and cleared only on confirmed success. loadWorkspace()
// now consults it before letting a non-empty database result win. This
// also introduces getSyncWarning(), a one-shot/level signal consumed by
// Sprint-24-Step-08's UI wiring — no UI code here.

import type {
  AssistantThread,
  AssistantThreads,
  Book,
  Chapter,
  Character,
} from "@/domain/model";
import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";

// Sprint-24-Step-07: separate localStorage key, read/written only by this
// file — deliberately NOT a Workspace/Book domain field (Step Card Rules:
// "НЕ через новое поле в domain Workspace/Book"). Holds "1" while the
// current `localStorage` `books` have not yet been confirmed written to
// the database (either a push is in flight/never completed, or the last
// attempted push failed); absent/anything else means "confirmed synced".
const SYNC_PENDING_KEY = "literary-studio-db-sync-pending";

// Sprint-24-Step-07: exported so Sprint-24-Step-08's UI wiring can read a
// signal without touching this file's internals. Deliberately a plain
// string-literal union, not an object/enum — the Step Card leaves the
// exact form to the implementation, and this is the smallest shape that
// satisfies "at minimum two cases".
//   - "db-unavailable": the most recent fetchBooksFromApi()/
//     pushBooksToApi() call failed. A level signal — stays set until a
//     later call succeeds, clears automatically then.
//   - "recovered-local-wins": loadWorkspace() just resolved the race
//     described above in favor of local data over a stale non-empty
//     database result. One-shot: consumed (reset to null) the first time
//     getSyncWarning() is called after it's set, per the Step Card's "not
//     a permanent status" requirement.
export type SyncWarning = "db-unavailable" | "recovered-local-wins";

// Module-level, not persisted — this signal is about the current tab's
// session, not a durable fact worth surviving a reload (per Step Card
// Rules, module-level variable is an explicitly sanctioned storage form
// alongside the localStorage key above).
let syncWarning: SyncWarning | null = null;

export function getSyncWarning(): SyncWarning | null {
  const current = syncWarning;
  if (current === "recovered-local-wins") {
    syncWarning = null;
  }
  return current;
}

function readSyncPendingFlag(): boolean {
  try {
    return window.localStorage.getItem(SYNC_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSyncPendingFlag(pending: boolean): void {
  try {
    if (pending) {
      window.localStorage.setItem(SYNC_PENDING_KEY, "1");
    } else {
      window.localStorage.removeItem(SYNC_PENDING_KEY);
    }
  } catch {
    // Best-effort, same tolerance for a broken/unavailable localStorage as
    // the rest of this file.
  }
}

const EMPTY_WORKSPACE: Workspace = {
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
  selectedAssistantMode: "editor",
};

function emptyThread(): AssistantThread {
  return { id: "1", name: "Диалог 1", messages: [] };
}

// Per-role default, not just whole-object default: a book saved with only
// some roles' threads present (e.g. coauthor has real messages, the other
// three roles didn't exist yet) must keep the ones that exist and default
// only the missing ones.
function normalizeAssistantThreads(
  threads: Partial<AssistantThreads> | undefined,
): AssistantThreads {
  return {
    coauthor: threads?.coauthor ?? [emptyThread()],
    editor: threads?.editor ?? [emptyThread()],
    critic: threads?.critic ?? [emptyThread()],
    reader: threads?.reader ?? [emptyThread()],
  };
}

// Fix-Book-Fields-Undefined-Systemic: centralizes "what to do about a
// missing Book field" in one place. Every field of Book gets a default
// here — if a future field is added to Book and this function isn't
// updated, the defect shows up immediately and uniformly (a missing field
// here), not as a hard-to-explain crash in some random component months
// later. Third occurrence of this exact class of bug (Workspace-level
// characters, Chapter.subtitle, now Book fields) — this is why it's a
// shared function instead of another one-off fix at the point of use.
function normalizeBook(book: Partial<Book>): Book {
  return {
    id: book.id ?? "",
    title: book.title ?? "",
    genre: book.genre ?? "",
    language: book.language ?? "",
    premise: book.premise ?? "",
    shortAnnotation: book.shortAnnotation ?? "",
    fullAnnotation: book.fullAnnotation ?? "",
    tags: book.tags ?? [],
    chapters: book.chapters ?? [],
    characters: book.characters ?? [],
    assistantThreads: normalizeAssistantThreads(book.assistantThreads),
    ideas: book.ideas ?? [],
  };
}

// Sprint-11-Step-01: migrates the single-book Workspace shape (Sprint 05
// through Sprint 10 — one `book` object plus top-level `chapters`/
// `characters`) into the multi-book shape (`books: Book[]`, `activeBookId`).
// This is the first real data-shape migration in the project — read
// carefully before changing.
function migrateIfNeeded(parsed: unknown): Workspace {
  const data = parsed as Record<string, unknown>;

  // New format already — nothing to migrate, but each book still passes
  // through normalizeBook() in case it's missing fields added to Book
  // after it was saved (see Fix-Book-Fields-Undefined-Systemic above).
  if (Array.isArray(data.books)) {
    return {
      ...EMPTY_WORKSPACE,
      ...(data as Partial<Workspace>),
      books: data.books.map((book) => normalizeBook(book as Partial<Book>)),
    };
  }

  // Old format: single `book` (without id/chapters/characters — those were
  // separate top-level Workspace fields) + top-level chapters/characters.
  if (data.book) {
    const oldBook = data.book as Partial<Book>;
    const migratedBook = normalizeBook({
      id: "1",
      title: oldBook.title,
      genre: oldBook.genre,
      language: oldBook.language,
      premise: oldBook.premise,
      shortAnnotation: oldBook.shortAnnotation,
      fullAnnotation: oldBook.fullAnnotation,
      tags: oldBook.tags,
      chapters: data.chapters as readonly Chapter[] | undefined,
      characters: data.characters as readonly Character[] | undefined,
    });
    return {
      books: [migratedBook],
      activeBookId: migratedBook.id,
      selectedChapterId: (data.selectedChapterId as string | null) ?? null,
      selectedSceneId: (data.selectedSceneId as string | null) ?? null,
      selectedCharacterId: (data.selectedCharacterId as string | null) ?? null,
      selectedAssistantMode:
        (data.selectedAssistantMode as Workspace["selectedAssistantMode"]) ??
        "editor",
    };
  }

  // No book at all (fresh/empty old data) — start clean in new format.
  return EMPTY_WORKSPACE;
}

// Synchronous localStorage read, unchanged from the pre-Sprint-24 behavior
// (renamed from the old `loadWorkspace()` body) — still the sole source of
// ephemeral UI state, and the fallback source of `books` when the database
// is unreachable.
function readLocalWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WORKSPACE;
    return migrateIfNeeded(JSON.parse(raw));
  } catch {
    return EMPTY_WORKSPACE;
  }
}

// Returns the database's books on success (possibly an empty array — an
// empty database is a valid, distinct outcome from "unavailable"), or null
// on any failure (network error, non-2xx response, malformed body). Never
// throws — this is the dual-mode "is the database reachable right now"
// check, performed on every call per ADR-0012 Decision 5, not just once at
// session start.
// Sprint-24-Step-07: also maintains `syncWarning` — every call is a data
// point on current database reachability (ADR-0012 Decision 5: "every
// read/write attempt, not just at session start"). Success clears a
// previously-set "db-unavailable"; it does not touch a pending
// "recovered-local-wins" (that is set explicitly by loadWorkspace() after
// its own reconciliation push, not by this generic read helper).
async function fetchBooksFromApi(): Promise<readonly Book[] | null> {
  try {
    const response = await fetch("/api/workspace");
    if (!response.ok) {
      syncWarning = "db-unavailable";
      return null;
    }
    const data = (await response.json()) as { ok?: boolean; books?: unknown };
    if (!data.ok || !Array.isArray(data.books)) {
      syncWarning = "db-unavailable";
      return null;
    }
    if (syncWarning === "db-unavailable") syncWarning = null;
    return data.books as Book[];
  } catch {
    syncWarning = "db-unavailable";
    return null;
  }
}

// Best-effort write of `books` to the database. Never throws — a failure
// here is exactly the "database unavailable" case ADR-0012 Decision 5
// requires to fall back silently at this layer (the visible warning is
// Sprint-24-Step-06's concern); the next successful write overwrites the
// database with the then-current `books` in full (last-write-wins, same
// semantics `localStorage` already uses today).
// Sprint-24-Step-07: also maintains `syncWarning`, same rationale as
// fetchBooksFromApi() above — a push failure is exactly a "db-unavailable"
// data point regardless of which caller (saveWorkspace, the migration
// path, or loadWorkspace()'s reconciliation attempt) triggered it.
async function pushBooksToApi(books: readonly Book[]): Promise<boolean> {
  try {
    const response = await fetch("/api/workspace", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ books }),
    });
    if (!response.ok) {
      syncWarning = "db-unavailable";
      return false;
    }
    const data = (await response.json()) as { ok?: boolean };
    const ok = data.ok === true;
    if (ok) {
      if (syncWarning === "db-unavailable") syncWarning = null;
    } else {
      syncWarning = "db-unavailable";
    }
    return ok;
  } catch {
    syncWarning = "db-unavailable";
    return false;
  }
}

export async function loadWorkspace(): Promise<Workspace> {
  // Always read localStorage first — it is the only source of ephemeral UI
  // state (activeBookId/selectedChapterId/etc., ADR-0012 Decision 2), and
  // the fallback source of `books` if the database call below fails.
  const localWorkspace = readLocalWorkspace();

  const dbBooks = await fetchBooksFromApi();

  if (dbBooks === null) {
    // Database unreachable (network error, non-2xx, malformed body) ->
    // fall back to localStorage entirely, exactly as before Sprint 24.
    return localWorkspace;
  }

  if (dbBooks.length > 0) {
    // Sprint-24-Step-07: a non-empty database result is not automatically
    // trustworthy — if local books were never confirmed synced (edits made
    // while the database was unreachable, or a saveWorkspace() that never
    // got to report success/failure), the database result can be stale.
    if (readSyncPendingFlag()) {
      // Local wins instead of the database. Attempt one immediate,
      // best-effort reconciliation push — not a retry queue/timer, just
      // the single attempt this Step Card's Rules call for; if it fails,
      // the flag stays set and the same check runs again next
      // loadWorkspace() (or the next organic saveWorkspace() retries it).
      const reconciled = await pushBooksToApi(localWorkspace.books);
      if (reconciled) {
        writeSyncPendingFlag(false);
        syncWarning = "recovered-local-wins";
      }
      return localWorkspace;
    }

    // No pending local edits -> database wins, as before Sprint-24-Step-07
    // (e.g. a second tab/device wrote newer data — that data is exactly
    // what this path is meant to pick up).
    return {
      ...localWorkspace,
      books: dbBooks.map((book) => normalizeBook(book as Partial<Book>)),
    };
  }

  if (localWorkspace.books.length > 0) {
    // Database is empty but localStorage has books -> one-time migration:
    // push them to the database (ADR-0012 Decision 6). Whether the push
    // succeeds or not, `localWorkspace.books` (already normalized by
    // readLocalWorkspace()'s migrateIfNeeded()) is the correct result to
    // return here — on success it now matches the database; on failure the
    // next saveWorkspace() best-effort PUT retries it (no dedicated retry
    // queue, per ADR-0012 Decision 5/Known Gaps).
    const migrated = await pushBooksToApi(localWorkspace.books);
    if (migrated) writeSyncPendingFlag(false);
  }

  return localWorkspace;
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  // Always, synchronously, before any await: write the full workspace
  // (ephemeral fields included) to localStorage — identical to
  // pre-Sprint-24 behavior, so a caller that doesn't await this promise
  // still gets the localStorage write immediately (Sprint-24-Step-06 is
  // what makes the call site itself `await` this).
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));

  // Sprint-24-Step-07: mark local books as "not yet confirmed synced"
  // BEFORE attempting the push (pessimistic, per Step Card Rules) — if
  // this tab crashes/closes mid-fetch, the flag must already be set so the
  // next loadWorkspace() knows this attempt never got to report success.
  writeSyncPendingFlag(true);

  // Best-effort: also push `books` to the database. Never throws (see
  // pushBooksToApi) — a failure here is exactly the case the pending flag
  // above exists to remember for the next loadWorkspace().
  const pushed = await pushBooksToApi(workspace.books);
  if (pushed) writeSyncPendingFlag(false);
}
