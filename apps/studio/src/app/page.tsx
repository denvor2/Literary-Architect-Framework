"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { EditorArea } from "@/components/EditorArea";
import { CharacterPanel } from "@/components/CharacterPanel";
import { AssistantPanel } from "@/components/AssistantPanel";
import { DeveloperTools } from "@/components/DeveloperTools";
import { NewBookDialog } from "@/components/NewBookDialog";
import { useWorkspaceController } from "@/workspace/useWorkspaceController";

export default function Home() {
  const {
    workspace,
    activeBook,
    books,
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    createBook,
    updateBook,
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
    selectBook,
    deselectAll,
    selectAssistantMode,
    appendMessage,
    createThread,
    renameThread,
    deleteThread,
    activeThreads,
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);
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

  // Clicking the already-active book returns to its overview (Sprint 10
  // behavior); clicking a different book switches to it.
  function handleSelectBook(bookId: string) {
    if (bookId === activeBookId) {
      deselectAll();
    } else {
      selectBook(bookId);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
      <Header />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {!isFocusMode && (
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
            onCreateChapter={createChapter}
            onCreateScene={createScene}
            collapsedChapterIds={collapsedChapterIds}
            onToggleChapterCollapsed={toggleChapterCollapsed}
          />
        )}
        {selectedCharacterId ? (
          <CharacterPanel
            character={selectedCharacter}
            onUpdate={(fields) => updateCharacter(selectedCharacterId, fields)}
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
          />
        )}
        {!isFocusMode && (
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
          />
        )}
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
    </div>
  );
}
