// AI Context Envelope — Sprint 06 Step 04.
//
// Wraps an AIOperation with structural context data. This is pure data
// shape only — no builders, no factories, and the AI Bus must not read
// `context` yet (see aiBus.ts). It exists so scene/chapter/book identity
// travels alongside a request without being folded into the operation
// payload itself.

import type { AIOperation } from "./operations";

export type AIContextEnvelope = {
  operation: AIOperation;
  context: {
    sceneId?: string;
    chapterId?: string;
    bookTitle?: string;
  };
};
