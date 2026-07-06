import type { Book } from "./model";

export type Workspace = {
  books: readonly Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
  selectedAssistantMode: "coauthor" | "editor" | "critic" | "reader";
};
