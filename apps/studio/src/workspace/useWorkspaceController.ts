"use client";

import { useEffect, useState } from "react";
import type { Book, Chapter, Character } from "@/domain/model";
import type { Workspace } from "@/domain/workspace";
import { loadWorkspace, saveWorkspace } from "@/storage/workspaceStorage";

// Used only as the pre-hydration initial state (see the restore effect
// below) — must match server render, so it cannot itself call
// loadWorkspace(), which depends on window.localStorage.
const EMPTY_WORKSPACE: Workspace = {
  book: null,
  chapters: [],
  selectedChapterId: null,
  selectedSceneId: null,
  characters: [],
  selectedCharacterId: null,
};

// Owns the Workspace domain state and every operation that mutates it —
// extracted unchanged from page.tsx (Sprint 06 Step 09). No new behavior:
// each exported function here is a straight move of the previous handler,
// same body, same call sites.
export function useWorkspaceController() {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [isLoaded, setIsLoaded] = useState(false);
  const {
    book,
    chapters,
    selectedChapterId,
    selectedSceneId,
    characters,
    selectedCharacterId,
  } = workspace;

  // Restore the previous workspace once, on mount. This intentionally
  // synchronizes React state from an external system (localStorage), which
  // cannot be read during server rendering — an effect is the correct,
  // hydration-safe place for it, even though the linter's general-purpose
  // heuristic flags the first setState call inside an effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkspace(loadWorkspace());
    setIsLoaded(true);
  }, []);

  // Persist the whole workspace under one key whenever it changes — but only
  // after the initial restore above has run, so we never overwrite existing
  // saved data with the default empty state during the first render.
  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace);
  }, [workspace, isLoaded]);

  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );
  const selectedCharacter = characters.find(
    (character) => character.id === selectedCharacterId,
  );

  function createBook(newBook: Book) {
    setWorkspace({
      book: newBook,
      chapters: [
        {
          id: "1",
          title: "Chapter 1",
          subtitle: "",
          scenes: [{ id: "1", title: "Scene 1", text: "" }],
        },
      ],
      selectedChapterId: null,
      selectedSceneId: null,
      // A new book starts with no characters — the writer adds them later.
      characters: [],
      selectedCharacterId: null,
    });
  }

  function createChapter() {
    setWorkspace((previous) => {
      const nextNumber = previous.chapters.length + 1;
      const newChapter: Chapter = {
        id: String(nextNumber),
        title: `Chapter ${nextNumber}`,
        subtitle: "",
        scenes: [{ id: "1", title: "Scene 1", text: "" }],
      };
      return {
        ...previous,
        chapters: [...previous.chapters, newChapter],
        selectedChapterId: newChapter.id,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function updateChapter(
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) {
    setWorkspace((previous) => ({
      ...previous,
      chapters: previous.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, ...fields } : chapter,
      ),
    }));
  }

  function createScene(chapterId?: string) {
    setWorkspace((previous) => {
      const targetChapterId = chapterId ?? previous.selectedChapterId;
      if (!targetChapterId) return previous;
      return {
        ...previous,
        chapters: previous.chapters.map((chapter) => {
          if (chapter.id !== targetChapterId) return chapter;
          const nextNumber = chapter.scenes.length + 1;
          return {
            ...chapter,
            scenes: [
              ...chapter.scenes,
              {
                id: String(nextNumber),
                title: `Scene ${nextNumber}`,
                text: "",
              },
            ],
          };
        }),
      };
    });
  }

  function updateSceneText(chapterId: string, sceneId: string, text: string) {
    setWorkspace((previous) => ({
      ...previous,
      chapters: previous.chapters.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, text } : scene,
          ),
        };
      }),
    }));
  }

  function selectChapter(chapterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  function selectScene(chapterId: string, sceneId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: sceneId,
      selectedCharacterId: null,
    }));
  }

  function createCharacter() {
    setWorkspace((previous) => {
      const nextNumber = previous.characters.length + 1;
      const newCharacter: Character = {
        id: String(nextNumber),
        name: "",
        description: "",
        notes: "",
        photoUrl: "",
      };
      return {
        ...previous,
        characters: [...previous.characters, newCharacter],
        selectedCharacterId: newCharacter.id,
        selectedChapterId: null,
        selectedSceneId: null,
      };
    });
  }

  function updateCharacter(
    characterId: string,
    fields: Partial<
      Pick<Character, "name" | "description" | "notes" | "photoUrl">
    >,
  ) {
    setWorkspace((previous) => ({
      ...previous,
      characters: previous.characters.map((character) =>
        character.id === characterId
          ? { ...character, ...fields }
          : character,
      ),
    }));
  }

  function deleteCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      characters: previous.characters.filter(
        (character) => character.id !== characterId,
      ),
    }));
  }

  function selectCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedCharacterId: characterId,
      selectedChapterId: null,
      selectedSceneId: null,
    }));
  }

  function selectBook() {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  return {
    workspace,
    book,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    createBook,
    createChapter,
    updateChapter,
    createScene,
    updateSceneText,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    selectBook,
  };
}
