import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-08-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape.
//
// Sprint-13-Step-02: the server remains fully stateless (ADR-0004) — the whole conversation
// history is sent by the client on every call, in `messages`, and nothing is kept between
// calls. `text` is renamed `sceneText` to match the shared schema across all four Experts.
// Critic/Reader are outside the per-Expert context-scope table (ADR-0008) — no `bookContext`
// field exists here, not even optionally.
// Sprint-15-Step-01: `bookLanguage` — deliberately just the language string,
// not the whole `bookContext` object that Editor/Co-author receive. Critic
// stays scene/selection-scoped by design (ADR-0008's per-Expert
// context-scope table) — this is the minimal addition that lets Critic's
// comments follow the book's declared language without widening that scope.
export async function POST(request: Request) {
  const body = await request.json();
  const sceneText = body?.sceneText;
  const messages = body?.messages;
  const bookLanguage =
    typeof body?.bookLanguage === "string" && body.bookLanguage
      ? body.bookLanguage
      : "Russian";

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
    const contextMessage = { role: "user" as const, content: sceneText };
    const anthropicMessages = [contextMessage, ...messages];
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are a literary critic. Analyze the text the user gives you and identify concrete issues across these categories: Plot, Characters, Pacing, Style, Dialogue, General. For each issue found, produce one entry with exactly these fields: "category" (one of "Plot", "Characters", "Pacing", "Style", "Dialogue", "General"), "severity" (one of "low", "medium", "high"), and "comment" (a short explanation of the issue). If you find no issues, return an empty array. The messages that follow may include a continuing conversation about your review, not just the initial text — if the author asks a follow-up question about a previous review, still respond with an entry in this same schema (use category "General" and a severity that reflects how important your answer is) so your answer stays inside the array structure. Respond with ONLY a raw JSON array of such entries — no markdown code fences, no explanation, no text before or after the array. Write the "comment" field of each entry in ${bookLanguage}, regardless of the language of the text you are given, unless the user explicitly asks for another language. The "category" and "severity" values themselves must stay exactly as specified above (the English enum values) — never translate them.`,
      messages: anthropicMessages,
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
