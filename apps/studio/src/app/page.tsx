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
    activeThreads,
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);
  // Sprint-13-Step-05: lifted from EditorArea so AssistantPanel (a sibling,
  // not a descendant) can read the current text selection for Critic/Reader
  // scoping — same technique as before (Sprint-08-Step-03), one level up.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function getSelectedText(): string {
    const el = textareaRef.current;
    const sceneText = selectedScene?.text ?? "";
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
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onNewScene={createScene}
            onChangeSceneText={updateSceneText}
            onUpdateChapter={updateChapter}
            onUpdateSceneTitle={updateSceneTitle}
            onUpdateBook={updateBook}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((value) => !value)}
            textareaRef={textareaRef}
          />
        )}
        {!isFocusMode && (
          <AssistantPanel
            book={activeBook}
            sceneText={selectedScene?.text ?? ""}
            getSelectedText={getSelectedText}
            selectedMode={workspace.selectedAssistantMode}
            onSelectMode={selectAssistantMode}
            activeThreads={activeThreads}
            onAppendMessage={appendMessage}
            onCreateThread={createThread}
            onReplaceSceneText={
              selectedChapter && selectedScene
                ? (text) =>
                    updateSceneText(selectedChapter.id, selectedScene.id, text)
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
