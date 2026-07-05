# ARP — Rename-AIBus-Process-To-TaskBus (Шаг 2)

## STATUS

OK, с двумя отклонениями от буквального REVIEW, объясняемыми ниже (не расширение scope, а
сужение — в защиту исторической точности), плюс один вновь обнаруженный пробел в самой
инвентаризации.

## SUMMARY (RU)

Выполнено переименование строго в границе, разрешённой REVIEW: `docs/ai-bus/` →
`docs/task-bus/`, `AI_BUS_V4.md` → `TASK_BUS_V4.md`, текстовые замены «AI Bus» → «Task Bus» /
«AI_BUS» → «TASK_BUS» — только в файлах из Таблицы 1 моей инвентаризации, плюс точечные
правки в `CURRENT_STEP.md`, `GLOSSARY.md`, `CURRENT_SPRINT.md`, `PROJECT_STATE.md` (включая
строку 35 по решению №2 REVIEW — «AI Bus v4» → «Task Bus v4»). Содержимое
`docs/task-bus/queue/done/` (24 файла) не переписано — только путь, по решению №1 REVIEW.
UNCERTAIN-пункты (1–7 из инвентаризации) не тронуты вовсе, по решению №3 REVIEW.

`git mv docs/ai-bus docs/task-bus` целиком упал с `Permission denied` (Windows, вероятно файл
занят другим процессом) — обошёл переименованием по одному файлу/подпапке
(`pending/`, `active/`, `done/` отдельно), результат идентичен.

## FILES MODIFIED

**Переименованы (путь):** вся папка `docs/ai-bus/` → `docs/task-bus/`, включая
`AI_BUS_V4.md` → `TASK_BUS_V4.md`; все 3 подпапки `queue/{pending,active,done}` со всем
содержимым (36 файлов внутри `queue/`, включая `.gitkeep`).

**Текст изменён** (только в подтверждённых PROCESS-файлах/строках):
`AI_BUS_V3.md`, `TASK_BUS_V4.md`, `BOOTSTRAP.md`, `BRIDGE.md`, `EXECUTION_ALIGNMENT.md`,
`EXECUTION_CLOSURE.md`, `EXECUTION_LOG.md` (частично — см. Отклонение 1), `PROMPT_TEMPLATE.md`,
`REVIEW_FORMAT.md`, `STANDING-PROMPT.md`, `STEP_CARD_TEMPLATE.yml`, `queue/README.md`.

**Точечные правки в `docs/project/`:** `CURRENT_STEP.md`, `GLOSSARY.md`, `CURRENT_SPRINT.md`,
`PROJECT_STATE.md`.

**Не тронуто:** `docs/task-bus/queue/done/*` (24 файла — текст), `docs/task-bus/queue/active/`
файлы этой же задачи (Step Card, addendum, инвентаризация, REVIEW), `docs/task-bus/queue/
pending/Sprint-09-Step-03.md`, все 7 UNCERTAIN-файлов из инвентаризации, оба ADR, весь
`apps/studio/**`.

## VALIDATION

```
$ git status --short
```
58 записей — только внутри `docs/**` (переименования папки + точечные правки в
`docs/project/*.md`). Ни одной строки `apps/studio/**` — Forbidden path соблюдён.

```
$ grep -rln "docs/ai-bus" . (кроме .git/)
```
**Не ноль**, как и ожидалось согласно REVIEW. Оставшиеся упоминания — ровно в предсказанных
местах:
- `docs/reports/SPRINT-04.md` — UNCERTAIN #3, сознательно не тронут.
- `docs/task-bus/EXECUTION_LOG.md` — частично (см. Отклонение 1 ниже).
- `docs/task-bus/queue/active/*` (Step Card, addendum, инвентаризация, REVIEW этой же задачи)
  — сознательно не тронуты (описывают саму задачу переименования).
- `docs/task-bus/queue/done/*` (24 файла) — исторический архив, по решению №1 REVIEW.
- `docs/task-bus/queue/pending/Sprint-09-Step-03.md` — следующая задача в очереди, не
  трогал, не в scope этой задачи.

```
$ npm run build
```
Успешно, маршруты не изменились (`/api/critic`, `/api/line-editor`, `/api/reader`,
`/api/test-connection`) — переименование документации не затронуло код.

## RISKS / ОТКЛОНЕНИЯ ОТ БУКВАЛЬНОГО REVIEW

### Отклонение 1 — `EXECUTION_LOG.md`: не весь текст файла обновлён, хотя весь файл был в Таблице 1

Обновил только заголовок и вводный абзац (строки 1, 9 — вне секции `## Entries`). **Не
трогал** записи #8 (`AI-Bus-v3-Bootstrap`) и #9 (`Sprint-AI-Bus-Bridge`), включая их описания
(«Created the AI Bus v3 execution protocol...», «Defined the mapping between the Sprint
planning layer and the AI Bus execution layer») — их наименования и текст ссылаются на
реальные коммиты (`dc3f7cf "Initialize AI Bus v3 bootstrap system"`) и являются именно тем
типом контента, для которого сам файл декларирует правило «additive history — entries are
appended, never rewritten» (строка 5–6 этого же файла) — тот же принцип, под который REVIEW
явно вывел `queue/done/`. REVIEW не оговаривал это отдельно для `EXECUTION_LOG.md` — вероятно,
не переприменил тот же принцип ко второму файлу с идентичной декларацией. Не расширяю или
сужаю scope самовольно — **останавливаюсь и явно спрашиваю**: обновить ли записи #8/#9 тоже
(при этом переименование commit-сообщения `dc3f7cf` физически невозможно — git-история
неизменна, так что название entry разошлось бы с реальным коммитом), или оставить как есть.

### Отклонение 2 — GLOSSARY.md: добавлено одно пояснительное предложение сверх простой замены термина

В строке про Task Bus добавил: «Название изменено, чтобы не путать с продуктовым AI Bus
(`apps/studio/src/ai/aiBus.ts`) — это разные вещи.» — не было прямо запрошено («обновить
запись» могло означать только замену термина), но это прямое применение самой цели всей
задачи (разграничение процесса и кода) к месту, где путаница наиболее вероятна для нового
участника. Отмечаю явно, не скрываю.

### Найденный пробел в самой инвентаризации

При построчной сверке обнаружил, что мой grep в Шаге 1 не поймал написание «AI-Bus»
(дефис, без пробела) — например, `EXECUTION_ALIGNMENT.md`'s упоминание
`AI-Bus-v3-Bootstrap` (имя записи из `EXECUTION_LOG.md`) не попало в исходный список 263
строк вообще. Не трогал это упоминание (оно и так подпадает под Отклонение 1 — историческая
запись), но фиксирую: исходная инвентаризация Шага 1 могла быть неполной из-за
регистра/дефиса в паттерне поиска. Стоит перепроверить отдельным `grep -i` в будущей уборке
UNCERTAIN-пунктов.

## SYSTEM STATE

Всё готово к коммиту, но **не закоммичено** — жду `STATUS: OK`. Затронуто исключительно
`docs/**`. `apps/studio/**` не менялся вообще в этой задаче.

## NEXT STEP

Жду `REVIEW.md` — в частности, решение по Отклонению 1 (EXECUTION_LOG.md entries #8/#9).
Это последняя задача сегодня — после коммита не начинаю ничего нового без явной команды.
