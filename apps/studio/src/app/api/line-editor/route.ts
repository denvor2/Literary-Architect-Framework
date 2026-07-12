import { NextResponse, type NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import { getAssistantSettings } from "@/repositories";
import { AssistantRole } from "@/generated/prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { extractToken, verifyJWT } from "@/lib/auth";
import { safeLogEvent } from "@/lib/auditLogger";
import { performance } from "perf_hooks";

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
  const bookContext = body?.bookContext;
  const messages = body?.messages;
  const sceneId = typeof body?.sceneId === "string" ? body.sceneId : undefined;

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

  // Sprint-15-Step-01: the response language follows the book's own declared
  // language (Book.language, e.g. "Russian"/"English"/...), not a hardcoded
  // one — this project is being localized to several languages, not Russian
  // only. Falls back to Russian when bookContext/language is absent (this
  // route's own dev-tools caller, LineEditorPanel.tsx, never sends
  // bookContext at all).
  const bookLanguage =
    typeof bookContext?.language === "string" && bookContext.language
      ? bookContext.language
      : "Russian";

  // Sprint-25-Step-03 (ADR-0013): optional Admin-authored `promptSuffix` for
  // the "editor" mode, appended after the base prompt below, never
  // replacing it. A DB outage degrades to "no custom suffix" rather than a
  // 500 — same reasoning as critic/route.ts and reader/route.ts.
  let customPromptSuffix = "";
  try {
    const settings = await getAssistantSettings(AssistantRole.editor);
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
    const contextMessage = {
      role: "user" as const,
      content: bookContext
        ? `Book context, for consistency only (character names, established plot facts) — do not use it to rewrite or expand the text beyond what is given below:\n${JSON.stringify(bookContext, null, 2)}\n\nText to edit:\n${sceneText}`
        : sceneText,
    };
    const anthropicMessages = [contextMessage, ...messages];
    const system = `You are a line editor. Fix grammar, punctuation, and word choice in the text the user gives you. Preserve the author's voice and meaning. Do not restructure the content. Return only the edited text, nothing else, unless the author asks a follow-up question about the edit in the conversation — then answer that question directly instead. If book context is provided, use it only to keep character names and established facts consistent — never use it to rewrite, extend, or add new content beyond the given text. The messages that follow may be an ongoing conversation about this same text, not just a single one-off request — take the prior exchange into account. When you answer a follow-up question directly (not when returning edited text), respond in ${bookLanguage}, regardless of the language of the conversation, unless the user explicitly asks for another language. The edited text itself must always stay in the same language as the original — never translate it, regardless of the book's declared language or the conversation's language.${customPromptSuffix}`;
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
      await safeLogEvent(userId, "ai_request_line_editor", {
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
      await safeLogEvent(userId, "ai_request_line_editor", {
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
