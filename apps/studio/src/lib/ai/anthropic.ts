// Server-only module — the single integration point for the Anthropic SDK.
// Must only be imported from Next.js Route Handlers (see docs/vision/security.md,
// "Provider Integration Rule"). Never import this from a client component.
import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy apps/studio/.env.example to .env.local and add your key.",
    );
  }
  return new Anthropic({ apiKey });
}
