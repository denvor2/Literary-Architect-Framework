id: Sprint-13-Step-05
name: "UI: реальный чат-механизм + консолидация переключателя помощников"
type: implementation

## Примечание о процессе

Эту карточку ставлю себе сам (Programmer/Executor) — сессия работает без отдельного Architect
в этом окне, Product Owner подтверждает scope и ревьюит напрямую (см. `HANDOVER.md`). Формат —
по установленному в этом проекте практическому шаблону (Scope/Objective/Rules/Validation), не
по формальному `STEP_CARD_TEMPLATE.yml`, для согласованности с `docs/task-bus/queue/done/`.

## Scope

Allowed paths:
- `apps/studio/src/components/EditorArea.tsx`
- `apps/studio/src/components/AssistantPanel.tsx`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/components/LineEditorPanel.tsx`
- `apps/studio/src/components/NewBookDialog.tsx`

Forbidden paths:
- `apps/studio/src/domain/**`, `apps/studio/src/storage/**`, `apps/studio/src/ai/**`,
  `apps/studio/src/app/api/**`, `apps/studio/src/workspace/useWorkspaceController.ts` — все
  готовы (Steps 01-04), не трогать.
- Полный редизайн "единого вида книги" (vision-документ, раздел 2) — отдельная, не
  спроектированная эпика, не эта задача.
- Responsive-переработка `Sidebar.tsx` — известное, не новое ограничение, вне scope.

## Objective

Подключить готовые Steps 01-04 к реальному UI: (1) починить сборку, сломанную Step 03
(`sceneText`+`messages` вместо `text`/`currentText`); (2) заменить декоративную,
никуда не подключённую `AssistantPanel.tsx` и одноразовый `SceneImprove` внутри `EditorArea.tsx`
единой функциональной поверхностью — карточки-переключатель ролей + настоящая история чата
(`activeThreads`/`appendMessage`/`createThread`) — с responsive-раскладкой (карточки справа,
`lg:+`; список снизу уже, `< lg`).

## Принятые решения (без отдельного Architect, задокументировано для будущих сессий)

1. **`AssistantPanel.tsx` становится единственной функциональной AI-поверхностью.**
   `SceneImprove` целиком удаляется из `EditorArea.tsx` — тот возвращается к чистому
   редактированию текста сцены (заголовок, textarea, счётчик слов). Причина: сегодня в кодовой
   базе ДВЕ параллельные, взаимно избыточные поверхности (декоративные карточки в
   `AssistantPanel` без единого обработчика, и реально работающий dropdown в `EditorArea`) —
   консолидация устраняет дублирование, а не создаёт его.
2. **Perception layer (`MODE_INFO`'s scene phase/consistency/compressionTag/"памяти нет") снят
   целиком** — подтверждено Product Owner отдельным вопросом. Он был явной компенсацией за
   отсутствие настоящей памяти (см. код-комментарии Steps 13-16, Sprint 05); теперь память
   реальна и персистентна, старый текст стал не просто устаревшим, а буквально ложным.
   Остаётся только emoji/label/accent-цвет на карточку.
3. **Канонический тип режима** в новом коде — `"coauthor"|"editor"|"critic"|"reader"`
   (`Workspace["selectedAssistantMode"]`), не старые capitalized UI-лейблы — устраняет
   параллельный тип.
4. **`textareaRef` поднимается в `page.tsx`** (был внутри `EditorArea`) — `AssistantPanel`
   теперь сосед `EditorArea`, не потомок, и должен уметь читать текущее выделение текста для
   Critic/Reader (`getSelectedText`, тот же принцип, что был, просто на уровень выше).
5. **Модель отправки:** поле ввода может быть пустым (сохраняет сегодняшний "просто нажал
   Спросить без своего текста" UX) — тогда `appendMessage` для роли `user` не вызывается,
   в AI Bus уходит история треда как есть. Если пользователь напечатал текст — сначала
   `appendMessage(mode, {role:"user",...})`, тот же (не ждущий re-render) массив уходит в
   `aiBus.execute()`.
6. **Co-author/Editor** — у каждого ответа-ревизии в чате кнопка "Вставить в сцену"
   (недоступна, если сцена не выбрана). **Critic/Reader** — кнопка "Начать заново"
   (`createThread(mode)`) в шапке чата; у Co-author/Editor такой кнопки нет (непрерывный
   контекст навсегда, по решению Product Owner из vision-документа, раздел 5).
7. **Critic** — `response.text` остаётся JSON-строкой reviews (не меняется в этом шаге);
   рендерится через `JSON.parse` с `try/catch` в момент отображения сообщения (персистентные
   данные — оправданная защита, которой не было в одноразовом коде).
8. Responsive: `lg:` breakpoint (та же техника, что уже использована для Critic-панели,
   Sprint-08-Step-04) — pure CSS, без JS-детекции ширины.

## Rules

- Только перечисленные Allowed paths.
- Immutable/паттерны — как везде в проекте; не вводить новые абстракции сверх необходимого.
- UI copy — смешанный язык, как сейчас в проекте (действия — по-русски, служебный текст может
  остаться по-английски) — полная локализация явно отложена до Sprint 30-40 (раздел 6
  vision-документа), не пытаться исправить это здесь.

## Validation

- `npx tsc --noEmit` — 0 ошибок (в отличие от Step 03, где 6 ошибок в этих же файлах были
  ожидаемо оставлены).
- `npm run lint`, `npx prettier --check` — чисто.
- Живая проверка: реальный чат-цикл (user message → AI Bus → assistant message) хотя бы для
  одной роли против настоящего backend (established scratchpad-технику monkey-patch
  `global.fetch` против `next start`), плюс pure-logic проверка ветвления по режимам
  (Critic/Reader "Начать заново", Co-author/Editor непрерывный тред) без сети.
- `git status --short` — только файлы из Allowed paths.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммить без подтверждения Product Owner (работаем без отдельной сессии Architect).
