id: Sprint-15-Step-01
name: "Помощники отвечают на языке текущей книги, не жёстко на русском"
type: implementation

## Пересмотр в процессе выполнения

Первая версия этого шага добавляла жёстко закодированную инструкцию "отвечай на русском" в
Line Editor/Critic. Product Owner поправил: раз в проекте несколько языков книги (`Book.language`:
Russian/English/Ukrainian/Belarusian/Kazakh — `NewBookDialog.tsx`), все помощники должны отвечать
на ТЕКУЩЕМ ЯЗЫКЕ КНИГИ, а не жёстко на русском. Это касается не только Line Editor/Critic (у них
раньше не было вообще никакой языковой инструкции), но и Reader/Co-author — у них уже стояло
жёстко "Respond in Russian", тоже неверно для non-Russian книг. Переделано до коммита — код
из первой версии (жёсткий русский в Line Editor/Critic) не был закоммичен.

## Scope

Allowed paths:
- `apps/studio/src/app/api/line-editor/route.ts`
- `apps/studio/src/app/api/critic/route.ts`
- `apps/studio/src/app/api/reader/route.ts`
- `apps/studio/src/app/api/coauthor/route.ts`
- `apps/studio/src/ai/operations.ts`
- `apps/studio/src/ai/aiBus.ts`
- `apps/studio/src/components/AssistantPanel.tsx`

Forbidden paths:
- `apps/studio/src/domain/**` (`Book.language` уже существует, менять не нужно),
  `apps/studio/src/workspace/useWorkspaceController.ts`, `apps/studio/src/app/page.tsx`.

## Objective

Язык ответа каждого из четырёх Expert'ов определяется `Book.language` конкретной книги, не
жёстко закодирован. Editor/Co-author уже получают `bookContext` (весь `Book`, включая
`language`) — достаточно читать язык оттуда. Critic/Reader НЕ получают `bookContext` вообще (по
дизайну ADR-0008, остаются scene/selection-scoped) — им нужно новое, узкое поле `bookLanguage`
(просто строка, не весь объект книги) через AI Bus.

## Важное отличие Line Editor от остальных трёх

Line Editor возвращает ОТРЕДАКТИРОВАННЫЙ ИСХОДНЫЙ ТЕКСТ — эта часть НЕ должна следовать
`bookLanguage` (иначе редактура превратится в перевод чужого текста). Только прямой ответ на
follow-up-вопрос (не сама редактура) — на языке книги. Для Reader/Critic/Co-author — весь их
собственный вывод (реакция/комментарий/черновик сцены) следует `bookLanguage` целиком.

## Что сделать

1. **`line-editor/route.ts`** — `bookLanguage = bookContext?.language ?? "Russian"`; в system
   prompt: follow-up-ответ на `${bookLanguage}`, сама редактура — язык не меняется (как было).
2. **`coauthor/route.ts`** — `bookLanguage = bookContext.language ?? "Russian"` (`bookContext`
   тут обязателен); "Respond in Russian" → `` Respond in ${bookLanguage} ``.
3. **`critic/route.ts`** — новое поле `body?.bookLanguage` (опционально, дефолт "Russian");
   `comment` каждой записи — на `${bookLanguage}`; `category`/`severity` — без изменений
   (английские enum).
4. **`reader/route.ts`** — то же самое новое поле `body?.bookLanguage`; "Respond in Russian" →
   `` Respond in ${bookLanguage} ``.
5. **`ai/operations.ts`** — `critic_review` и `reader_reaction` payload получают опциональный
   `bookLanguage?: string`.
6. **`ai/aiBus.ts`** — прокидывает `bookLanguage` в тело запроса к `/api/critic`/`/api/reader`,
   если задан.
7. **`AssistantPanel.tsx`** — критик-ветка `handleSend` и `ReaderPanel` (новый проп
   `bookLanguage`, из `book.language`) передают `bookLanguage` в payload. `improve_text`/
   `coauthor_draft` не меняются — они уже шлют весь `bookContext`, откуда бэкенд сам достаёт язык.

## Rules

- `bookLanguage` для Critic/Reader — именно строка, не весь `bookContext` (сознательно, чтобы
  не нарушать ADR-0008's дизайн "Critic/Reader остаются scene-scoped").
- Дефолт при отсутствии — `"Russian"` (совпадает с прежним жёстким поведением и текущим "первая
  версия — на русском" решением, см. vision-документ раздел 6).

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check`, `npm run build` — чисто.
- Живая проверка против реального сервера, минимум:
  1. Editor: английский текст без follow-up → результат остаётся английским (не переведён).
  2. Editor: тот же текст + follow-up-вопрос, `bookContext.language = "English"` → follow-up
     ответ на английском (не на русском).
  3. Reader/Critic/Co-author: `bookLanguage = "Ukrainian"` (или другой не-русский) → реальный
     ответ модели действительно на этом языке, не на русском по умолчанию.
  4. Без `bookLanguage`/`bookContext.language` — прежнее поведение (русский), обратная
     совместимость не нарушена.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
