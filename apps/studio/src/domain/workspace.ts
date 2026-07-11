import type { Book, Series } from "./model";

export type Workspace = {
  books: readonly Book[];
  series: readonly Series[]; // Sprint-29-Step-05: collection of series
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
  selectedAssistantMode: "coauthor" | "editor" | "critic" | "reader";
};
