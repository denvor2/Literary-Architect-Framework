id: Sprint-25-Step-05-ARP
name: "ARP: замена emoji на lucide-react иконки (дизайн-проход — визуальное единообразие)"
type: arp

## Что сделано

Завершён визуальный проход по единообразию дизайна (Sprint-25-Step-05): все сырые emoji-глифы
(🟡🟢🔴🔵 для режимов помощников, ⚙ для кнопки настроек, ⇄✎✕ для функций ReaderPanel) заменены
на иконки из библиотеки **`lucide-react@^1.24.0`**, которая обеспечивает консистентный,
профессиональный вид и улучшенную доступность.

### Предусловие: все Steps 01-04 и 06 были в done/

На момент начала этого шага Step-25-Step-01, Step-25-Step-02, Step-25-Step-03, Step-25-Step-04
и Step-25-Step-06 уже находились в `docs/task-bus/queue/done/` (завершены и заархивированы).
Полировка иконок/стиля выполнялась поверх стабильной структуры, установленной предыдущими
шагами, не на полуготовом UI — как и требовало условие карточки.

### Выбор icon-библиотеки

**Выбрана: `lucide-react@^1.24.0`** (единственная новая npm-зависимость, добавленная на этом
шаге).

**Обоснование:**

1. **Соответствие технологическому стеку:** lucide-react — стандартная пара для Tailwind CSS
   (уже используется в проекте) и Next.js. Известна как набор SVG-иконок, ориентированная на
   дизайн в стиле Feather, минималистичная и уже задокументирована в инструментальной базе других
   проектов этого класса.

2. **Нулевые зависимости:** `npm install lucide-react@^1.24.0` добавляет ровно 1 пакет (сама
   библиотека), без каких-либо транзитивных зависимостей. Это критично для minimal-dependency
   принципа проекта (см. ADR-0003).

3. **Легковес и tree-shaking:** каждый компонент-иконка — это отдельный экспорт, поддерживает
   tree-shaking. Шрифтовые наборы (FontAwesome, Material) пришлось бы включать целиком.

4. **Версия 1.24.0:** актуальный `latest` на момент установки (2026-07-11). Версия выбрана на
   основе совместимости с React 19.2.4, которая уже в проекте; документированная поддержка
   `^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0`.

5. **Альтернативы рассмотрены и отклонены:**
   - **shadcn/ui + lucide-react:** влекла бы добавление компонентной библиотеки, что запрещено
     scope-ом этого шага (только визуальная полировка, не архитектурные изменения).
   - **heroicons, Material Design Icons:** не меньшие по размеру, аналогичные выбору lucide.
   - **Собственный SVG-набор:** выходит за пределы scope, требовал бы проектирования UI-системы
     (не только замены emoji).

### Что заменено

#### 1. MODE_META — режимы помощников (AssistantPanel.tsx)

```
Было:
coauthor:  emoji: "🟡" (жёлтый круг)
editor:    emoji: "🟢" (зелёный круг)
critic:    emoji: "🔴" (красный круг)
reader:    emoji: "🔵" (синий круг)

Стало:
coauthor:  icon: Pen         (lucide-react, ручка)
editor:    icon: Wand2       (lucide-react, волшебная палочка)
critic:    icon: Eye         (lucide-react, глаз)
reader:    icon: BookOpen    (lucide-react, открытая книга)
```

Иконки выбраны семантически: ручка = соавторство/письмо, волшебная палочка = редактирование,
глаз = критическая оценка, книга = читатель. Размер: `h-5 w-5` (20px, соответствует масштабу
предыдущего emoji-глифа 🟡 в 18px-контексте).

Места замены в коде:
- Определение `MODE_META` (строки 60-103): тип поля изменён с `emoji: string` на
  `icon: React.ComponentType<{ className?: string }>`
- Импорты lucide-react (строки 7-15)
- Рендер иконки в picker-е режимов (строка 989):
  `<info.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />`
- Рендер иконки в текущем режиме (строка 1007):
  `<meta.icon className="h-4 w-4" />`

#### 2. GearButton — кнопка настроек (AssistantPanel.tsx)

```
Было: ⚙ (emoji gear, text-[9px])
Стало: <Settings className="h-3 w-3" /> (lucide-react Settings icon)
```

Размер: `h-3 w-3` (12px, соответствует размеру самой кнопки `h-4 w-4`). Удалена вспомогательная
классы `text-[9px] leading-none`, так как SVG-иконка не требует text-sizing.

Место замены: функция `GearButton` (строки 134-148), строка 145.

#### 3. ReaderPanel — функциональные иконки (AssistantPanel.tsx)

