id: Sprint-25-Step-02-ARP
name: "ARP: перетаскиваемый делитель редактор/помощник + реорганизация picker-а режимов (квадратные иконки + tooltip)"
type: arp

## Что сделано

Две независимые части, как описано в карточке.

### Часть 1 — перетаскиваемый делитель (`apps/studio/src/app/page.tsx`)

Добавлена зависимость **`react-resizable-panels@^4.12.1`** (единственная новая запись в
`package.json`/`package-lock.json`, ниже — почему именно она и именно эта версия).

- Новый хук `useIsDesktopLayout()` (объявлен на уровне модуля, использует
  `window.matchMedia("(min-width: 1024px)")` — тот же порог, что Tailwind-брейкпоинт `lg`,
  который и раньше управлял переключением между колонкой/строкой в этом файле). Он решает, что
  именно рендерить между основной областью (`CharacterPanel`/`EditorArea`) и `AssistantPanel`:
  - **Focus Mode** — без изменений: `AssistantPanel` вообще не рендерится, делить нечего.
  - **Не Focus Mode, `< lg`** — прежняя вертикальная раскладка (main content, затем
    `AssistantPanel`, без делителя) — мобильное поведение не тронуто.
  - **Не Focus Mode, `≥ lg`** — новая раскладка: `Group` (`orientation="horizontal"`) с двумя
    `Panel` (`defaultSize="50"`, `minSize="20"` каждый) и `Separator` между ними — настоящий
    перетаскиваемый мышью делитель, по умолчанию 50/50, с минимальной шириной 20% для каждой
    стороны (не даёт схлопнуть панель до нуля).
- Позиция делителя **не персистится** — сбрасывается на 50/50 при перезагрузке, буквально по
  тексту карточки ("если реализация не добавит это тривиально — не усложнять").

### Часть 2 — picker режимов (`apps/studio/src/components/AssistantPanel.tsx`)

- 2-колоночная `grid` карточек (эмодзи + label + description в каждой) заменена на `flex`-ряд из
  4 одинаковых квадратных кнопок (`h-10 w-10`), без видимого текста внутри — только эмодзи-глиф
  (`MODE_META.emoji`, не тронут, замена на настоящий icon-set — Sprint-25-Step-05, не этот шаг).
  Подпись режима — нативный `title`/`aria-label` (без новой зависимости ради одного tooltip, как
  прямо разрешала карточка). Активный режим по-прежнему выделяется через
  `info.activeBorder`/`isActive`, тот же принцип, что раньше, просто на квадратной форме.
- Текстовое описание (`meta.description`) перенесено из каждой карточки в один общий абзац сразу
  под рядом иконок, показывает описание **только текущего активного режима**
  (`MODE_META[selectedMode].description`) — освобождает вертикальное место, как и требовал
  Product Owner.

## Соответствие Scope

Финальный `git status --short` (полный, не только мои файлы — рабочее дерево уже содержало
несвязанные незакоммиченные изменения от предыдущих/параллельных шагов на момент старта):

