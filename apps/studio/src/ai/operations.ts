// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02 and
// Sprint 09 Step 02.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. Every added variant so far shares the same
// payload shape — no router/registry abstraction has been introduced;
// aiBus.ts dispatches on `type` directly.

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
    }
  | {
      type: "reader_reaction";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    };
