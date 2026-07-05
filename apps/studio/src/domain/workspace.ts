import type { Book, Chapter, Character } from "./model";

export type Workspace = {
  book: Book | null;
  chapters: readonly Chapter[];
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  characters: readonly Character[];
  selectedCharacterId: string | null;
};