```
 M CLAUDE.md                                            — не моё, унаследовано
 M apps/studio/package-lock.json                        — МОЁ (react-resizable-panels)
 M apps/studio/package.json                              — МОЁ (react-resizable-panels)
 M apps/studio/src/ai/aiBus.ts                            — не моё (параллельный Sprint-25-Step-04)
 M apps/studio/src/ai/operations.ts                       — не моё (параллельный Sprint-25-Step-04)
 M apps/studio/src/app/api/book-field/route.ts            — не моё (параллельный Sprint-25-Step-04)
 M apps/studio/src/app/page.tsx                           — МОЁ
 M apps/studio/src/components/AssistantPanel.tsx          — МОЁ (плюс 1 унаследованная строка
                                                             Sprint-25-Step-01, см. ниже)
 M apps/studio/src/components/EditorArea.tsx              — не моё (Sprint-25-Step-01 + параллельный
                                                             Step-04, оба трогают этот файл)
 M apps/studio/src/components/Header.tsx                  — не моё (Sprint-25-Step-01)
 M apps/studio/src/components/Sidebar.tsx                 — не моё (Sprint-25-Step-01)
 M docs/adr/ADR-0011-book-field-operations.md             — не моё, появилось в середине моей
                                                             сессии (параллельный Step-04 прогрессирует)
 M docs/project/CURRENT_SPRINT.md                         — не моё, унаследовано
 M docs/project/ROADMAP_18-27.md                          — не моё, унаследовано
 M docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md             — не моё, унаследовано
?? .claude/agents/tester.md                               — не моё, унаследовано
?? .claude/agents/ui-specialist.md                         — не моё, унаследовано
?? .claude/settings.json                                   — не моё, унаследовано
?? .claude/skills/literary-studio-ui-specialist/           — не моё, унаследовано
?? apps/studio/.tester-scratch-verify.mjs                  — не моё, появилось в середине сессии
                                                             (другой параллельный агент/скрипт)
?? docs/adr/ADR-0013-assistant-settings.md                 — не моё, унаследовано
?? docs/task-bus/queue/active/Sprint-25-Step-01-ARP.md     — не моё, унаследовано
?? docs/task-bus/queue/active/Sprint-25-Step-01-REVIEW.md  — не моё, появилось в середине сессии
                                                             (architect-reviewer по Step-01)
?? docs/task-bus/queue/active/Sprint-25-Step-01.md         — не моё, унаследовано
?? docs/task-bus/queue/active/Sprint-25-Step-02.md         — МОЁ (перенос pending/ → active/,
                                                             единственное моё действие с task-bus)
?? docs/task-bus/queue/active/Sprint-25-Step-04.md         — не моё, унаследовано (параллельный шаг)
?? docs/task-bus/queue/pending/Sprint-25-Step-03.md        — не моё, унаследовано
?? docs/task-bus/queue/pending/Sprint-25-Step-05.md        — не моё, унаследовано
```

**Мои файлы — ровно те, что разрешены карточкой:** `apps/studio/src/app/page.tsx`,
`apps/studio/src/components/AssistantPanel.tsx`, `apps/studio/package.json`,
`apps/studio/package-lock.json`. `domain/**`, `storage/**`, `ai/**`, `app/api/**`,
`useWorkspaceController.ts` — не тронуты. Рендер конкретных режимов (ветки Co-author/Editor/
Critic/Reader внутри `AssistantPanel.tsx`, `ReaderPanel`) — не тронут, менялся только сам picker.
Emoji-глиф не заменён на icon-set (оставлен явно, как требует scope).

`git diff apps/studio/src/components/AssistantPanel.tsx` показывает строку `Assistants` →
`Помощники` в диффе — **это не моя правка**, это унаследованное состояние Sprint-25-Step-01
(его собственный ARP это подтверждает: "единственная правка: `<h2>Assistants</h2>` →
`<h2>Помощники</h2>`"), уже было в рабочем дереве до начала этого шага (файл был прочитан мной в
начале сессии уже с `Помощники`). `git diff` показывает это только потому, что сравнивает весь
файл целиком с `HEAD` (где ещё `Assistants`), а не только мои изменения этой сессии.

Аналогично `apps/studio/src/app/page.tsx`: диффу с `HEAD` показывает и перенос
`ideas`/`onCreateIdea`/`onUpdateIdea`/`onDeleteIdea` из `<EditorArea>` в `<Sidebar>` —
унаследовано от Sprint-25-Step-01, не тронуто мной (сам текст этих пропов не менялся, просто
диалгоритм `git diff` захватывает его в тот же хунк из-за соседства с моей крупной правкой
раскладки).

**Признание срочного safety-примечания координатора** (получено в середине этой сессии, до начала
живой проверки): подтверждаю, что для живой проверки этого шага я не создавал/не удалял/не менял
ничего в реальной базе `literary_studio` — единственная запись, которую я коснулся, это полностью
изолированная тестовая база `literary_studio_step25_02_test` (см. "Живая проверка" ниже), созданная
и удалённая мной именно в рамках этого шага, никогда не пересекавшаяся с реальными данными Product
Owner. Никаких `PUT /api/workspace`-перезаписей я не выполнял вовсе (этот шаг — чисто клиентский UI,
доступ к `/api/workspace` тестовым скриптом не производился).

