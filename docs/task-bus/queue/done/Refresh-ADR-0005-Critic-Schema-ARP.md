id: Refresh-ADR-0005-Critic-Schema-ARP
name: "ARP: Ревизия ADR-0005 (Critic) — актуализация схемы запроса и подкатегорий"
type: arp

**Step Card:** `docs/task-bus/queue/active/Refresh-ADR-0005-Critic-Schema.md`
**Тип:** architecture (документальная правка, код не менялся)
**Исполнитель:** Programmer (Executor) — через сабагент `step-executor` (smoke-test самой
инфраструктуры сабагентов, см. `docs/project/HANDOVER.md`, раздел "Session handoff note
(2026-07-10)").

## Что сделано

В конец `docs/adr/ADR-0005-critic-expert-contract.md` (после существующей секции `Review
Trigger`, строка 118) добавлены четыре новые секции — по образцу того, как это уже сделано в
ADR-0004 (`Revision (Sprint 12): optional bookContext`, `Revision (Sprint 15 Step 01)`) и
ADR-0006 (`Revision (Sprint 14 Step 01/02)`). Существующие секции `Decision`/`Consequences`
**не переписывались** — только дополнены снизу, как прямо требовал Step Card.

1. **`Revision (Sprint 13 Step 02): sceneText rename + required messages`** — переименование
   `text` → `sceneText`, добавление обязательного `messages: ChatMessage[]`, подтверждение, что
   `bookContext` Critic по-прежнему НЕ получил (остаётся вне таблицы контекстов ADR-0008), как
   `sceneText` заводится первым `user`-сообщением перед `...messages`, и design-решение из
   Sprint-13-Step-02-ARP про то, как follow-up-вопросы остаются внутри структуры `reviews[]`
   (запись `category: "General"`).
2. **`Revision (Sprint 15 Step 01): optional bookLanguage`** — новое опциональное поле,
   дефолт `"Russian"`, зафиксирован узкий эффект (только `comment` следует языку книги,
   `category`/`severity` остаются фиксированным английским enum).
3. **`Revision (Sprint 19 Steps 02-03): optional subcategory`** — новое опциональное поле,
   маппинг на `CRITIC_SUBCATEGORY_PROMPTS`, ссылка на ADR-0009 как источник дизайна, явное
   указание, что вопрос "Critic gains its own thematic subcategories" на самом деле стоял в
   **Review Trigger ADR-0006** (Reader), а не в собственном Review Trigger ADR-0005 (это я
   изначально спутал в черновике и исправил до завершения — см. "Отклонения" ниже).
4. **`Revision (2026-07-10): consolidated current Request/Response Schema`** — сводная текущая
   форма запроса одним блоком (`sceneText`/`messages`/`bookLanguage?`/`subcategory?`), плюс явная
   пометка, что утверждение из `Consequences` ("two ratified members with one shared request
   shape (`{ text }`)") описывает только состояние Sprint 08 и больше не точно — эта пометка
   добавлена именно новым текстом снизу, а не правкой самой секции `Consequences` (то же самое
   "addition, not rewrite" соглашение).

Каждое утверждение о коде подкреплено конкретной строкой в `apps/studio/src/app/api/critic/
route.ts` и `apps/studio/src/ai/operations.ts` — обе прочитаны напрямую перед написанием
(не бралась схема из старого Step Card'а/документации).

## Соответствие Scope

`git status --short`:
```
 M docs/adr/ADR-0005-critic-expert-contract.md
R  docs/task-bus/queue/pending/Refresh-ADR-0005-Critic-Schema.md -> docs/task-bus/queue/active/Refresh-ADR-0005-Critic-Schema.md
```
Единственный изменённый файл контента — `docs/adr/ADR-0005-critic-expert-contract.md`, ровно то,
что разрешено Allowed paths карточки. Перемещение самой карточки в `active/` — стандартная
процессная операция перед началом работы (`CLAUDE.md`), не нарушение Forbidden paths. Код
(`route.ts`, `operations.ts`, любые `apps/studio/**` файлы) не тронут.

## Validation

- **`grep -n "sceneText\|bookLanguage\|subcategory" docs/adr/ADR-0005-critic-expert-contract.md`**
  → 29 совпадений (было 0 до правки) — все три термина присутствуют многократно, включая новую
  сводную JSON-схему. Условие Step Card выполнено.
- **Живая проверка не требовалась** (чисто документальная задача, Step Card сам это оговаривает)
  — вместо неё выполнена построчная сверка с реальным кодом:
  - `body?.sceneText`/`body?.messages` — `route.ts:34-35`; валидация `sceneText` —
    `route.ts:43-48`; валидация `messages` (не массив + по-элементно `role`/`content`) —
    `route.ts:50-72`.
  - `bookLanguage` (дефолт `"Russian"`) — `route.ts:36-39`; языковая инструкция, защищающая
    `category`/`severity` от перевода — `route.ts:79`.
  - `subcategory` — `route.ts:40-41`; словарь подсказок `CRITIC_SUBCATEGORY_PROMPTS` —
    `route.ts:23-30`; композиция суффикса — `route.ts:74-77`.
  - Сборка сообщений для модели (`sceneText` первым `user`-сообщением + `...messages`) —
    `route.ts:83-84`.
  - Ответ не менялся: `{ ok: true, reviews }` — `route.ts:109`; ошибки — `route.ts:110-117`
    (не изменены ни одной из трёх ревизий, зафиксировано явно).
  - `AIOperation` payload `critic_review`: `sceneText`/`messages` — `operations.ts:49-56`;
    `bookLanguage?` — `operations.ts:56-60`; `subcategory?` — `operations.ts:61-65`.
  Все цитируемые в новых секциях номера строк перепроверены построчно против реального
  содержимого файлов после чтения (не по памяти/предположению).
- Полный набор `apps/studio`-валидаторов (`tsc`/`eslint`/`prettier`/`npm run build`) не
  запускался — Step Card описывает чисто документальную задачу вне `apps/studio/src`, её
  собственная секция Validation прямо это оговаривает ("Живая проверка не требуется"), и
  единственный изменённый файл — `.md` в `docs/adr/`, вне области действия этих команд.

## Отклонения от Step Card

Одно самостоятельно найденное и исправленное до завершения: в первом черновике секции про
`subcategory` я написал, что вопрос про тематические подкатегории стоял в **собственном** Review
Trigger ADR-0005 — перепроверка показала, что эта строка ("Critic gains its own thematic
subcategories (Sprint 18)...") на самом деле находится в Review Trigger **ADR-0006** (Reader), а
не ADR-0005. Не отклонение от Scope/Forbidden, а фактическая неточность, обнаруженная и
исправленная в процессе построчной сверки, прежде чем ARP была написана — формулировка в
итоговом тексте ADR-0005 теперь ссылается на правильный документ.

## Stop Condition

Не закоммичено. Это smoke-test самого `step-executor` — карточка прямо требует не коммитить и
ждать подтверждения Product Owner. Жду `STATUS: OK`.
