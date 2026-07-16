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
// (the Sprint-24-Step-04 coarse endpoint).
//
// Sprint-37-Step-03 (ADR-0017 database-primary): Complete refactor to make
// the database the primary source of truth. loadWorkspace() now tries the
// database first, falling back to localStorage only if the database is
// unavailable (network error, non-2xx response, etc.). saveWorkspace()
// writes to the database first; if that fails, falls back to localStorage
// and sets syncStatus='offline' for UI signaling. SYNC_PENDING_KEY workaround
// is removed — the simpler database-first logic eliminates the race
// conditions it existed to handle. Ephemeral UI state (activeBookId,
// selectedChapterId, etc.) is split into separate functions and remains
// localStorage-only, never stored in the database per ADR-0017.

import type {
  AssistantThread,
  AssistantThreads,
  Book,
  Chapter,
  Character,
  Scene,
  Idea,
} from "@/domain/model";
import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";
const EPHEMERAL_STATE_KEY = "literary-studio-ephemeral-state";

// Sprint-37-Step-03 (ADR-0017): Simplified sync warning. Only tracks
// "db-unavailable" — the database-first architecture eliminates the race
// condition that required "recovered-local-wins" in ADR-0012. This signal
// is consumed by SyncStatusBanner to show user that changes are being
// saved locally until the database recovers.
export type SyncWarning = "db-unavailable";

// Module-level, not persisted — this signal is about the current tab's
// session state, tracking if the most recent API call(s) failed.
let syncWarning: SyncWarning | null = null;

export function getSyncWarning(): SyncWarning | null {
  return syncWarning;
}

