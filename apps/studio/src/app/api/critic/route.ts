import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-08-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape.
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
        'You are a literary critic. Analyze the text the user gives you and identify concrete issues across these categories: Plot, Characters, Pacing, Style, Dialogue, General. For each issue found, produce one entry with exactly these fields: "category" (one of "Plot", "Characters", "Pacing", "Style", "Dialogue", "General"), "severity" (one of "low", "medium", "high"), and "comment" (a short explanation of the issue). If you find no issues, return an empty array. Respond with ONLY a raw JSON array of such entries — no markdown code fences, no explanation, no text before or after the array.',
      messages: [{ role: "user", content: text }],
    });
    const block = message.content.find((item) => item.type === "text");
    const raw = block && block.type === "text" ? block.text : "";

    let reviews;
    try {
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      reviews = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Critic response was not valid JSON." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
