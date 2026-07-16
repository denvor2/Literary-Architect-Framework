import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

export async function POST() {
  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with exactly: Connected." }],
    });
    const block = message.content.find((item) => item.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
