"use client";

import { useState } from "react";
import { TestConnectionButton } from "@/components/TestConnectionButton";
import { LineEditorPanel } from "@/components/LineEditorPanel";

// Houses Sprint 04's validation tools (Test Connection, Line Editor discovery code) so they
// remain functional without dominating the product UI shell built in Sprint 05.
export function DeveloperTools() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <span>Developer Tools</span>
        <span>{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="flex flex-col items-center gap-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <TestConnectionButton />
          <LineEditorPanel />
        </div>
      )}
    </div>
  );
}
