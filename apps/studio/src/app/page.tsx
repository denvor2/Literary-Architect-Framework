"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { EditorArea } from "@/components/EditorArea";
import { CharacterPanel } from "@/components/CharacterPanel";
import { AssistantPanel } from "@/components/AssistantPanel";
import { SyncWarningBanner } from "@/components/SyncWarningBanner";
import { DeveloperTools } from "@/components/DeveloperTools";
import { NewBookDialog } from "@/components/NewBookDialog";
import { NewSeriesDialog } from "@/components/NewSeriesDialog";
import { SeriesEditDialog } from "@/components/SeriesEditDialog";
import { LoginDialog } from "@/components/LoginDialog";
import { RegisterDialog } from "@/components/RegisterDialog";
import { useWorkspaceController } from "@/workspace/useWorkspaceController";
import { useAuthController } from "@/hooks/useAuthController";
import { execute as aiBusExecute } from "@/ai/aiBus";
import type { BookFieldName } from "@/ai/operations";

// Sprint-25-Step-02: `react-resizable-panels`'s `Group` renders its own
// row/column flex layout via the `orientation` prop (JS-driven, not a CSS
// media query) — it doesn't automatically follow Tailwind's `lg:` breakpoint
// the way the rest of this file's plain utility classes do. This hook
// mirrors that same breakpoint (1024px, Tailwind's default `lg`) so the
// pre-existing mobile stacked layout (Sidebar/main content/AssistantPanel in
// one column, below `lg`) is preserved unchanged, and the resizable split
// only kicks in at the width where the two panels actually sit side by side.
// `useIsomorphicLayoutEffect` avoids the classic "matchMedia" flash: on the
// server (and on first client render, before hydration) `isDesktop` starts
// `false` — matching the server-rendered stacked markup exactly, so there is
// no hydration mismatch — then flips synchronously, before paint, on an
// actual desktop viewport.
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 1024px)";
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useIsDesktopLayout(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT_QUERY);
    setIsDesktop(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return isDesktop;
}

