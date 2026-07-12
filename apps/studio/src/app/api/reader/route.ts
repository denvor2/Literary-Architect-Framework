import { NextResponse, type NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import { getAssistantSettings } from "@/repositories";
import { AssistantRole } from "@/generated/prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { extractToken, verifyJWT } from "@/lib/auth";
import { safeLogEvent } from "@/lib/auditLogger";
import { performance } from "perf_hooks";

// Discovery implementation (Sprint-09-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape — a reader's reaction is a whole
// piece of text, not a structured list like /api/critic.
//
// Sprint-13-Step-02: the server remains fully stateless (ADR-0004) — the whole conversation
// history is sent by the client on every call, in `messages`, and nothing is kept between
// calls. `text` is renamed `sceneText` to match the shared schema across all four Experts.
// Critic/Reader are outside the per-Expert context-scope table (ADR-0008) — no `bookContext`
// field exists here, not even optionally.
//
// Sprint-14-Step-01: optional `persona` for named Reader instances (e.g. "молодой читатель").
// Additive — absent `persona` produces byte-identical behavior to before this step, same
// principle as `bookContext`'s addition to Line Editor in Sprint-12-Step-02.
export async function POST(request: NextRequest) {
  // Rate limiting check (Sprint 27)
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate limit exceeded" },
      { status: 429 },
    );
  }

  // Extract userId from JWT if available (for logging)
  let userId: string | null = null;
  try {
    const token = extractToken(request);
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        userId = payload.sub;
      }
    }
  } catch {
    // If JWT extraction fails, continue without userId
    userId = null;
  }

  const body = await request.json();
  const sceneText = body?.sceneText;
  const messages = body?.messages;
  const persona = typeof body?.persona === "string" ? body.persona : undefined;
  const sceneId = typeof body?.sceneId === "string" ? body.sceneId : undefined;
  // Sprint-15-Step-01: same minimal, scene-scoped addition as Critic's
  // bookLanguage — just the language string, not the whole bookContext
  // (which would widen Reader's scope beyond ADR-0008's design).
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

  // Sprint-25-Step-03 (ADR-0013): optional Admin-authored `promptSuffix`,
  // appended after everything else (base prompt + persona), never replacing
  // it. A DB outage degrades to "no custom suffix" rather than a 500 — same
  // reasoning as critic/route.ts.
  let customPromptSuffix = "";
  try {
    const settings = await getAssistantSettings(AssistantRole.reader);
    if (settings?.promptSuffix) {
      customPromptSuffix = `\n\n${settings.promptSuffix}`;
    }
  } catch {
    customPromptSuffix = "";
  }

  let startTime = 0;
  try {
    startTime = performance.now();
    const client = getAnthropicClient();
    const contextMessage = { role: "user" as const, content: sceneText };
    const anthropicMessages = [contextMessage, ...messages];
    const baseSystem = `You are a reader reacting to the text the user gives you — not an editor and not a literary critic. Do not comment on grammar, punctuation, or wording. Do not produce a structured, categorized assessment. Instead, share your subjective impressions as an engaged reader: what caught your attention, what confused or surprised you, how the pacing felt, what you expect or hope happens next. Write your reaction as flowing prose, in your own voice, not as a list. The messages that follow may be a continuing conversation about your reaction, not just the initial text — if the author asks a follow-up question about what you already said, answer it directly, still as the same engaged reader, not as an editor or critic. Respond in ${bookLanguage}, regardless of the language of the text you are given, unless the user explicitly asks for another language.`;
    const system =
      (persona
        ? `You are reading and reacting as: ${persona}. Stay in this persona throughout.\n\n${baseSystem}`
        : baseSystem) + customPromptSuffix;
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system,
      messages: anthropicMessages,
    });
    const durationMs = Math.round(performance.now() - startTime);

    const block = message.content.find((item) => item.type === "text");
    const result = block && block.type === "text" ? block.text : "";

    // Log successful request
    if (userId) {
      await safeLogEvent(userId, "ai_request_reader", {
        sceneId,
        durationMs,
        tokenCount: message.usage.output_tokens + message.usage.input_tokens,
        status: "success",
      });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    if (userId) {
      await safeLogEvent(userId, "ai_request_reader", {
        sceneId,
        durationMs,
        status: "failed",
        errorMessage,
      });
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