## Validation

Все команды — из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто, без вывода (exit code 0).
- **`npx eslint src`** (весь проект) — чисто, без единого замечания (exit code 0).
- **`npx prettier --check "src/app/page.tsx"`** — `All matched files use Prettier code style!`.
- **`npx prettier --check "src/components/AssistantPanel.tsx"`** — warn (не мой формат целиком не
  соответствует Prettier). Проверено тем же методом, что Sprint-25-Step-01: тот же warn
  воспроизводится на версии `HEAD` этого файла (`git show HEAD:...AssistantPanel.tsx` в scratch-файл
  → `prettier --check` на нём тоже падает) — то есть это давно существующее, не связанное с этим
  шагом состояние файла (вероятно CRLF/line-ending артефакт чекаута на Windows), не введено моей
  правкой.
- **`npm run build`** — полностью зелёный:
  ```
  ✓ Compiled successfully in ~2s
    Running TypeScript ... Finished TypeScript ...
  ✓ Generating static pages using 12 workers (11/11)
  ```
  Все прежние роуты (`/api/workspace`, `/api/coauthor`, `/api/critic`, `/api/reader`,
  `/api/line-editor`, `/api/book-field`, `/api/test-connection`) присутствуют в итоговой таблице.

### Живая проверка — техника и изоляция

Это чисто клиентская UI-правка (без AI Bus, без сетевых вызовов) — Shape 2 из
`literary-studio-live-verify` не совсем подходит (нет чистой функции-редьюсера), поэтому применена
прямая браузерная проверка реальным Chrome через `@playwright/test`, тот же паттерн, что уже
использовали Sprint-24-Step-05..08 и Sprint-25-Step-01:

- **Изоляция БД (важно, см. safety-примечание выше):** создана отдельная логическая база
  `literary_studio_step25_02_test` в том же контейнере Postgres (`CREATE DATABASE`, затем
  `prisma migrate deploy` той же миграцией `20260710202615_init`). Scratch-сервер
  (`npx next start -p 3612`) запущен с `DATABASE_URL`, указывающим **только** на эту тестовую базу
  (переменная окружения самого процесса, `apps/studio/.env`/`.env.local` не редактировались).
  Реальная база `literary_studio` не открывалась этим сервером ни разу.
- Реальный production-билд (`npm run build && npx next start -p 3612`), порт выбран заведомо
  свободным (`netstat` перед стартом — ни dev-сервер Product Owner на 3000, ни другие
  scratch-серверы на нём не висели).
- Скрипт (`verify-step02.mjs`, временно скопирован в `apps/studio/` как
  `.scratch-verify-step02.mjs` — единственный практический способ подключить локальный пакет
  `@playwright/test` из ESM-скрипта, удалён сразу после прогона) — реальный системный Chrome
  (`chromium.launch({ channel: "chrome" })`), два отдельных браузерных контекста
  (`colorScheme: "light"` и `"dark"`), создаёт (в изолированной тестовой БД) ровно одну книгу и
  проверяет обе части на реальном DOM.

### Результаты (дословный вывод скрипта, оба цветовых режима)

**Делитель:**
```
   [light] before drag — main width=569.0px, assistant width=569.0px
PASS: [light] default split is ~50/50
   [light] after drag (+250px) — main width=819.0px, assistant width=319.0px
PASS: [light] dragging the divider right genuinely widened the main content panel
PASS: [light] dragging the divider right genuinely narrowed the AssistantPanel
   [light] after extreme drag left — main width=227.6px (group width=1144.0px)
PASS: [light] dragging past the limit is clamped by minSize, doesn't collapse to 0
```
(идентично для `[dark]`.) Ширина изменена реальным `page.mouse.down/move/up` на разделительной
полосе (`#editor-assistant-divider`), измерена через `boundingBox()` обеих панелей до/после — не
косвенная проверка. Экстремальное перетаскивание (−2000px) подтвердило `minSize="20"` (20% от
1144px группы ≈ 229px, измерено 227.6px) — панель не схлопывается до нуля.

