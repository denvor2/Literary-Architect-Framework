id: Fix-CurrentSprint-Lag-ARP
name: "ARP: CURRENT_SPRINT.md/CURRENT_STEP.md актуализированы, конвенция изменена, BOOTSTRAP.md предупреждает"
type: arp

## Что сделано

### 1. Немедленная актуализация

- **`docs/project/CURRENT_STEP.md`** — было `Sprint-12-Step-05, status: done, next: []`;
  стало `Sprint-13-Step-04, status: done, next: [Sprint-13-Step-05]`. Добавлено explaining-предложение
  над YAML-блоком про новую конвенцию (обновляется на каждом шаге, не только на закрытии спринта).
- **`docs/project/CURRENT_SPRINT.md`** — полностью переписан под Sprint 13 (по его же
  заявленной конвенции "replaced at the start of every sprint" — именно это не произошло вовремя,
  в чём и была проблема). Источник истины — `git log --oneline --all | grep sprint-13` (точные
  хэши: `f68e676`, `5c2d3e9`, `db8b510`, `af18c4b`) плюс содержимое `docs/task-bus/queue/done/Sprint-13-Step-0{1,2,3}.md`
  для точных формулировок каждого шага. Steps 01-04 — done с хэшами; Step 05 — Next Action, не
  начат.

### 2. Изменение конвенции

- `CURRENT_STEP.md` теперь по тексту обязан обновляться на каждом Step Card, закрывающемся через
  `REVIEW STATUS: OK` — зафиксировано прямо в файле (не только в этом ARP, чтобы не потеряться).
- `CURRENT_SPRINT.md` сохранил старую конвенцию (обновляется на границах спринта, полное summary),
  но получил заметную (bold, сразу под заголовком) одну строку-предупреждение: не считать этот
  файл единственной правдой в середине спринта, смотреть `CURRENT_STEP.md`.

### 3. BOOTSTRAP.md

Точечно, только в Level 2 (без переписывания остальной структуры документа): добавлен абзац,
явно предупреждающий, что `CURRENT_SPRINT.md` отражает состояние на момент последнего закрытия
спринта и по определению может быть неактуален mid-sprint, со ссылкой на `CURRENT_STEP.md` и
`docs/task-bus/queue/done/` как источник истины, и на этот же Fix как прецедент.

## Отклонение от Step Card (по существу, не по объёму)

Часть 1 Step Card говорила "актуализировать" — я сделал полную замену содержимого
`CURRENT_SPRINT.md`, а не точечную правку. Обоснование: сам файл заявляет собственную конвенцию
("replaced at the start of every sprint") — именно эта замена не случилась вовремя при переходе
Sprint 12 → Sprint 13, что и есть корень проблемы. Точечная правка старого Sprint-12-текста
оставила бы файл в текущем виде — Sprint 12 informacию как "recent", а Sprint 13 добавленным
сбоку, что хуже, а не лучше. Не меняет Scope (файл тот же), не меняет Allowed paths.

## Соответствие Scope

Изменены ровно 3 файла из Allowed paths: `docs/project/CURRENT_SPRINT.md`,
`docs/project/CURRENT_STEP.md`, `docs/task-bus/BOOTSTRAP.md`. `git status --short` подтверждает —
ничего больше не тронуто.

## Validation

- `CURRENT_SPRINT.md`/`CURRENT_STEP.md` отражают Sprint 13, Step 04 done, Step 05 next — сверено
  с `git log` (хэши приведены выше, точное совпадение).
- `BOOTSTRAP.md` содержит явное предупреждение про lag `CURRENT_SPRINT.md` (см. `grep` ниже).
- `grep -n "sprint CLOSE|last sprint" docs/task-bus/BOOTSTRAP.md` → совпадение найдено на строке
  25 ("last sprint **close**").

## Stop Condition

Не закоммичено. Работаем без отдельной сессии Architect в этом окне — прошу подтверждения
Product Owner перед коммитом, как обычно.
