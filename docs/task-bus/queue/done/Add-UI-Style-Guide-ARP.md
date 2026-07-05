# ARP — Add-UI-Style-Guide

**Задача:** Добавить `docs/design/UI_STYLE_GUIDE.md` + переделать существующие кнопки
**Статус выполнения:** Готово к ревью

## Что сделано

1. **`docs/design/UI_STYLE_GUIDE.md`** (новый файл) — создан дословно по тексту Step Card:
   разделы "Кнопки" (правило рамка/заливка, эталон "New Scene" для основного действия, контурный
   стиль для второстепенных, красный акцент для разрушительных), "Цветовая семантика" (red/
   green/yellow/blue), "Общий стиль" (в духе Bootstrap, нейтральная база zinc).
2. **`Sidebar.tsx`** — кнопка "+ New Character" переделана из текст-ссылки (без рамки) в
   контурную кнопку: `rounded-md border border-zinc-300 px-2 py-0.5` (компактный размер, чтобы
   не выбивалась из строки заголовка секции), с тем же hover-поведением, что у остальных
   элементов Sidebar (`hover:bg-zinc-100`/`dark:hover:bg-zinc-900`). Логика (`onClick` →
   `onCreateCharacter`) не менялась — только визуальные классы.

## Изменённые/новые файлы целиком

### docs/design/UI_STYLE_GUIDE.md (новый файл)

```markdown
# UI Style Guide

Зафиксировано с Product Owner 2026-07-05. Применяется ко всему
новому UI-коду; существующие элементы переводятся под эту конвенцию
по мере того, как до них доходит очередь (начиная с этой задачи).

## Кнопки

- Любой кликабельный элемент действия — настоящий `<button>`.
- Визуально каждая кнопка имеет рамку ИЛИ заливку — никогда просто
  текст без обводки/фона как единственный визуальный признак.
- Основное действие на экране (одно на вид) — заполненная кнопка
  (сплошной фон) — уже используется для "New Scene", это эталон.
- Второстепенные действия ("+ New X", переключатели и т.п.) —
  контурная кнопка (border, padding, скруглённые углы) — компактный
  размер допустим, но обязательно с рамкой.
- Разрушительные/необратимые действия (удаление) — красный акцент
  (border-red-*/text-red-* или аналог), не нейтральный серый.

## Цветовая семантика

- 🔴 Красный (red-*) — ошибки, разрушительные действия
- 🟢 Зелёный (green-*) — успех, подтверждение
- 🟡 Жёлтый/янтарный (yellow-*/amber-*) — предупреждение
- 🔵 Голубой (blue-*) — информационные сообщения, нейтральный статус

## Общий стиль

Простой, аккуратный, не перегруженный — в духе Bootstrap по
умолчанию: умеренное скругление углов, чёткие отступы, нейтральная
база (zinc, как сейчас), цвет — только там, где несёт смысл
(семантика выше), не как декоративный акцент.
```

### apps/studio/src/components/Sidebar.tsx

```tsx
import type { Chapter, Character } from "@/domain/model";

type SidebarProps = {
  bookTitle?: string;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onSelectChapter?: (id: string) => void;
  onSelectScene?: (chapterId: string, sceneId: string) => void;
  characters?: readonly Character[];
  selectedCharacterId?: string | null;
  onSelectCharacter?: (id: string) => void;
  onCreateCharacter?: () => void;
};

export function Sidebar({
  bookTitle,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onSelectChapter,
  onSelectScene,
  characters = [],
  selectedCharacterId,
  onSelectCharacter,
  onCreateCharacter,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Book
        </h2>
        <p className="text-sm text-black dark:text-zinc-100">
          {bookTitle ?? "Untitled Book"}
        </p>
      </div>
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Chapters
        </h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No chapters yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  onClick={() => onSelectChapter?.(chapter.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedChapterId === chapter.id && !selectedSceneId
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {chapter.title}
                </button>
                {chapter.scenes.length > 0 && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {chapter.scenes.map((scene) => (
                      <li key={scene.id}>
                        <button
                          onClick={() => onSelectScene?.(chapter.id, scene.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                            selectedSceneId === scene.id
                              ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {scene.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Characters
          </h2>
          <button
            onClick={() => onCreateCharacter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + New Character
          </button>
        </div>
        {characters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No characters yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  onClick={() => onSelectCharacter?.(character.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedCharacterId === character.id
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {character.name || "Untitled Character"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → docs/design/UI_STYLE_GUIDE.md (новый) + Sidebar.tsx (M) — оба Allowed
                       paths; ничего другого не тронуто
```

**Живая проверка (честно, ограничение среды):** визуальное появление рамки у кнопки — то же
класс ограничения, что и раньше (нет браузера). Сделано: код-ревью классов (`border`,
`rounded-md`, `px-2 py-0.5` — те же примитивы, что уже использует остальной Sidebar для
консистентности) + `build`/`lint`. Прошу лично убедиться, что "+ New Character" визуально
читается как кнопка (видна рамка), а не как ссылка.

## Отклонения от Step Card

Нет. `Sprint-10-Step-04`/`Add-Series-Vision-Note`/`Sprint-09-Vision-Amendments`/
`Add-Trash-Archive-Vision-Note` не тронуты — эта задача правит только `Sidebar.tsx`'s
"+ New Character" и ничего в `Sprint-10-Step-04`'s/`Amendment`'s зоне ("+ New Chapter",
"+ New Book"), которые ещё не начаты и придут отдельными шагами.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