**Picker:**
```
PASS: [light] exactly 4 square icon buttons render
PASS: [light] button 0 has a real hover tooltip (title="Соавтор")
PASS: [light] button 0 (Соавтор) is genuinely square (40.0x40.0)
PASS: [light] button 0 shows no visible label text inside it (content="🟡")
... (аналогично для Редактор/Критик/Читатель)
PASS: [light] hovering the 3rd button exposes tooltip text "Критик"
PASS: [light] Co-author's description shows after selecting Co-author
PASS: [light] no other mode's description leaks in alongside Co-author's
PASS: [light] switching to Critic really changes the shown description
PASS: [light] Co-author's description is gone after switching to Critic
PASS: [light] Critic subcategory chips appear after switching (onSelectMode genuinely fired)
PASS: [light] switching to Reader shows Reader's description
```
(идентично для `[dark]`.) Проверено на реальных размерах DOM-элементов (40.0×40.0px, действительно
квадрат), реальном значении `title`-атрибута под настоящим `hover()`, и реальном переключении
режимов — переход на Critic подтверждён не только сменой описания, но и появлением реального
дочернего UI (`Связность`/`Достоверность` — чипы подкатегорий, которые рендерятся только при
`selectedMode === "critic"`), то есть `onSelectMode` действительно сработал, а не просто
подсветилась кнопка.

**Итог скрипта: `TOTAL FAILURES: 0`** (все 2 цветовые схемы × все проверки).

Скриншоты (сохранены и просмотрены, scratchpad, не в репозитории): `step02-light-before-drag.png`,
`step02-light-after-drag.png`, `step02-light-picker-reader.png` и аналогичные `step02-dark-*.png`.
Визуально подтверждено: делитель реально сдвигает границу между панелями (569/569 → 819/319px),
ряд из 4 квадратных кнопок (жёлтая/зелёная/красная/синяя) с активной выделенной рамкой (зелёная —
"Редактор" на скриншотах "before"/"after", синяя — "Читатель" на "picker-reader"), описание только
активного режима под рядом, контраст в тёмном режиме не сломан (белый текст на чёрном/zinc-900, тот
же паттерн, что остальной UI).

### Постусловия и уборка

- Scratch-сервер на порту 3612 остановлен (`taskkill` по PID из `netstat`), порт свободен
  (подтверждено повторным `netstat`).
- Тестовая база `literary_studio_step25_02_test` полностью удалена (`DROP DATABASE`).
- Временный файл проверки (`.scratch-verify-step02.mjs`) удалён из `apps/studio/`; `git status
  --short` подтверждает отсутствие следов моей проверки в рабочем дереве.
- **Реальная БД `literary_studio` не тронута:** `SELECT COUNT(*) FROM "Book"` = 4,
  `SELECT COUNT(*) FROM "User"` = 1 — до и после проверки не менялось (я ни разу не подключал
  scratch-сервер к этой базе).
- **`localhost:3000` (сессия Product Owner, если активна) не останавливался** — `curl` в конце
  проверки → `200`.

## Отклонения от Step Card

Технических отклонений от буквы контракта нет. Технические решения, оставленные карточкой на
усмотрение реализации — зафиксированы здесь, как и требует карточка:

1. **Механизм делителя — `react-resizable-panels@^4.12.1`** (вариант "а" из развилки карточки), а
   не ручная реализация на `mousedown`/`mousemove`/`mouseup`. Причины: (а) готовая поддержка
   touch-устройств, клавиатурной доступности (`role="separator"`, стрелки/Home/End) и edge-кейсов
   при ресайзе окна "из коробки" — то есть ровно тот случай, когда не изобретать велосипед
   оправдано; (б) сама библиотека не тянет транзитивных зависимостей (`npm install` добавил
   ровно 1 пакет); (в) это обычный UI-примитив, не AI-оркестрация — не подпадает под ограничение
   ADR-0003 про AI-фреймворки, только про них. Версия `^4.12.1` — актуальный `latest` на момент
   установки (сама библиотека мажорно обновилась дальше, чем более старая v1/v2 API, которую можно
   встретить в старых примерах в интернете — см. следующий пункт).
