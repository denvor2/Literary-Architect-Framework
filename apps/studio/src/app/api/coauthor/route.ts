import { NextResponse, type NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import { getAssistantSettings } from "@/repositories";
import { AssistantRole } from "@/generated/prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { extractToken, verifyJWT } from "@/lib/auth";
import { safeLogEvent } from "@/lib/auditLogger";
import { performance } from "perf_hooks";

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
// Sprint-20-Step-02: optional `mode` parameter — "draft" (default, existing behavior) or
// "structure" (returns a JSON StructureProposal instead of prose). See ADR-0010.

const STRUCTURE_SYSTEM_PROMPT = `You are a literary co-author helping plan a book's structure. Given the book's full context (metadata, existing chapters/scenes, characters), propose a chapter-and-scene structure as a raw JSON object with this exact shape:\n\n{ "chapters": [ { "title": "...", "subtitle": "...", "scenes": [ { "title": "...", "description": "1-2 sentence summary of what happens" } ] } ] }\n\nRules:\n- Propose a complete structure that fits the book's premise, genre, and existing content.\n- If chapters already exist, build on them — propose new chapters/scenes that continue the story.\n- Each scene description should be concise (1-2 sentences).\n- Respond with ONLY the raw JSON object — no markdown code fences, no explanation, no text before or after.\n- The structure must be valid JSON.`;

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
  const bookContext = body?.bookContext;
  const messages = body?.messages;
  const mode = typeof body?.mode === "string" ? body.mode : "draft";
  const sceneId = typeof body?.sceneId === "string" ? body.sceneId : undefined;

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
  const bookLanguage =
    typeof bookContext.language === "string" && bookContext.language
      ? bookContext.language
      : "Russian";

  // Sprint-25-Step-03 (ADR-0013): optional Admin-authored `promptSuffix` for
  // the "coauthor" mode, appended after whichever base prompt applies below
  // (draft or structure), never replacing it. A DB outage degrades to "no
  // custom suffix" rather than a 500 — same reasoning as the other three
  // Expert routes.
  let customPromptSuffix = "";
  try {
    const settings = await getAssistantSettings(AssistantRole.coauthor);
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

    if (mode === "structure") {
      const contextMessage = {
        role: "user" as const,
        content: `Book context (title, genre, language, premise, annotations, tags, all chapters/scenes, all characters):\n${JSON.stringify(bookContext, null, 2)}`,
      };
      const anthropicMessages = [contextMessage, ...messages];
      const message = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 2048,
        system: `${STRUCTURE_SYSTEM_PROMPT} Write the response in ${bookLanguage} for all title/description fields, unless the user explicitly asks for another language.${customPromptSuffix}`,
        messages: anthropicMessages,
      });
      const durationMs = Math.round(performance.now() - startTime);

      const block = message.content.find((item) => item.type === "text");
      const raw = block && block.type === "text" ? block.text : "";

      let proposal;
      try {
        const cleaned = raw
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();
        proposal = JSON.parse(cleaned);
      } catch {
        // Log failure before returning error
        if (userId) {
          await safeLogEvent(userId, "ai_request_coauthor", {
            sceneId,
            mode: "structure",
            durationMs,
            status: "failed",
            errorMessage: "Invalid JSON response",
          });
        }
        return NextResponse.json(
          { ok: false, error: "Co-author response was not valid JSON." },
          { status: 500 },
        );
      }

      // Log successful request
      if (userId) {
        await safeLogEvent(userId, "ai_request_coauthor", {
          sceneId,
          mode: "structure",
          durationMs,
          tokenCount: message.usage.output_tokens + message.usage.input_tokens,
          status: "success",
        });
      }

      return NextResponse.json({ ok: true, proposal });
    }

    // Default: draft mode (existing behavior)
    const contextMessage = {
      role: "user" as const,
      content: `Book context (title, genre, language, premise, annotations, tags, all chapters/scenes, all characters):\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent scene text — continue it if non-empty; if empty, write a new scene draft fitting the book context:\n${sceneText}`,
    };
    const anthropicMessages = [contextMessage, ...messages];
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are a co-author — a generative writer, not a critic and not an editor. You will be given the entire book's context (metadata, all chapters and scenes written so far, all characters) and the current scene's text, followed by the ongoing conversation with the author about this scene. Use the full book context — plot, characters, established style and voice — when writing. If the current scene's text is non-empty, continue it directly, matching its style and picking up where it leaves off; if it is empty, write a new scene draft that fits the book's premise, characters, and what has already been written. This is a continuing dialogue, not a one-shot request: take the prior conversation into account, and if the author has not asked anything specific yet (no conversation so far), proceed directly to drafting or continuing the scene. Respond in ${bookLanguage}, regardless of the language of the input, unless the user explicitly asks for another language.${customPromptSuffix}`,
      messages: anthropicMessages,
    });
    const durationMs = Math.round(performance.now() - startTime);

    const block = message.content.find((item) => item.type === "text");
    const result = block && block.type === "text" ? block.text : "";

    // Log successful request
    if (userId) {
      await safeLogEvent(userId, "ai_request_coauthor", {
        sceneId,
        mode: "draft",
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
      await safeLogEvent(userId, "ai_request_coauthor", {
        sceneId,
        mode,
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
