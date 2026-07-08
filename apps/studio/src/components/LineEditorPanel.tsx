"use client";

import { useState } from "react";
import * as aiBus from "@/ai/aiBus";

// Discovery implementation (Sprint-04-Step-05). Disposable — not a reusable Expert component.
// Sprint 07 Step 02: routed through aiBus.execute() instead of a direct fetch, closing the
// AI Bus bypass flagged since Sprint 06 Step 02 (see ADR-0004). Same Expert, same contract —
// only the internal call path changed.

export function LineEditorPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleSubmit() {
    setStatus("loading");
    setOutput(null);
    setError(null);
    try {
      const result = await aiBus.execute({
        operation: {
          type: "improve_text",
          payload: { sceneText: input, messages: [] },
        },
        context: {},
      });
      setOutput(result.response.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Запрос не выполнен.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Вставьте отрывок текста для правки..."
        rows={6}
        className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />
      <button
        onClick={handleSubmit}
        disabled={status === "loading" || input.trim().length === 0}
        className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "loading" ? "Правка..." : "Отредактировать"}
      </button>
      {output && (
        <p className="whitespace-pre-wrap rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          {output}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Ошибка: {error}
        </p>
      )}
    </div>
  );
}
