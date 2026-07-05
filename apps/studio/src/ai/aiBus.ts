// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert),
// Sprint 09 Step 02 (third Expert, third branch).
//
// It exists only so the UI never calls fetch() on an Expert route itself and
// never talks to AI except through an AIContextEnvelope, and never sees a
// raw response back — only an AppliedAIResponse. Caching, multi-model
// dispatch, and provider abstraction do not exist here yet.
//
// `envelope.context` and `AppliedAIResponse.domain` are deliberately
// unread/unused for logic below — Step 04/06 introduced the data shapes
// only. `flags.isSceneAware` is hardcoded false: no scene-aware behavior
// exists yet.

import type { AIContextEnvelope } from "./context";
import type { AppliedAIResponse } from "./applier";

export async function execute(
  envelope: AIContextEnvelope,
): Promise<AppliedAIResponse> {
  const { operation } = envelope;
  const { text } = operation.payload;

  let resultText: string;

  if (operation.type === "improve_text") {
    const response = await fetch("/api/line-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = data.result;
  } else if (operation.type === "critic_review") {
    const response = await fetch("/api/critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // TODO Sprint-08-Step-03: unpack into typed ReviewResult instead of
    // stringifying into AIResponse.text — AIResponse/AppliedAIResponse are
    // still shaped for a single text result and are not reworked here.
    resultText = JSON.stringify(data.reviews);
  } else if (operation.type === "reader_reaction") {
    const response = await fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // No stringify/TODO needed here — this Expert's response is already a
    // plain string, the same shape AIResponse.text expects natively.
    resultText = data.result;
  } else {
    const exhaustiveCheck: never = operation;
    throw new Error(
      `Unknown operation type: ${JSON.stringify(exhaustiveCheck)}`,
    );
  }

  return {
    response: {
      text: resultText,
      meta: {
        operationType: operation.type,
      },
    },
    domain: envelope.context,
    flags: {
      isSceneAware: false,
    },
  };
}
