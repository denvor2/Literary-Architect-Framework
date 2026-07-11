// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert),
// Sprint 09 Step 02 (third Expert, third branch), Sprint 12 Step 03 (fourth
// branch — Co-author, plus optional bookContext forwarded for Editor),
// Sprint 13 Step 03 (sceneText renaming + messages forwarded to every
// route, matching each route's Sprint-13-Step-02 schema).
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

  let resultText: string;

  if (operation.type === "improve_text") {
    const { sceneText, bookContext, messages } = operation.payload;
    const response = await fetch("/api/line-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        bookContext
          ? { sceneText, bookContext, messages }
          : { sceneText, messages },
      ),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = data.result;
  } else if (operation.type === "critic_review") {
    const { sceneText, messages, bookLanguage, subcategory } =
      operation.payload;
    const response = await fetch("/api/critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneText,
        messages,
        ...(bookLanguage ? { bookLanguage } : {}),
        ...(subcategory ? { subcategory } : {}),
      }),
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
    const { sceneText, messages, persona, bookLanguage } = operation.payload;
    const response = await fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneText,
        messages,
        ...(persona ? { persona } : {}),
        ...(bookLanguage ? { bookLanguage } : {}),
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // No stringify/TODO needed here — this Expert's response is already a
    // plain string, the same shape AIResponse.text expects natively.
    resultText = data.result;
  } else if (operation.type === "coauthor_draft") {
    const { sceneText, bookContext, messages } = operation.payload;
    const response = await fetch("/api/coauthor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneText, bookContext, messages }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // Same as reader_reaction — /api/coauthor's response is already a plain
    // string, no stringify/TODO needed.
    resultText = data.result;
  } else if (operation.type === "coauthor_propose_structure") {
    const { bookContext, messages } = operation.payload;
    const response = await fetch("/api/coauthor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookContext, messages, mode: "structure" }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // Structure proposals return structured JSON, not text — serialize for
    // the shared AIResponse.text transport, same pattern as critic_review.
    resultText = JSON.stringify(data.proposal);
  } else if (operation.type === "book_field_suggestion") {
    const { fieldName, currentValue, bookContext, requestType } =
      operation.payload;
    const response = await fetch("/api/book-field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldName,
        currentValue,
        bookContext,
        // Sprint-25-Step-04: forwarded only when present — keeps the
        // request shape identical to before for callers that don't pass it.
        ...(requestType ? { requestType } : {}),
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = JSON.stringify({
      suggestion: data.suggestion,
      explanation: data.explanation,
    });
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
