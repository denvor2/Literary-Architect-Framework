import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-12-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library. Unlike every prior Expert
// (Line Editor/Critic/Reader), Co-author is generative — it writes/continues text rather than
// assessing or editing existing text — and is the first Expert to receive the whole Book as
// context (all chapters/scenes/characters/metadata), not just the current scene.
//
// Sprint-13-Step-02: the server remains fully stateless (ADR-0004) — the whole conversation
// history is sent by the client on every call, in `messages`, and nothing is kept between
// calls. `currentText` is renamed `sceneText` to match the shared schema across all four
// Experts. Response shape is unchanged.
export async function POST(request: Request) {
  const body = await request.json();
  const bookContext = body?.bookContext;
  const messages = body?.messages;

  if (typeof bookContext !== "object" || bookContext === null) {
    return NextResponse.json(
      { ok: false, error: "bookContext is required and must be an object." },
      { status: 400 },
    );
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { ok: false, error: "messages must be an array." },
      { status: 400 },
    );
  }
  for (const item of messages) {
    if (
      typeof item !== "object" ||
      item === null ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Each message must have role 'user' or 'assistant' and string content.",
        },
        { status: 400 },
      );
    }
  }

  const sceneText = body?.sceneText ?? "";
  // Sprint-15-Step-01: the drafted/continued text must be written in the
  // book's own declared language, not a hardcoded one — for Co-author
  // specifically, "respond" means the actual manuscript prose, so this
  // matters even more directly than for the Review-producing Experts.
  const bookLanguage =
    typeof bookContext.language === "string" && bookContext.language
      ? bookContext.language
      : "Russian";

  try {
    const client = getAnthropicClient();
    const contextMessage = {
      role: "user" as const,
      content: `Book context (title, genre, language, premise, annotations, tags, all chapters/scenes, all characters):\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent scene text — continue it if non-empty; if empty, write a new scene draft fitting the book context:\n${sceneText}`,
    };
    const anthropicMessages = [contextMessage, ...messages];
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are a co-author — a generative writer, not a critic and not an editor. You will be given the entire book's context (metadata, all chapters and scenes written so far, all characters) and the current scene's text, followed by the ongoing conversation with the author about this scene. Use the full book context — plot, characters, established style and voice — when writing. If the current scene's text is non-empty, continue it directly, matching its style and picking up where it leaves off; if it is empty, write a new scene draft that fits the book's premise, characters, and what has already been written. This is a continuing dialogue, not a one-shot request: take the prior conversation into account, and if the author has not asked anything specific yet (no conversation so far), proceed directly to drafting or continuing the scene. Respond in ${bookLanguage}, regardless of the language of the input, unless the user explicitly asks for another language.`,
      messages: anthropicMessages,
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
