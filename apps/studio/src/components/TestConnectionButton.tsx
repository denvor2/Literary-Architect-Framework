"use client";

import { useState } from "react";

type Result = { ok: true; text: string } | { ok: false; error: string } | null;

export function TestConnectionButton() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [result, setResult] = useState<Result>(null);

  async function handleClick() {
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/test-connection", { method: "POST" });
      const data: Result = await response.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Request failed." });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "loading" ? "Testing..." : "Test Claude Connection"}
      </button>
      {result && (
        <p
          className={
            result.ok
              ? "text-sm text-emerald-600 dark:text-emerald-400"
              : "text-sm text-red-600 dark:text-red-400"
          }
        >
          {result.ok ? result.text : `Error: ${result.error}`}
        </p>
      )}
    </div>
  );
}
