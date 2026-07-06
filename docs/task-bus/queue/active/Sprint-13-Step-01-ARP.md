# ARP: Sprint-13-Step-01

**Step Card:** Домен-модель: диалоги помощников (assistantThreads) внутри Book + сохранение
выбранного режима
**Тип:** implementation (домен-слой)
**Исполнитель:** Programmer (Executor)

## Что сделано

### 1. `apps/studio/src/domain/model.ts`

Добавлены типы `ChatMessage`, `AssistantThread`, `AssistantThreads` — одна структура данных для
всех четырёх ролей (Co-author/Editor/Critic/Reader), как и требовал Step Card; разница в том, как
UI её использует, откладывается до Step 04. `Book` получил обязательное поле
`assistantThreads: AssistantThreads`.

### 2. `apps/studio/src/domain/workspace.ts`

`Workspace` получил `selectedAssistantMode: "coauthor" | "editor" | "critic" | "reader"`.

### 3. `apps/studio/src/storage/workspaceStorage.ts`

- `EMPTY_WORKSPACE` получил `selectedAssistantMode: "editor"` (дефолт, соответствующий текущему
  поведению UI по умолчанию).
- `normalizeBook()` теперь нормализует `assistantThreads` через новую функцию
  `normalizeAssistantThreads()` — **уточнение к буквальному тексту Step Card**: дефолт не на
  уровне всего объекта `assistantThreads` целиком (`book.assistantThreads ?? весь-дефолт`), а
  **по каждой роли отдельно** (`threads?.coauthor ?? [...]`, и так для каждой из четырёх ролей).
  Первая версия использовала дефолт целиком; при живой проверке сценария "только `coauthor`
  заполнен реальными сообщениями, остальные три роли отсутствуют в сохранённых данных" стало
  видно, что при таком дефолте отсутствующие роли (`editor`/`critic`/`reader`) остались бы
  `undefined`, а не получили бы пустой диалог — именно этот случай Step Card явно требовал
  покрыть в Validation. Исправлено до финальной проверки, фиксирую здесь как найденную и
  устранённую неточность, а не скрытую.
- Ветка старого формата (`data.book`) в `migrateIfNeeded()` теперь тоже возвращает
  `selectedAssistantMode` — дефолт `"editor"` для данных, где этого поля никогда не было (старый
  формат), либо значение из данных, если оно уже сохранено.

### 4. `apps/studio/src/workspace/useWorkspaceController.ts`

- `EMPTY_WORKSPACE` (используется только как pre-hydration состояние) получил
  `selectedAssistantMode: "editor"`.
- `createBook()` — новая книга получает тот же дефолт `assistantThreads` (по одному пустому
  диалогу на роль), что и `normalizeBook()`; `Omit<Book, ...>` в сигнатуре расширен полем
  `assistantThreads`.
- Добавлена `selectAssistantMode(mode)` — устанавливает `selectedAssistantMode`, больше ничего не
  трогает, как и требовалось. Экспортирована из хука.
- Функции добавления сообщений/создания диалогов **не добавлены** — по явной инструкции Step
  Card, это Step 02/04.

## Валидация

```
npx tsc --noEmit  → ровно 1 ошибка, в Forbidden path (NewBookDialog.tsx:51) — компонент ещё
                     не знает про assistantThreads. Ожидаемо, Step Card явно это разрешил.
npm run build     → тот же результат (собирается, падает на том же типе в том же файле).
npx eslint <4 файла Allowed> → чисто, без замечаний.
```

Живая проверка — реальный, не замоканный `loadWorkspace()` (техника из Sprint 11/12: прямой
`import()` скомпилированного модуля через tsx, без сервера):

- **Сценарий 1** — книга в текущем формате (books[]), без `assistantThreads` вообще (сохранена до
  этого шага): после загрузки все четыре роли получили ровно по одному пустому диалогу;
  `selectedAssistantMode` дефолтнулся в `"editor"`.
- **Сценарий 2** — книга с частично заполненными `assistantThreads` (только `coauthor` с двумя
  реальными сообщениями, три остальные роли отсутствуют в сохранённых данных): существующие
  сообщения `coauthor` сохранились дословно (включая порядок и содержимое), отсутствующие роли
  (`editor`/`critic`/`reader`) получили дефолт по одному пустому диалогу; `selectedAssistantMode`
  (сохранённый как `"coauthor"`) сохранился, не был перезаписан дефолтом.

Оба сценария — ALL CHECKS PASS.

`git status --short` → только 4 файла из Scope (плюс сам Step Card, перемещённый в `active/`, как
обычно) — `apps/studio/src/components/**`, `page.tsx`, `apps/studio/src/ai/**`,
`apps/studio/src/app/api/**` не тронуты.

## Отклонения от Step Card

Одно — уточнение уровня детализации дефолта (`normalizeAssistantThreads()` дефолтит каждую роль
по отдельности, а не весь объект `assistantThreads` целиком одним `??`) — необходимое, чтобы
пройти собственное требование Step Card в Validation про частично заполненные данные. Не меняет
ни Scope, ни Forbidden paths.

## Stop Condition

Не закоммичено — жду `REVIEW.md` со `STATUS: OK` от Architect.
