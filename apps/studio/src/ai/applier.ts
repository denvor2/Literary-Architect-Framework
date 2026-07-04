// Domain Applier — Sprint 06 Step 06 (no-effect layer).
//
// Wraps an AIResponse with domain context and a capability flag. Purely
// informational: `domain` must never drive logic and `flags.isSceneAware`
// stays false until Sprint 07 actually implements scene-aware rewriting.

import type { AIResponse } from "./response";

export type AppliedAIResponse = {
  response: AIResponse;
  domain: {
    sceneId?: string;
    chapterId?: string;
    bookTitle?: string;
  };
  flags: {
    isSceneAware: boolean;
  };
};
