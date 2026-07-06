import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-04-Step-05). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, no reuse beyond the
// existing single Anthropic integration point.
//
// Sprint-12-Step-02: bookContext is optional, additive context for consistency (character
// names, established plot facts) only — it does not change what this Expert does (polish the
// grammar/style of `text`), and its absence produces the exact same request/behavior as
// before this step. This changes an already-ratified contract (ADR-0004) — revisited in
// Sprint-12-Step-05.
export async function POST(request: Request) {
  const body = await request.json();
  const text = body?.text;
  const bookContext = body?.bookContext;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { ok: false, error: "No text provided." },
      { status: 400 },
    );
  }

  try {
    const client = getAnthropicClient();
    const userContent = bookContext
      ? `Book context, for consistency only (character names, established plot facts) — do not use it to rewrite or expand the text beyond what is given below:\n${JSON.stringify(bookContext, null, 2)}\n\nText to edit:\n${text}`
      : text;
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a line editor. Fix grammar, punctuation, and word choice in the text the user gives you. Preserve the author's voice and meaning. Do not restructure the content. Return only the edited text, nothing else. If book context is provided, use it only to keep character names and established facts consistent — never use it to rewrite, extend, or add new content beyond the given text.",
      messages: [{ role: "user", content: userContent }],
    });
    const block = message.content.find((item) => item.type === "text");
    const result = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
