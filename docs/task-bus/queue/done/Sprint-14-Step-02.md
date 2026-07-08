id: Sprint-14-Step-02
name: "UI: именованные экземпляры Reader — карточки, вкладки, сравнение бок о бок"
type: implementation

## Примечание о процессе

Ставлю себе сам (Programmer/Executor), работаем без отдельного Architect. Развилки дизайна уже
разрешены Product Owner в Plan Mode перед Step 01 (персонажи настоящие; нужны и вкладки, и
сравнение бок о бок) — см. `docs/project/CURRENT_SPRINT.md`.

## Scope

Allowed paths:
- `apps/studio/src/components/AssistantPanel.tsx`
- `apps/studio/src/app/page.tsx` (только проброс новых пропов/мутаций из контроллера — сам
  контроллер уже готов, Step 01)

Forbidden paths:
- `apps/studio/src/domain/**`, `apps/studio/src/storage/**`, `apps/studio/src/ai/**`,
  `apps/studio/src/app/api/**`, `apps/studio/src/workspace/useWorkspaceController.ts` — всё
  готово в Step 01, не трогать.
- Co-author/Editor/Critic рендер в `AssistantPanel.tsx` — не менять, только читать/переиспо-
  льзовать то, что уже есть; меняется только ветка Reader.

## Objective

Подключить готовую в Step 01 "проводку" (`persona`, `createThread(options)`, `renameThread`,
`deleteThread`, `appendMessage(mode, message, threadId?)`) к реальному UI для Reader: список
именованных экземпляров вместо единого чата, переключение по одному (вкладки) и сравнение 2+
экземпляров бок о бок.

## Дизайн (по решениям Product Owner из планирования)

1. **Источник данных** — `book.assistantThreads.reader` (весь массив, не только последний
   элемент) — уже доступен через существующий проп `book`, новый проп для этого не нужен.
2. **Локальное UI-состояние в `AssistantPanel`, не персистится** (тот же класс, что
   `isFocusMode` в `page.tsx`): `selectedThreadId` (какой экземпляр открыт для отправки
   сообщений — по умолчанию последний), `compareIds` (набор для сравнения бок о бок), состояние
   формы создания и переименования.
3. **Ряд чипов-экземпляров** над чатом: имя, персонаж (если есть), клик по имени — выбирает как
   активный для отправки (вкладка); отдельный переключатель — добавляет/убирает из набора
   сравнения; карандаш — инлайн-переименование (`renameThread`); урна — удаление
   (`deleteThread`; задизейблена, если это последний экземпляр — контроллер и так no-op, но UI
   не должен создавать ложное ожидание).
4. **Режим сравнения** — при `compareIds.size >= 2`: сетка (responsive `lg:`, как везде) с
   read-only историей каждого выбранного экземпляра (последние сообщения, без поля ввода в
   каждой карточке — отправка нового сообщения возможна только в single-view). Явное
   упрощение первой версии — если Product Owner попросит ввод прямо в карточках сравнения,
   это отдельный шаг.
5. **"+ Новый читатель"** — инлайн-форма (имя + персонаж, оба текстовых поля) →
   `createThread("reader", { name, persona })`.
6. **Отправка** в single-view адресуется `thread.id` выбранного чипа
   (`appendMessage("reader", message, thread.id)`) и включает `persona` этого треда в payload
   `reader_reaction`.
7. Co-author/Editor/Critic — рендер не меняется вообще (для Critic кнопка "Начать заново"
   остаётся как в Step 05, никакой формы имя+персонаж не появляется — вне scope этого спринта).

## Rules

- Immutable-паттерны, переиспользование существующих компонентов (`ReviewList` и т.п. не
  трогать — не относится к Reader).
- UI copy — по-русски для новых элементов управления, по аналогии с уже существующими
  ("Начать заново", "Спросить").
- Не добавлять серверное/доменное состояние сверх того, что уже есть в Step 01.

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check` — чисто.
- Живая проверка:
  1. Pure-logic скрипт для новой ветвящейся логики (переключение чипа, добавление/удаление из
     набора сравнения, построение payload с `persona` для выбранного треда).
  2. Реальный прогон `next start` — хотя бы один полный цикл отправки сообщения конкретному
     экземпляру Reader с его `persona` через реальный AI Bus путь (`aiBus.execute`), не только
     напрямую по `/api/reader` (это уже сделано в Step 01) — здесь проверяем именно то, что
     строит `AssistantPanel.tsx`.
- `git status --short` — только файлы из Allowed paths.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
