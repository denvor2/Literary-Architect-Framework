import type { Book, Chapter } from "./model";

export type Workspace = {
  book: Book | null;
  chapters: readonly Chapter[];
  selectedChapterId: string | null;
  selectedSceneId: string | null;
};
