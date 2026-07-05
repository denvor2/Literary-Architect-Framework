import type { Character } from "@/domain/model";

type CharacterPanelProps = {
  character?: Character;
  onUpdate?: (
    fields: Partial<Pick<Character, "name" | "description" | "notes">>,
  ) => void;
  onDelete?: () => void;
};

// Sprint-10-Step-02: a Character's editing surface — deliberately simpler
// than EditorArea (no AI Bus, no modes), since Characters have no AI Expert
// at this stage.
export function CharacterPanel({
  character,
  onUpdate,
  onDelete,
}: CharacterPanelProps) {
  if (!character) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Select a character
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {character.name || "Untitled Character"}
          </h1>
          <button
            onClick={() => {
              if (window.confirm("Удалить персонажа?")) {
                onDelete?.();
              }
            }}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Удалить персонажа
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Name
          </label>
          <input
            value={character.name}
            onChange={(event) => onUpdate?.({ name: event.target.value })}
            placeholder="Character name..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Description
          </label>
          <textarea
            value={character.description}
            onChange={(event) =>
              onUpdate?.({ description: event.target.value })
            }
            placeholder="Who is this character..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Notes
          </label>
          <textarea
            value={character.notes}
            onChange={(event) => onUpdate?.({ notes: event.target.value })}
            placeholder="Additional notes..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>
    </main>
  );
}
