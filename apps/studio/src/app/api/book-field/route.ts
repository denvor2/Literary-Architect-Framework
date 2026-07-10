import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import type { BookFieldName } from "@/ai/operations";

// Sprint-21-Step-02: AI suggestion for Book metadata fields (ADR-0011).
// New endpoint — not an extension of an existing Expert, because this is a
// utility operation (suggest a metadata value), not a literary role.

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

export async function POST(request: Request) {
  const body = await request.json();
  const fieldName = body?.fieldName;
  const currentValue = body?.currentValue;
  const bookContext = body?.bookContext;

  if (typeof fieldName !== "string" || !SUPPORTED_FIELDS.includes(fieldName as BookFieldName)) {
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

  const bookLanguage =
    typeof bookContext.language === "string" && bookContext.language
      ? bookContext.language
      : "Russian";

  const safeFieldName = fieldName as BookFieldName;

  try {
    const client = getAnthropicClient();
    const contextMessage = {
      role: "user" as const,
      content: `Book context:\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent value of "${FIELD_LABELS[safeFieldName]}": ${currentValue || "(empty)"}`,
    };

    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system: `You are a literary assistant helping a writer with their book's metadata. ${FIELD_PROMPTS[safeFieldName]}\n\nRespond with ONLY a raw JSON object with this exact shape:\n{ "suggestion": "...", "explanation": "1-2 sentence justification" }\n\nRules:\n- The suggestion must fit the book's existing context (premise, genre, characters, structure).\n- If the current value is non-empty, improve it — don't just repeat it.\n- If the current value is empty, create a fitting value from scratch.\n- The suggestion must be in ${bookLanguage}.\n- Respond with ONLY the raw JSON object — no markdown code fences, no explanation, no text before or after.\n- The JSON must be valid.`,
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

    if (typeof parsed.suggestion !== "string" || typeof parsed.explanation !== "string") {
      return NextResponse.json(
        { ok: false, error: "AI response missing 'suggestion' or 'explanation' string fields." },
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
