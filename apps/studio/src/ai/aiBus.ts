// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer).
//
// This is a structural seam, not real decoupling: for "improve_text" it
// calls /api/line-editor exactly as the UI did directly before Step 02 —
// same request, same response field, no added logic. It exists only so the
// UI never calls fetch("/api/line-editor") itself and never talks to AI
// except through an AIContextEnvelope, and never sees a raw response back —
// only an AppliedAIResponse. Caching, routing, and multi-model dispatch do
// not exist here yet (Sprint 07+).
//
// `envelope.context`, `AIResponse.meta`, and `AppliedAIResponse.domain` are
// deliberately unread/unused for logic below — Steps 04–06 introduce the
// data shapes only. `flags.isSceneAware` is hardcoded false: no scene-aware
// behavior exists yet. Scene-aware generation, critic/reader
// differentiation, memory injection, and multi-part responses (Sprint 07+)
// are what will eventually use them.

import type { AIContextEnvelope } from "./context";
import type { AppliedAIResponse } from "./applier";

export async function execute(
  envelope: AIContextEnvelope,
): Promise<AppliedAIResponse> {
  const { text } = envelope.operation.payload;
  const response = await fetch("/api/line-editor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error);
  }
  return {
    response: {
      text: data.result,
      meta: {
        operationType: envelope.operation.type,
      },
    },
    domain: envelope.context,
    flags: {
      isSceneAware: false,
    },
  };
}
