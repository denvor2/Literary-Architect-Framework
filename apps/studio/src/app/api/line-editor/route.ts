import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-04-Step-05). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, no reuse beyond the
// existing single Anthropic integration point.
export async function POST(request: Request) {
  const body = await request.json();
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ ok: false, error: "No text provided." }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a line editor. Fix grammar, punctuation, and word choice in the text the user gives you. Preserve the author's voice and meaning. Do not restructure the content. Return only the edited text, nothing else.",
      messages: [{ role: "user", content: text }],
    });
    const block = message.content.find((item) => item.type === "text");
    const result = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
