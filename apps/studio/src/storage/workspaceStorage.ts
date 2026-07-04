// Workspace persistence — Sprint 06 Step 07 (extraction only).
//
// Moved out of page.tsx unchanged: same key, same JSON shape, same
// fallback-to-empty behavior on missing/corrupted data. No versioning, no
// validation, no async API, no repository — a straight lift of the
// existing logic.

import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";

const EMPTY_WORKSPACE: Workspace = {
  book: null,
  chapters: [],
  selectedChapterId: null,
  selectedSceneId: null,
};

export function loadWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Workspace) : EMPTY_WORKSPACE;
  } catch {
    return EMPTY_WORKSPACE;
  }
}

export function saveWorkspace(workspace: Workspace): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
