import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-09-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape — a reader's reaction is a whole
// piece of text, not a structured list like /api/critic.
export async function POST(request: Request) {
  const body = await request.json();
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { ok: false, error: "No text provided." },
      { status: 400 },
    );
  }

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a reader reacting to the text the user gives you — not an editor and not a literary critic. Do not comment on grammar, punctuation, or wording. Do not produce a structured, categorized assessment. Instead, share your subjective impressions as an engaged reader: what caught your attention, what confused or surprised you, how the pacing felt, what you expect or hope happens next. Write your reaction as flowing prose, in your own voice, not as a list. Respond in Russian, regardless of the language of the text you are given, unless the user explicitly asks for another language.",
      messages: [{ role: "user", content: text }],
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
