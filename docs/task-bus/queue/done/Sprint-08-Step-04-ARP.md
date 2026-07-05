# ARP — Sprint-08-Step-04: UI — responsive-панель замечаний Critic

## STATUS

OK (с ограничением проверки — см. VALIDATION)

## SUMMARY (RU)

Переверстан только Critic-специфичный блок превью (`status === "preview" && mode ===
"Critic"`) в `EditorArea.tsx`. Контейнер: `flex flex-col gap-4 lg:flex-row lg:items-start
lg:gap-6` — на узких экранах (`<1024px`, дефолтный Tailwind-брейкпоинт `lg`, конфиг не
переопределён — проверено в `globals.css`, там только цвета/шрифты) секции идут одна под
другой (текст, затем список), на широких — рядом (`lg:flex-row`), текст остаётся на переднем
плане (`lg:flex-1`), список замечаний — фиксированной ширины сбоку (`lg:w-80 lg:shrink-0`).
Переключение полностью через CSS-медиазапрос (Tailwind `lg:`-префикс) — JS-детекции ширины
окна нет.

Каждое замечание — карточка (`rounded-lg border p-3`) с двумя бейджами (category —
нейтральный zinc, severity — приглушённые тона: low/по умолчанию — zinc, medium — amber,
high — red, через словарь `SEVERITY_BADGE`) и текстом комментария под ними.

`handleCritic`/`handleImprove` не тронуты — изменена только JSX/стили вывода. Блок превью
Editor/Improve (Original/Improved text, кнопки Заменить/Оставить) — не тронут, подтверждено
пустым диффом вокруг него. `ai/**`, `app/api/**`, `LineEditorPanel.tsx` — не затронуты.

## FILES MODIFIED

- `apps/studio/src/components/EditorArea.tsx` — единственный изменённый файл (добавлен
  словарь `SEVERITY_BADGE`/`DEFAULT_SEVERITY_BADGE`, переверстан Critic-блок превью).

## VALIDATION

- `npm run build` — успешно, TypeScript без ошибок.
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю (после одного авто-фикса).
- `git status --short apps/studio/` → только `EditorArea.tsx`; `ai/**`, `app/api/**`,
  `LineEditorPanel.tsx` не изменены.
- `git diff` вокруг блока Editor/Improve preview ("Original"/"Improved text") — пусто, блок
  не тронут.
- Живая проверка backend-контрактов (не вёрстки): `next start -p 3039` — главная страница
  HTTP 200; `/api/line-editor` и `/api/critic` вернули результаты, идентичные предыдущим
  шагам (`"She doesn't know the answer."`; реальный список замечаний на тестовом тексте с
  повторяющимся словом) — оба Expert'а работают как прежде, шаг не затронул backend.
- Подтверждено, что `lg:` — дефолтный Tailwind-брейкпоинт (1024px): в `globals.css` нет
  переопределения `--breakpoint-*`/`screens`, только цвета и шрифты — соответствует
  «ориентировочно от ~1024px» из Step Card без дополнительной конфигурации.
- **Честное ограничение (как и в Step 03):** в этой среде нет инструмента браузерной
  автоматизации — не могу буквально открыть страницу на 1400px и 600px и сделать скриншот.
  Вместо этого: проверил корректность самих Tailwind-классов (`flex-col` → `lg:flex-row`,
  `lg:flex-1`, `lg:w-80 lg:shrink-0` — стандартные, задокументированные утилиты, уже
  используемые в этом же файле по аналогичному паттерну, например `isFocusMode ? "mx-auto
  max-w-3xl" : ""`), и что переключение целиком объявлено в className, без единого
  `window.innerWidth`/`matchMedia` в JS.

## RISKS

- **Основной риск — то же отсутствие браузерной проверки**, что и в Step 03. Если Architect
  считает недостаточным для `STATUS: OK`, прошу уточнить приемлемый уровень proof в этой
  среде.
- Фиксированная ширина панели (`lg:w-80` = 20rem) выбрана произвольно (Step Card не задавал
  точное значение) — можно скорректировать по фидбэку, если 320px окажется неудобным.
- Бейдж severity для неизвестного/отсутствующего значения падает на тот же тон, что и `low`
  (`DEFAULT_SEVERITY_BADGE = SEVERITY_BADGE.low`) — осознанный выбор (нейтральный дефолт), не
  указан явно в Step Card, но не противоречит требованию «неброские тона».

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменён только `EditorArea.tsx`. Step
Card и этот ARP — в `docs/ai-bus/queue/active/Sprint-08-Step-04.md` /
`docs/ai-bus/queue/active/Sprint-08-Step-04-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`.