export default function Home() {
  // Sprint-30-Step-05: Authentication controller
  const { auth, login, register, logout } = useAuthController();

  // Sprint-30-Step-05: Auth dialog state
  const [authDialogMode, setAuthDialogMode] = useState<
    "login" | "register" | null
  >(null);

  // All workspace hooks must be called unconditionally, even if not logged in
  const {
    workspace,
    activeBook,
    books,
    series,
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    createBook,
    updateBook,
    deleteBook,
    deletedBooks,
    restoreBook,
    permanentlyDeleteBook,
    createChapter,
    updateChapter,
    createScene,
    updateSceneText,
    updateSceneTitle,
    selectChapter,
    selectScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    ideas,
    createIdea,
    updateIdea,
    deleteIdea,
    acceptStructureProposal,
    selectBook,
    deselectAll,
    selectAssistantMode,
    appendMessage,
    createThread,
    renameThread,
    deleteThread,
    activeThreads,
    syncWarning,
    createSeries,
    updateSeries,
    deleteSeries,
    // Sprint-29-Step-06: addBookToSeries and removeBookFromSeries imported for
    // future drag-drop UI (not yet implemented in this step)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addBookToSeries,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeBookFromSeries,
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Sprint-29-Step-06: Series dialog state
  const [isNewSeriesDialogOpen, setIsNewSeriesDialogOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [collapsedSeriesIds, setCollapsedSeriesIds] = useState<Set<string>>(
    new Set(),
  );
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);
  // Sprint-34-Design-Step-03: Sidebar collapse toggle for tablet layout
  // (768px-1024px, `md:` breakpoint). Ephemeral state, not persisted.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  // Sprint-25-Step-02: drives whether the main-content/AssistantPanel split
  // renders as a mouse-draggable divider (desktop, `lg:` and up) or the
  // pre-existing stacked mobile layout. See `useIsDesktopLayout` above.
  const isDesktopLayout = useIsDesktopLayout();
  // Sprint-13-Step-05: lifted from EditorArea so AssistantPanel (a sibling,
  // not a descendant) can read the current text selection for Critic/Reader
  // scoping — same technique as before (Sprint-08-Step-03), one level up.
  //
  // Sprint-16-17-Step-02: the unified view renders one `<textarea>` per
  // scene, so this ref is no longer attached via JSX `ref=` to a single
  // fixed node — `handleSceneFocus` below reassigns `.current` to whichever
  // scene's `<textarea>` the author most recently focused.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Which scene the author last clicked into — replaces the old exclusive
  // `selectedChapterId`/`selectedSceneId`-driven "current scene" concept for
  // AssistantPanel's purposes, now that every scene is visible/editable at
  // once. Falls back to the persisted selection (`selectedChapter`/
  // `selectedScene`) until the author focuses a scene in this session, so
  // AssistantPanel still has sensible context right after loading.
  const [focusedSceneKey, setFocusedSceneKey] = useState<{
    chapterId: string;
    sceneId: string;
  } | null>(null);

  function handleSceneFocus(
    chapterId: string,
    sceneId: string,
    element: HTMLTextAreaElement,
  ) {
    textareaRef.current = element;
    setFocusedSceneKey({ chapterId, sceneId });
  }

  const activeChapter = focusedSceneKey
    ? chapters.find((chapter) => chapter.id === focusedSceneKey.chapterId)
    : selectedChapter;
  const activeScene = focusedSceneKey
    ? activeChapter?.scenes.find(
        (scene) => scene.id === focusedSceneKey.sceneId,
      )
    : selectedScene;

  // Sprint-16-17-Step-03: сворачиваемость на всех уровнях единого вида.
  // Эфемерное UI-состояние (как isFocusMode) — не часть Workspace, не
  // персистится. Общее между EditorArea (сам блок) и Sidebar (индикатор в
  // дереве), поэтому поднято сюда, а не в EditorArea/Sidebar по отдельности.
  const [isChaptersCollapsed, setIsChaptersCollapsed] = useState(false);
  const [collapsedChapterIds, setCollapsedChapterIds] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedSceneIds, setCollapsedSceneIds] = useState<Set<string>>(
    new Set(),
  );

  // Sprint-21-Step-04: AI field suggestion state (ADR-0011) — ephemeral, not
  // persisted. Only one suggestion active at a time.
  const [fieldSuggestion, setFieldSuggestion] = useState<{
    fieldName: BookFieldName;
    suggestion: string;
    explanation: string;
  } | null>(null);
  const [isFieldSuggestionLoading, setIsFieldSuggestionLoading] =
    useState(false);

  function toggleChapterCollapsed(chapterId: string) {
    setCollapsedChapterIds((previous) => {
      const next = new Set(previous);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }

  function toggleSceneCollapsed(sceneId: string) {
    setCollapsedSceneIds((previous) => {
      const next = new Set(previous);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  }

  function toggleAllScenesInChapter(chapterId: string) {
    const chapter = chapters.find((candidate) => candidate.id === chapterId);
    if (!chapter) return;
    const allCurrentlyCollapsed = chapter.scenes.every((scene) =>
      collapsedSceneIds.has(scene.id),
    );
    setCollapsedSceneIds((previous) => {
      const next = new Set(previous);
      for (const scene of chapter.scenes) {
        if (allCurrentlyCollapsed) {
          next.delete(scene.id);
        } else {
          next.add(scene.id);
        }
      }
      return next;
    });
  }

  function getSelectedText(): string {
    const el = textareaRef.current;
    const sceneText = activeScene?.text ?? "";
    if (!el) return sceneText;
    const { selectionStart, selectionEnd, value } = el;
    if (
      selectionStart == null ||
      selectionEnd == null ||
      selectionStart === selectionEnd
    ) {
      return value;
    }
    return value.slice(selectionStart, selectionEnd);
  }

  // Sprint-21-Step-04: request AI suggestion for a Book field (ADR-0011).
  async function handleRequestFieldSuggestion(fieldName: BookFieldName) {
    if (!activeBook) return;
    setIsFieldSuggestionLoading(true);
    setFieldSuggestion(null);
    try {
      const currentValue = activeBook[fieldName] ?? "";
      const result = await aiBusExecute({
        operation: {
          type: "book_field_suggestion",
          payload: {
            fieldName,
            currentValue: Array.isArray(currentValue)
              ? currentValue.join(", ")
              : String(currentValue),
            bookContext: activeBook,
          },
        },
        context: {},
      });
      const parsed = JSON.parse(result.response.text);
      setFieldSuggestion({
        fieldName,
        suggestion: parsed.suggestion,
        explanation: parsed.explanation,
      });
    } catch {
      setFieldSuggestion(null);
    } finally {
      setIsFieldSuggestionLoading(false);
    }
  }

  function handleAcceptFieldSuggestion() {
    if (!fieldSuggestion || !activeBook) return;
    const { fieldName, suggestion } = fieldSuggestion;
    updateBook(activeBook.id, { [fieldName]: suggestion });
    setFieldSuggestion(null);
  }

  // Clicking the already-active book returns to its overview (Sprint 10
  // behavior); clicking a different book switches to it.
  function handleSelectBook(bookId: string) {
    if (bookId === activeBookId) {
      deselectAll();
    } else {
      selectBook(bookId);
    }
  }

  // Sprint-25-Step-06: same scroll mechanism as Sidebar.tsx's
  // scrollBlockIntoView (that file is a Forbidden path for this Step Card
  // — this is a deliberate, tiny duplicate, not a shared import).
  function scrollElementIntoView(elementId: string) {
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Handles a Header search result click for a Chapter or Scene match.
  // Must undo whichever collapse state would otherwise hide the target
  // block before scrolling to it (Step Card developed points 11-12): the
  // whole-book "collapse all chapters" toggle, the target chapter's own
  // collapse, and (so the matched text is actually visible, not just the
  // scene's title bar) the target scene's own collapse.
  function handleSelectSearchMatch(chapterId: string, sceneId?: string) {
    if (isChaptersCollapsed) setIsChaptersCollapsed(false);
    if (collapsedChapterIds.has(chapterId)) toggleChapterCollapsed(chapterId);
    if (sceneId && collapsedSceneIds.has(sceneId)) {
      toggleSceneCollapsed(sceneId);
    }
    if (sceneId) {
      selectScene(chapterId, sceneId);
    } else {
      selectChapter(chapterId);
    }
    const targetId = sceneId
      ? `scene-block-${sceneId}`
      : `chapter-block-${chapterId}`;
    requestAnimationFrame(() => {
      scrollElementIntoView(targetId);
    });
  }

  // Handles a Header search result click for an Idea/note match. Ideas
  // only render inside Sidebar.tsx, which Focus Mode hides entirely — the
  // target DOM node doesn't exist until Focus Mode is turned off first
  // (Step Card developed point 9).
  function handleSelectIdeaMatch(ideaId: string) {
    if (isFocusMode) setIsFocusMode(false);
    requestAnimationFrame(() => {
      scrollElementIntoView(`idea-block-${ideaId}`);
    });
  }

  // Sprint-30-Step-05: Show login dialog if not logged in (on mount only)
  const hasShownAuthDialog = useRef(false);
  useEffect(() => {
    if (!auth.isLoading && !auth.isLoggedIn && !hasShownAuthDialog.current) {
      hasShownAuthDialog.current = true;
      setAuthDialogMode("login");
    }
  }, [auth.isLoading, auth.isLoggedIn]);

  // Sprint-30-Step-05: If not logged in, show only auth screen
  if (!auth.isLoading && !auth.isLoggedIn) {
    return (
      <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
        <Header
          currentUser={null}
          onOpenLogin={() => setAuthDialogMode("login")}
        />
        {authDialogMode === "login" && (
          <LoginDialog
            error={auth.error}
            isLoading={false}
            onLogin={login}
            onSwitchToRegister={() => setAuthDialogMode("register")}
          />
        )}
        {authDialogMode === "register" && (
          <RegisterDialog
            error={auth.error}
            isLoading={false}
            onRegister={register}
            onSwitchToLogin={() => setAuthDialogMode("login")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
      <Header
        books={books}
        activeBookId={activeBookId}
        chapters={chapters}
        characters={characters}
        ideas={ideas}
        onSelectBook={handleSelectBook}
        onSelectCharacter={selectCharacter}
        onSelectSearchMatch={handleSelectSearchMatch}
        onSelectIdeaMatch={handleSelectIdeaMatch}
        currentUser={auth.user}
        onLogout={logout}
        onOpenLogin={() => setAuthDialogMode("login")}
      />
      <SyncWarningBanner warning={syncWarning} />
      {/* Sprint-34-Design-Step-03: Tablet layout (768-1024px) with hamburger menu */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Hamburger button for tablet (md: 768px+, hidden on lg: 1024px+) */}
        {!isFocusMode && (
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="absolute left-4 top-4 z-40 hidden rounded-md border border-zinc-300 p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 md:block lg:hidden"
            aria-label={isSidebarCollapsed ? "Открыть боковую панель" : "Закрыть боковую панель"}
            title="Навигация"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {/* Backdrop overlay for mobile sidebar (md:, closed on lg:) */}
        {!isFocusMode && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
            aria-hidden="true"
          />
        )}
        {/* Sidebar: hidden by default on md: (tablet), visible on lg: (desktop) */}
        {!isFocusMode && (
          <div
            className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 md:relative md:inset-auto md:z-auto md:w-auto md:bg-inherit md:dark:bg-inherit ${
              isSidebarCollapsed ? "hidden md:block" : "block md:block"
            } lg:static lg:block`}
          >
            <Sidebar
            books={books}
            activeBookId={activeBookId}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onSelectChapter={selectChapter}
            onSelectScene={selectScene}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={selectCharacter}
            onCreateCharacter={createCharacter}
            onSelectBook={handleSelectBook}
            onNewBook={() => setIsDialogOpen(true)}
            onDeleteBook={deleteBook}
            deletedBooks={deletedBooks}
            onRestoreBook={restoreBook}
            onPermanentlyDeleteBook={permanentlyDeleteBook}
            onCreateChapter={createChapter}
            onCreateScene={createScene}
            collapsedChapterIds={collapsedChapterIds}
            onToggleChapterCollapsed={toggleChapterCollapsed}
            ideas={ideas}
            onCreateIdea={createIdea}
            onUpdateIdea={updateIdea}
            onDeleteIdea={deleteIdea}
            // Sprint-29-Step-06: Series support
            series={series}
            collapsedSeriesIds={collapsedSeriesIds}
            onToggleSeriesCollapsed={(seriesId) =>
              setCollapsedSeriesIds((prev) => {
                const next = new Set(prev);
                if (next.has(seriesId)) {
                  next.delete(seriesId);
                } else {
                  next.add(seriesId);
                }
                return next;
              })
            }
            onCreateSeries={() => setIsNewSeriesDialogOpen(true)}
            onEditSeries={setEditingSeriesId}
            />
          </div>
        )}
        {(() => {
          const mainContent = selectedCharacterId ? (
            <CharacterPanel
              character={selectedCharacter}
              onUpdate={(fields) =>
                updateCharacter(selectedCharacterId, fields)
              }
              onDelete={() => deleteCharacter(selectedCharacterId)}
            />
          ) : (
            <EditorArea
              book={activeBook}
              chapters={chapters}
              onNewScene={createScene}
              onChangeSceneText={updateSceneText}
              onUpdateChapter={updateChapter}
              onUpdateSceneTitle={updateSceneTitle}
              onUpdateBook={updateBook}
              isFocusMode={isFocusMode}
              onToggleFocusMode={() => setIsFocusMode((value) => !value)}
              onSceneFocus={handleSceneFocus}
              isChaptersCollapsed={isChaptersCollapsed}
              onToggleChaptersCollapsed={() =>
                setIsChaptersCollapsed((value) => !value)
              }
              collapsedChapterIds={collapsedChapterIds}
              onToggleChapterCollapsed={toggleChapterCollapsed}
              collapsedSceneIds={collapsedSceneIds}
              onToggleSceneCollapsed={toggleSceneCollapsed}
              onToggleAllScenesInChapter={toggleAllScenesInChapter}
              onRequestFieldSuggestion={handleRequestFieldSuggestion}
              fieldSuggestion={fieldSuggestion}
              onAcceptFieldSuggestion={handleAcceptFieldSuggestion}
              onDismissFieldSuggestion={() => setFieldSuggestion(null)}
              isFieldSuggestionLoading={isFieldSuggestionLoading}
            />
          );

          if (isFocusMode) {
            // AssistantPanel doesn't render in Focus Mode (unchanged
            // behavior) — nothing to divide, render main content alone.
            return mainContent;
          }

          const assistantPanel = (
            <AssistantPanel
              book={activeBook}
              sceneText={activeScene?.text ?? ""}
              getSelectedText={getSelectedText}
              selectedMode={workspace.selectedAssistantMode}
              onSelectMode={selectAssistantMode}
              activeThreads={activeThreads}
              onAppendMessage={appendMessage}
              onCreateThread={createThread}
              onRenameThread={renameThread}
              onDeleteThread={deleteThread}
              onReplaceSceneText={
                activeChapter && activeScene
                  ? (text) =>
                      updateSceneText(activeChapter.id, activeScene.id, text)
                  : undefined
              }
              onAcceptStructureProposal={acceptStructureProposal}
            />
          );

          if (!isDesktopLayout) {
            // Below the `lg` breakpoint, keep the pre-existing stacked
            // layout (no resizable divider — same as before this step).
            return (
              <>
                {mainContent}
                {assistantPanel}
              </>
            );
          }

          // Sprint-25-Step-02: mouse-draggable 50/50 divider between the
          // main content area and AssistantPanel, `lg:` and up only. Chosen
          // mechanism: `react-resizable-panels` (see this step's ARP for
          // why). Position is not persisted — resets to 50/50 on reload, per
          // the Step Card's explicit "don't bother if non-trivial" note.
          return (
            <Group
              id="editor-assistant-group"
              orientation="horizontal"
              className="flex-1"
            >
              <Panel
                id="main-content-panel"
                defaultSize="50"
                minSize="20"
                aria-label="Основная область редактирования"
              >
                {mainContent}
              </Panel>
              <Separator
                id="editor-assistant-divider"
                className="w-1.5 shrink-0 cursor-col-resize bg-zinc-200 transition-colors hover:bg-zinc-300 active:bg-zinc-400 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
              />
              <Panel
                id="assistant-panel"
                defaultSize="50"
                minSize="20"
                aria-label="Панель помощников"
              >
                {assistantPanel}
              </Panel>
            </Group>
          );
        })()}
      </div>
      {!isFocusMode && <DeveloperTools />}

      {isDialogOpen && (
        <NewBookDialog
          onCancel={() => setIsDialogOpen(false)}
          onCreate={(newBook) => {
            createBook(newBook);
            setIsDialogOpen(false);
          }}
        />
      )}

      {/* Sprint-29-Step-06: Series dialogs */}
      {isNewSeriesDialogOpen && (
        <NewSeriesDialog
          onCancel={() => setIsNewSeriesDialogOpen(false)}
          onCreate={(title, description) => {
            createSeries(title, description);
            setIsNewSeriesDialogOpen(false);
          }}
        />
      )}

      {editingSeriesId &&
        (() => {
          const editingSeries = series.find((s) => s.id === editingSeriesId);
          return editingSeries ? (
            <SeriesEditDialog
              series={editingSeries}
              onCancel={() => setEditingSeriesId(null)}
              onSave={(title, description) => {
                updateSeries(editingSeriesId, title, description);
                setEditingSeriesId(null);
              }}
              onDelete={() => {
                deleteSeries(editingSeriesId);
                setEditingSeriesId(null);
              }}
            />
          ) : null;
        })()}
    </div>
  );
}
