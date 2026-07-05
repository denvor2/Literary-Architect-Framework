// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. The second variant below (Sprint 08 Step 02)
// is the first one ever added — no router/registry abstraction was
// introduced; aiBus.ts dispatches on `type` directly.

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    }
  | {
      type: "critic_review";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    };
