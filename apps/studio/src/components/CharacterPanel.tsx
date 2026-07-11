import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Character } from "@/domain/model";

type CharacterPanelProps = {
  character?: Character;
  onUpdate?: (
    fields: Partial<
      Pick<Character, "name" | "description" | "notes" | "photoUrl">
    >,
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
  // Sprint-10-Step-03: focus the Name field whenever the selected character
  // changes (including a just-created one) — keyed on character?.id only, so
  // typing into the field doesn't keep re-triggering the focus.
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, [character?.id]);

  if (!character) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Выберите персонажа
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {character.name || "Безымянный персонаж"}
          </h1>
          <button
            onClick={() => {
              if (window.confirm("Удалить персонажа?")) {
                onDelete?.();
              }
            }}
            className="text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Удалить персонажа"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Имя
          </label>
          <input
            ref={nameInputRef}
            value={character.name}
            onChange={(event) => onUpdate?.({ name: event.target.value })}
            placeholder="Имя персонажа..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Ссылка на фото
          </label>
          <input
            value={character.photoUrl}
            onChange={(event) => onUpdate?.({ photoUrl: event.target.value })}
            placeholder="Ссылка на изображение..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          {character.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a build-time optimizable local asset
            <img
              src={character.photoUrl}
              alt={character.name || "Фото персонажа"}
              className="h-40 w-40 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Описание
          </label>
          <textarea
            value={character.description}
            onChange={(event) =>
              onUpdate?.({ description: event.target.value })
            }
            placeholder="Кто этот персонаж..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Заметки
          </label>
          <textarea
            value={character.notes}
            onChange={(event) => onUpdate?.({ notes: event.target.value })}
            placeholder="Дополнительные заметки..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>
    </main>
  );
}
