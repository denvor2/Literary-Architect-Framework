const ASSISTANTS = [
  {
    name: "Co-author",
    description: "Draft and develop new material together.",
  },
  { name: "Editor", description: "Polish grammar, clarity, and flow." },
  { name: "Critic", description: "Get an assessment of your writing." },
  { name: "Reader", description: "See how a reader would react." },
];

export function AssistantPanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Assistants
      </h2>
      {ASSISTANTS.map((assistant) => (
        <button
          key={assistant.name}
          className="rounded-lg border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <p className="text-sm font-medium text-black dark:text-zinc-50">
            {assistant.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {assistant.description}
          </p>
        </button>
      ))}
    </aside>
  );
}