2. **API-ловушка, найденная и обойдённая:** в этой версии `defaultSize`/`minSize` **числом**
   (`{20}`) интерпретируются как **пиксели**, а не проценты — документация библиотеки прямо это
   оговаривает ("Numeric values are assumed to be pixels"), но это легко упустить, если ожидать
   поведения более старых версий той же библиотеки. Первый прогон живой проверки поймал это
   реально (панель схлопывалась почти до `minSize={20}` = 20px вместо ожидаемых 20%) — исправлено
   передачей строк (`defaultSize="50"`, `minSize="20"`), что по документации интерпретируется как
   проценты. Зафиксировано здесь явно, так как это неочевидный источник будущего регресса, если кто-то
   позже отредактирует эти пропы, не подозревая о разнице `number` vs `string`.
3. **Отзывчивость на мобильных (`< lg`) — не покрыта самой библиотекой напрямую.** `Group` всегда
   навязывает свой `display:flex`/`flexDirection` через `orientation`, независимо от CSS-брейкпоинтов,
   поэтому пришлось добавить собственный `useIsDesktopLayout()` (`matchMedia`, тот же порог 1024px,
   что и Tailwind `lg`) поверх библиотеки, чтобы сохранить прежнее мобильное поведение (колонка) без
   изменений. Известный побочный эффект: если реально изменить ширину окна браузера так, чтобы
   пересечь этот порог во время сессии (не то же самое, что открыть/закрыть приложение на разных
   устройствах), React перемонтирует основное содержимое/`AssistantPanel` (меняется форма JSX-дерева
   — обычный `<>...</>` vs `<Group><Panel>...`), что сбросит их локальный эфемерный UI-стейт (например,
   фокус текстового поля). Это редкий кейс (пересечение брейкпоинта живым ресайзом окна, а не
   загрузка страницы на разных устройствах), явное техническое решение, не эскалация.
4. **`useIsomorphicLayoutEffect`** (переключается на `useEffect` вне браузера) — стандартный приём
   для `matchMedia`-детекции без hydration-мисматча: на сервере/первом клиентском рендере
   `isDesktop` всегда `false` (как и было раньше по умолчанию для мобильной раскладки), поэтому
   серверный HTML и первый клиентский рендер совпадают буквально — предупреждения о гидратации не
   возникает. Остаточный эффект: на реальном desktop-экране при полной перезагрузке страницы
   возможна одна очень короткая (доли кадра) вспышка мобильной раскладки до срабатывания эффекта —
   не проверялась отдельно (не наблюдалась визуально в живой проверке, но и не была целью замера),
   зафиксирована как осознанный компромисс, а не скрытая проблема.
5. **Picker: нативный `title`/`aria-label`**, не кастомный tooltip-компонент — буквально то, что
   разрешала карточка ("на усмотрение реализации, без новой зависимости ради одного tooltip").
   `aria-pressed={isActive}` на кнопках — не требование карточки, добавлено как бесплатное
   улучшение доступности той же формы, что уже была (просто атрибут, не меняет поведение/сборку).
6. **Место абзаца описания** — сразу под рядом иконок, до имеющегося блока
   "текущий режим + контекстные кнопки" (`Предложить структуру`/`Начать заново`), а не внутри него —
   самый буквальный вариант прочтения "переносится под ряд иконок" из текста карточки.
7. Ширина полосы-делителя (`w-1.5`, ~6px) и квадратных кнопок (`h-10 w-10`, 40×40px) — конкретные
   числа оставлены на усмотрение реализации картой ("на усмотрение реализации"), выбраны по
   аналогии с уже существующими интерактивными элементами этой панели (`rounded-full`/`px-2.5 py-1`
   и т.п. масштаб).

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`).