const EMPTY_WORKSPACE: Workspace = {
  books: [],
  series: [], // Sprint-29-Step-05: initially empty series collection
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
    seriesId: book.seriesId,
    deletedAt: book.deletedAt,
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
      series: [], // Sprint-29-Step-05: no series in old format
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

// Sprint-37-Step-03: Extract only ephemeral UI state from localStorage.
// These fields are never stored in the database (per ADR-0017).
// Also persists deletedBooks since they may be client-only (not synced to DB yet).
export function readLocalEphemeralState(): Partial<Workspace> & {
  deletedBooks?: readonly Book[];
  deletedScenes?: readonly Scene[];
  deletedCharacters?: readonly Character[];
  deletedChapters?: readonly Chapter[];
  deletedIdeas?: readonly Idea[];
} {
  try {
    const raw = window.localStorage.getItem(EPHEMERAL_STATE_KEY);
    if (!raw) {
      return {
        activeBookId: null,
        selectedChapterId: null,
        selectedSceneId: null,
        selectedCharacterId: null,
        selectedAssistantMode: "editor",
        deletedBooks: [],
      };
    }
    const data = JSON.parse(raw) as Partial<Workspace> & {
      deletedBooks?: unknown;
      deletedScenes?: unknown;
      deletedCharacters?: unknown;
      deletedChapters?: unknown;
      deletedIdeas?: unknown;
    };
    return {
      activeBookId:
        typeof data.activeBookId === "string" ? data.activeBookId : null,
      selectedChapterId:
        typeof data.selectedChapterId === "string"
          ? data.selectedChapterId
          : null,
      selectedSceneId:
        typeof data.selectedSceneId === "string" ? data.selectedSceneId : null,
      selectedCharacterId:
        typeof data.selectedCharacterId === "string"
          ? data.selectedCharacterId
          : null,
      selectedAssistantMode:
        data.selectedAssistantMode === "coauthor" ||
        data.selectedAssistantMode === "editor" ||
        data.selectedAssistantMode === "critic" ||
        data.selectedAssistantMode === "reader"
          ? data.selectedAssistantMode
          : "editor",
      deletedBooks: Array.isArray(data.deletedBooks)
        ? (data.deletedBooks as Book[])
        : [],
      deletedScenes: Array.isArray(data.deletedScenes)
        ? (data.deletedScenes as Scene[])
        : [],
      deletedCharacters: Array.isArray(data.deletedCharacters)
        ? (data.deletedCharacters as Character[])
        : [],
      deletedChapters: Array.isArray(data.deletedChapters)
        ? (data.deletedChapters as Chapter[])
        : [],
      deletedIdeas: Array.isArray(data.deletedIdeas)
        ? (data.deletedIdeas as Idea[])
        : [],
    };
  } catch {
    return {
      activeBookId: null,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
      selectedAssistantMode: "editor",
      deletedBooks: [],
      deletedScenes: [],
      deletedCharacters: [],
      deletedChapters: [],
      deletedIdeas: [],
    };
  }
}

// Sprint-37-Step-03: Write only ephemeral UI state to localStorage. Never
// writes `books` or `series` here — those are database-only. This function
// is called after successful database writes to keep UI navigation state
// in localStorage.
// Also persists deletedBooks since they may be client-only (not synced to DB yet).
export function writeLocalEphemeralState(
  workspace: Workspace,
  deletedBooks?: readonly Book[],
  deletedScenes?: readonly Scene[],
  deletedCharacters?: readonly Character[],
  deletedChapters?: readonly Chapter[],
  deletedIdeas?: readonly Idea[],
): void {
  try {
    const ephemeralState = {
      activeBookId: workspace.activeBookId,
      selectedChapterId: workspace.selectedChapterId,
      selectedSceneId: workspace.selectedSceneId,
      selectedCharacterId: workspace.selectedCharacterId,
      selectedAssistantMode: workspace.selectedAssistantMode,
      deletedBooks: deletedBooks ?? [],
      deletedScenes: deletedScenes ?? [],
      deletedCharacters: deletedCharacters ?? [],
      deletedChapters: deletedChapters ?? [],
      deletedIdeas: deletedIdeas ?? [],
    };
    console.log("[TRASH] writeLocalEphemeralState - saving deletedBooks count:", deletedBooks?.length ?? 0);
    console.log("[TRASH] writeLocalEphemeralState - saving deletedScenes count:", deletedScenes?.length ?? 0);
    console.log("[TRASH] writeLocalEphemeralState - saving deletedCharacters count:", deletedCharacters?.length ?? 0);
    console.log("[TRASH] writeLocalEphemeralState - saving deletedChapters count:", deletedChapters?.length ?? 0);
    console.log("[TRASH] writeLocalEphemeralState - saving deletedIdeas count:", deletedIdeas?.length ?? 0);
    window.localStorage.setItem(
      EPHEMERAL_STATE_KEY,
      JSON.stringify(ephemeralState),
    );
  } catch (err) {
    console.error("[TRASH] Failed to write ephemeral state:", err);
  }
}

// Synchronous localStorage read of the full workspace (for fallback only).
// This reads the old STORAGE_KEY format and performs migration if needed.
// Sprint-37-Step-03: This is now used only as a fallback when the database
// is unavailable or on first load if localStorage has older data (migration).
function readLocalWorkspaceForFallback(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // No old data — construct fallback with ephemeral state
      return {
        ...EMPTY_WORKSPACE,
        ...readLocalEphemeralState(),
      };
    }
    const migrated = migrateIfNeeded(JSON.parse(raw));
    // Merge with ephemeral state from separate key if it exists
    const ephemeral = readLocalEphemeralState();
    return {
      ...migrated,
      ...ephemeral,
    };
  } catch {
    return {
      ...EMPTY_WORKSPACE,
      ...readLocalEphemeralState(),
    };
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
    const response = await fetch("/api/workspace", {
      credentials: "include", // CRITICAL: Send JWT token in httpOnly cookie
    });
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

// Fetch series from /api/series endpoint. Same error handling as books.
async function fetchSeriesFromApi(): Promise<readonly import("@/domain/model").Series[] | null> {
  try {
    const response = await fetch("/api/series", {
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { ok?: boolean; series?: unknown };
    if (!data.ok || !Array.isArray(data.series)) {
      return null;
    }
    return data.series as import("@/domain/model").Series[];
  } catch {
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
      credentials: "include", // CRITICAL: Send JWT token in httpOnly cookie
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
  // Sprint-37-Step-03 (ADR-0017 database-primary): Load books from the
  // database first. If the database is unavailable, fall back to localStorage
  // and set syncWarning to signal the UI (SyncStatusBanner will show offline).
  // Ephemeral UI state (activeBookId, selectedChapterId, etc.) always comes
  // from localStorage, never from the database.
  // Sprint-29-Step-05 (Updated): Also load series from /api/series.

  const ephemeralState = readLocalEphemeralState();
  const dbBooks = await fetchBooksFromApi();
  const dbSeries = await fetchSeriesFromApi();

  if (dbBooks === null) {
    // Database is unavailable (network error, non-2xx response, malformed
    // body, or timeout). Fall back to localStorage entirely (ADR-0017
    // Decision 2: hybrid fallback). The SyncStatusBanner will show that
    // changes are being saved locally.
    return readLocalWorkspaceForFallback();
  }

  if (dbBooks.length > 0) {
    // Database has books — use them as the source of truth. Combine with
    // ephemeral state from localStorage for UI navigation.
    const normalizedBooks = dbBooks.map((book) =>
      normalizeBook(book as Partial<Book>),
    );
    return {
      books: normalizedBooks,
      series: dbSeries ?? [], // Load from /api/series, fallback to empty if unavailable
      activeBookId: ephemeralState.activeBookId ?? null,
      selectedChapterId: ephemeralState.selectedChapterId ?? null,
      selectedSceneId: ephemeralState.selectedSceneId ?? null,
      selectedCharacterId: ephemeralState.selectedCharacterId ?? null,
      selectedAssistantMode: ephemeralState.selectedAssistantMode ?? "editor",
    };
  }

  // Database is empty but might have older data in localStorage (migration
  // scenario from before Sprint-37). Check localStorage for books to migrate.
  const localWorkspace = readLocalWorkspaceForFallback();
  if (localWorkspace.books.length > 0) {
    // Attempt one best-effort migration push to the database. Whether it
    // succeeds or not, return the local books (already normalized) — the
    // next saveWorkspace() will retry if this push failed.
    await pushBooksToApi(localWorkspace.books);
  }

  return localWorkspace;
}

export async function saveWorkspace(
  workspace: Workspace,
  deletedBooks?: readonly Book[],
  deletedScenes?: readonly Scene[],
  deletedCharacters?: readonly Character[],
  deletedChapters?: readonly Chapter[],
  deletedIdeas?: readonly Idea[],
): Promise<void> {
  // Sprint-37-Step-03 (ADR-0017 database-primary): Try to save `books` to
  // the database first. If successful, persist ephemeral UI state to
  // localStorage. If the database is unavailable, fall back to localStorage
  // and set syncWarning to signal the UI.

  // Try the database first
  const pushed = await pushBooksToApi(workspace.books);

  if (pushed) {
    // Database write succeeded — save ephemeral state to localStorage and
    // clear any offline warning (the next successful API call will clear
    // syncWarning if it was set).
    writeLocalEphemeralState(
      workspace,
      deletedBooks,
      deletedScenes,
      deletedCharacters,
      deletedChapters,
      deletedIdeas,
    );
  } else {
    // Database write failed — fall back to localStorage. This stores both
    // books and ephemeral state, so the next loadWorkspace() after
    // reconnection can restore the full state. syncWarning is already set
    // by pushBooksToApi() to "db-unavailable", signaling the UI to show
    // the SyncStatusBanner (offline mode).
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Best-effort: if localStorage is also broken, continue anyway —
      // the next saveWorkspace() will retry the database push.
    }
  }
}