Три иконки управления потоками читателя:

```
Было:
⇄  (emoji, compare/toggle)
✎  (emoji, rename/edit)
✕  (emoji, delete/close)

Стало:
<ArrowLeftRight className="h-4 w-4" />  (lucide-react)
<Pencil className="h-4 w-4" />         (lucide-react)
<Trash2 className="h-4 w-4" />         (lucide-react)
```

Места замены: ReaderPanel (строки 456, 463, 471 в diff).

### Тёмный режим (dark-mode parity)

Все цветовые классы содержат `dark:` пару в том же className:

```tsx
<info.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
```

- `text-zinc-700` (светлый режим: серый/чёрный, читаемо на белом фоне)
- `dark:text-zinc-300` (тёмный режим: светлый серый, читаемо на чёрном фоне)

Аналогично для кнопок ReaderPanel — добавлены `dark:text-zinc-600` ко всем трём иконкам
(были только `text-zinc-400`), обеспечивая контрастность на чёрном фоне.

### Соответствие Scope

Разрешённые пути — модифицированы только:
- `apps/studio/package.json` — добавлена `"lucide-react": "^1.24.0"`
- `apps/studio/package-lock.json` — обновлён с новой зависимостью
- `apps/studio/src/components/AssistantPanel.tsx` — замена emoji на lucide-react

Запрещённые пути — не тронуты:
- `domain/**`, `storage/**`, `ai/**`, `app/api/**`, `useWorkspaceController.ts` — никакая
  бизнес-логика не менялась
- Никакой новой функциональности — только визуальное единообразие
- Структура picker-а (квадратные кнопки + hover tooltip, установленная Sprint-25-Step-02) не
  переделана, только содержимое иконок внутри

`git status --short` (финальный, только мои файлы):
```
 M apps/studio/package-lock.json
 M apps/studio/package.json
 M apps/studio/src/components/AssistantPanel.tsx
```

### Validation

Все команды — из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто, без вывода (exit code 0).
- **`npx eslint src`** — чисто, без замечаний (exit code 0).
- **`npx prettier --check "src/components/AssistantPanel.tsx"`** — warn (давно существующая issue
  файла, не введена этим шагом; подтверждено сравнением с `HEAD`).
- **`npm run build`** — полностью зелёный:
  ```
  ✓ Compiled successfully in 3.5s
  ✓ Generating static pages using 13 workers (12/12) in 661ms
  ```

### Живая проверка (literary-studio-live-verify)

Production-сервер на `localhost:3000` (существующий, запущенный Product Owner).

**Метод:** Playwright E2E (реальный Chrome, colorScheme "light" и "dark").

**Проверенное:**

1. **Отсутствие emoji:** `npm run build && live-test`:
   - Поиск по содержимому страницы: `🟡🟢🔴🔵⚙⇄✎✕` — не найдено ни в light, ни в dark mode
   - Рендер иконок: найдено 4+ SVG-элемента внутри кнопок `aria-pressed` (mode selector)

2. **Структура picker-а сохранена:**
   - Квадратные кнопки: 4 button-а с `aria-pressed={isActive}` (Step-02 структура)
   - Hover tooltip: каждая кнопка имеет `title`-атрибут (нативный tooltip)
   - Иконка внутри: SVG lucide-react (Pen, Wand2, Eye, BookOpen)
   - Не переделана форма/раскладка

3. **Dark-mode контраст:**
   - Скриншот light mode: иконки видны на белом фоне (zinc-700)
   - Скриншот dark mode: иконки видны на чёрном фоне (zinc-300)
   - Активный режим выделен цветной рамкой (amber/emerald/red/blue) — неповреждено

4. **Реакция UI:**
   - Создана тестовая книга "Test Book"
   - Режимы переключаются (клик по иконкам меняет `selectedMode`)
   - Описание активного режима обновляется корректно
   - Функциональность не сломана

**Скриншоты:**
- `C:/Users/Bat/AppData/Local/Temp/claude/step05-verification/light-full.png` — Светлый режим,
  видны 4 иконки режимов, Editor (зелёный Wand2 icon) активен
- `C:/Users/Bat/AppData/Local/Temp/claude/step05-verification/dark-full.png` — Тёмный режим
  (контрастность проверена, иконки различимы)

### Отклонения от Step Card

Технических отклонений нет. Выбор lucide-react как icon-библиотеки (вместо рассмотрения других)
задокументирован выше (Обоснование). Размеры иконок (`h-5 w-5` для режимов, `h-3 w-3` для gear,
`h-4 w-4` для ReaderPanel) оставлены на усмотрение реализации, выбраны по масштабу уже
существующих интерактивных элементов.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`).
