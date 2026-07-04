"use client";

import { useState } from "react";

// Discovery implementation (Sprint-04-Step-05). Disposable — not a reusable Expert component.

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
      const response = await fetch("/api/line-editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await response.json();
      if (data.ok) {
        setOutput(data.result);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Request failed.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste a passage to line-edit..."
        rows={6}
        className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />
      <button
        onClick={handleSubmit}
        disabled={status === "loading" || input.trim().length === 0}
        className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "loading" ? "Editing..." : "Line Edit"}
      </button>
      {output && (
        <p className="whitespace-pre-wrap rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          {output}
        </p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>}
    </div>
  );
}
