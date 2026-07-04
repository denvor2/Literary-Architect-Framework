// AI Operation Model — Sprint 06 Step 03.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. Only "improve_text" exists today — no
// router, no registry, no extensibility logic until a second operation
// type is actually needed.

export type AIOperation = {
  type: "improve_text";
  payload: {
    text: string;
    sceneId?: string;
    chapterId?: string;
  };
};
