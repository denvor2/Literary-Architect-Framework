import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import type { BookFieldName, BookFieldRequestType } from "@/ai/operations";

// Sprint-21-Step-02: AI suggestion for Book metadata fields (ADR-0011).
// New endpoint — not an extension of an existing Expert, because this is a
// utility operation (suggest a metadata value), not a literary role.
//
// Sprint-25-Step-04 (ADR-0011 Amendment): optional `requestType` picks a
// typed prompt variant instead of the field's single generic prompt — so
// far only wired for `title` (three quick-request buttons in EditorArea.tsx:
// "подобрать аналоги" / "мозговой штурм" / "проверить на уникальность").
// Response shape stays exactly { suggestion, explanation } for every
// request type, including the analytical "uniqueness" one — the UI decides
// there whether to show "Принять" or not, not the response shape.

const SUPPORTED_FIELDS: readonly BookFieldName[] = [
  "title",
  "genre",
  "premise",
  "shortAnnotation",
  "fullAnnotation",
];

const FIELD_LABELS: Record<BookFieldName, string> = {
  title: "название книги",
  genre: "жанр",
  premise: "премис (завязка)",
  shortAnnotation: "краткая аннотация",
  fullAnnotation: "полная аннотация",
};

const FIELD_PROMPTS: Record<BookFieldName, string> = {
  title:
    "Suggest a compelling book title that reflects the premise, genre, and tone. The title should be concise (1-5 words) and memorable.",
  genre:
    "Suggest an appropriate genre or subgenre based on the book's premise, characters, and tone. Be specific (e.g. 'фэнтези' is too broad; 'героическое фэнтези' is better).",
  premise:
    "Suggest a clear, concise premise (1-2 sentences) that captures the core conflict and hook of the story based on the existing metadata and structure.",
  shortAnnotation:
    "Suggest a short annotation (2-3 sentences) that would entice a reader — focus on the hook, the main character, and the central conflict. Do not reveal the ending.",
  fullAnnotation:
    "Suggest a full annotation (4-6 sentences) that covers the premise, the main character's arc, the central conflict, and the stakes — written to entice a reader without spoilers.",
};

// Sprint-25-Step-04: typed prompt variants for `title`'s three quick-request
// buttons (ADR-0011 Amendment). Only `title` has variants so far — other
// fields ignore `requestType` if it's ever sent for them (see below) and
// keep using FIELD_PROMPTS.
const SUPPORTED_TITLE_REQUEST_TYPES: readonly BookFieldRequestType[] = [
  "comparables",
  "brainstorm",
  "uniqueness",
];

const TITLE_REQUEST_PROMPTS: Record<BookFieldRequestType, string> = {
  comparables:
    "The writer wants comparable titles for inspiration — real or plausible existing book titles that share genre, tone, or premise with this book. Respond with the comparable titles as the suggestion (a short list of 3-5 titles, separated by commas or semicolons) and explain briefly why they're comparable.",
  brainstorm:
    "The writer wants a brand-new brainstormed title idea — different from the current title and not a plain literal restatement of the premise. Be surprising, creative, and memorable. Respond with exactly ONE new candidate title as the suggestion, plus a brief explanation of the creative reasoning behind it.",
  uniqueness:
    "The writer wants an honest analytical verdict on how unique the current title is compared to existing, well-known books in the same or adjacent genres — this is NOT a request for a new title. Respond with a short verdict as the suggestion (e.g. 'Похоже на существующие книги: ...' or 'Выглядит достаточно уникальным') and put the supporting reasoning in the explanation. Do not invent fake comparable books — if unsure, say so honestly instead of guessing.",
};

export async function POST(request: Request) {
  const body = await request.json();
  const fieldName = body?.fieldName;
  const currentValue = body?.currentValue;
  const bookContext = body?.bookContext;

  if (
    typeof fieldName !== "string" ||
    !SUPPORTED_FIELDS.includes(fieldName as BookFieldName)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `fieldName must be one of: ${SUPPORTED_FIELDS.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (typeof currentValue !== "string") {
    return NextResponse.json(
      { ok: false, error: "currentValue must be a string." },
      { status: 400 },
    );
  }

  if (typeof bookContext !== "object" || bookContext === null) {
    return NextResponse.json(
      { ok: false, error: "bookContext is required and must be an object." },
      { status: 400 },
    );
  }

  // Sprint-25-Step-04: optional — validated when present, ignored (falls
  // back to the field's generic prompt) when absent, exactly preserving
  // pre-Sprint-25 behavior (ADR-0011 Amendment).
  const requestType = body?.requestType;
  if (
    requestType !== undefined &&
    (typeof requestType !== "string" ||
      !SUPPORTED_TITLE_REQUEST_TYPES.includes(
        requestType as BookFieldRequestType,
      ))
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `requestType must be one of: ${SUPPORTED_TITLE_REQUEST_TYPES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const bookLanguage =
    typeof bookContext.language === "string" && bookContext.language
      ? bookContext.language
      : "Russian";

  const safeFieldName = fieldName as BookFieldName;

  // Sprint-25-Step-04: only `title` has typed prompt variants so far — a
  // `requestType` sent for any other field is validated above but otherwise
  // ignored here, falling back to that field's existing generic prompt.
  const isTitleTypedRequest =
    safeFieldName === "title" && typeof requestType === "string";
  const effectivePrompt = isTitleTypedRequest
    ? TITLE_REQUEST_PROMPTS[requestType as BookFieldRequestType]
    : FIELD_PROMPTS[safeFieldName];
  // The "improve/repeat current value" framing only makes sense for the
  // default (generic) prompt — comparables/brainstorm/uniqueness are not
  // "improve the current title" requests.
  const contextRules = isTitleTypedRequest
    ? "- The suggestion must fit the book's existing context (premise, genre, characters, structure)."
    : "- The suggestion must fit the book's existing context (premise, genre, characters, structure).\n- If the current value is non-empty, improve it — don't just repeat it.\n- If the current value is empty, create a fitting value from scratch.";

  try {
    const client = getAnthropicClient();
    const contextMessage = {
      role: "user" as const,
      content: `Book context:\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent value of "${FIELD_LABELS[safeFieldName]}": ${currentValue || "(empty)"}`,
    };

    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system: `You are a literary assistant helping a writer with their book's metadata. ${effectivePrompt}\n\nRespond with ONLY a raw JSON object with this exact shape:\n{ "suggestion": "...", "explanation": "1-2 sentence justification" }\n\nRules:\n${contextRules}\n- The suggestion must be in ${bookLanguage}.\n- Respond with ONLY the raw JSON object — no markdown code fences, no explanation, no text before or after.\n- The JSON must be valid.`,
      messages: [contextMessage],
    });

    const block = message.content.find((item) => item.type === "text");
    const raw = block && block.type === "text" ? block.text : "";

    let parsed: { suggestion: string; explanation: string };
    try {
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI response was not valid JSON." },
        { status: 500 },
      );
    }

    if (
      typeof parsed.suggestion !== "string" ||
      typeof parsed.explanation !== "string"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI response missing 'suggestion' or 'explanation' string fields.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      suggestion: parsed.suggestion,
      explanation: parsed.explanation,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
