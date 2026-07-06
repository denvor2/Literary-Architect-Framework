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
//
// Sprint-13-Step-02: the server remains fully stateless (ADR-0004) — the whole conversation
// history is sent by the client on every call, in `messages`, and nothing is kept between
// calls. `text` is renamed `sceneText` to match the shared schema across all four Experts;
// it remains required — Editor always works on a specific piece of text, never from scratch.
export async function POST(request: Request) {
  const body = await request.json();
  const sceneText = body?.sceneText;
  const bookContext = body?.bookContext;
  const messages = body?.messages;

  if (!sceneText || typeof sceneText !== "string") {
    return NextResponse.json(
      { ok: false, error: "No sceneText provided." },
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

  try {
    const client = getAnthropicClient();
    const contextMessage = {
      role: "user" as const,
      content: bookContext
        ? `Book context, for consistency only (character names, established plot facts) — do not use it to rewrite or expand the text beyond what is given below:\n${JSON.stringify(bookContext, null, 2)}\n\nText to edit:\n${sceneText}`
        : sceneText,
    };
    const anthropicMessages = [contextMessage, ...messages];
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a line editor. Fix grammar, punctuation, and word choice in the text the user gives you. Preserve the author's voice and meaning. Do not restructure the content. Return only the edited text, nothing else, unless the author asks a follow-up question about the edit in the conversation — then answer that question directly instead. If book context is provided, use it only to keep character names and established facts consistent — never use it to rewrite, extend, or add new content beyond the given text. The messages that follow may be an ongoing conversation about this same text, not just a single one-off request — take the prior exchange into account.",
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
