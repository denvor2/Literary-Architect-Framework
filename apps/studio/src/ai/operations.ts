// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02,
// Sprint 09 Step 02, and Sprint 12 Step 03.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. aiBus.ts dispatches on `type` directly —
// no router/registry abstraction has been introduced.
//
// Sprint-12-Step-03: `improve_text` gained an optional `bookContext` (for
// Editor consistency, ADR-0004 revisited); the fourth variant below is the
// first with a genuinely different payload shape (`currentText` instead of
// `text`, `bookContext` required not optional) — `critic_review`/
// `reader_reaction` are unaffected, they are outside the "sees the whole
// book" context table.
//
// `Book` is reused directly as `bookContext`'s type — the backend does not
// validate this structure strictly, and the `id` fields it carries are
// harmless in this context, so no stripped-down/simplified type was
// introduced just for this.

import type { Book } from "@/domain/model";

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
        bookContext?: Book;
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
    }
  | {
      type: "coauthor_draft";
      payload: {
        currentText: string;
        bookContext: Book;
      };
    };
