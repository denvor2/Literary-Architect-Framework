import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-12-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library. Unlike every prior Expert
// (Line Editor/Critic/Reader), Co-author is generative — it writes/continues text rather than
// assessing or editing existing text — and is the first Expert to receive the whole Book as
// context (all chapters/scenes/characters/metadata), not just the current scene.
export async function POST(request: Request) {
  const body = await request.json();
  const currentText = body?.currentText;
  const bookContext = body?.bookContext;

  if (typeof currentText !== "string") {
    return NextResponse.json(
      { ok: false, error: "currentText must be a string (may be empty)." },
      { status: 400 },
    );
  }

  if (typeof bookContext !== "object" || bookContext === null) {
    return NextResponse.json(
      { ok: false, error: "bookContext is required and must be an object." },
      { status: 400 },
    );
  }

  try {
    const client = getAnthropicClient();
    const userContent = `Book context (title, genre, language, premise, annotations, tags, all chapters/scenes, all characters):\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent scene text — continue it if non-empty; if empty, write a new scene draft fitting the book context:\n${currentText}`;
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a co-author — a generative writer, not a critic and not an editor. You will be given the entire book's context (metadata, all chapters and scenes written so far, all characters) and the current scene's text. Use the full book context — plot, characters, established style and voice — when writing. If the current scene's text is non-empty, continue it directly, matching its style and picking up where it leaves off. If it is empty, write a new scene draft that fits the book's premise, characters, and what has already been written. Respond in Russian, regardless of the language of the input, unless the user explicitly asks for another language.",
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
