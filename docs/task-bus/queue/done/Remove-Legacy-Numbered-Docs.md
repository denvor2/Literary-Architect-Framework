id: Remove-Legacy-Numbered-Docs
name: "Удалить устаревшую нумерованную документацию (пре-Sprint-07, era ChatGPT-Architect)"
type: implementation

## ВАЖНО — прочитать перед началом

Это удаление файлов, не просто правка. Работай методично: сначала
инвентаризация с перекрёстной проверкой, потом (после моего
подтверждения по инвентаризации, как это уже было при переименовании
Task Bus) — само удаление. НЕ удаляй файлы сразу без этого шага.

Выполнить ПОСЛЕ Add-Roadmap-And-Final-Vision-Notes.md (нужно, чтобы
docs/vision/ROADMAP.md уже существовал, прежде чем убирать старый
docs/project/ROADMAP.md — иначе на мгновение не будет вообще
никакого roadmap-файла).

## Scope

Allowed paths:
- docs/project/*.md, docs/project/*.docx (только конкретные файлы,
  перечисленные ниже — не весь каталог)

Forbidden paths:
- apps/studio/**, apps/skills/**, всё остальное вне docs/project/

## Кандидаты на удаление (обнаружены при попытке использовать
## 17_NEW_CHAT_BOOTSTRAP.md для нового чата — оказался устаревшим,
## упоминает роль "ChatGPT" вместо Architect/Programmer, состояние
## "после Sprint 06")

- docs/project/17_NEW_CHAT_BOOTSTRAP.md (заменён docs/task-bus/BOOTSTRAP.md)
- docs/project/16_CHAT_HANDOVER.md (заменён docs/project/HANDOVER.md)
- docs/project/15_MASTER_INDEX.md (заменён PROJECT_STATE.md)
- docs/project/14_BACKEND_API.md
- docs/project/13_COMPONENT_MAP.md
- docs/project/12_DOMAIN_MODEL.md (ЕСТЬ ТАКЖЕ docs/product/DOMAIN_MODEL.md
  — другой, актуальный файл, НЕ путать, НЕ трогать)
- docs/project/11_CURRENT_STATE.md (заменён PROJECT_STATE.md)
- docs/project/10_AI_BUS_WORKFLOW.md (заменён docs/task-bus/)
- docs/project/08_ARCHITECTURE_DECISIONS.md (заменён docs/adr/)
- docs/project/07_AI_BUS.md (заменён docs/task-bus/)
- docs/project/03_AI_Bus_Architecture.docx
- Все .docx-версии перечисленных выше (07_AI_BUS.docx,
  08_ARCHITECTURE_DECISIONS.docx, 10_AI_BUS_WORKFLOW.docx,
  11_CURRENT_STATE.docx, 12_DOMAIN_MODEL.docx, 13_COMPONENT_MAP.docx,
  14_BACKEND_API.docx, 15_MASTER_INDEX.docx)
- docs/project/ROADMAP.md (старый, простой — заменяется
  docs/vision/ROADMAP.md, СНАЧАЛА проверь, что тот файл уже
  существует в репозитории — если нет, останови и сообщи)
- docs/project/MASTER_PROJECT_DOCUMENT.md (проверь при инвентаризации
  — вероятно тоже legacy, но не удаляй без проверки по Шагу 1)

НЕ удалять без дополнительной проверки: BACKLOG.md,
DEVELOPMENT_PROCESS.md, DEVELOPMENT_WORKFLOW.md, GLOSSARY.md,
HANDOVER.md, PROJECT_CHARTER.md, PROJECT_STATE.md, CURRENT_SPRINT.md,
CURRENT_STEP.md — это действующие, актуальные документы.

## Шаг 1 — инвентаризация и перекрёстная проверка (сделай и приложи
## в ARP ДО удаления)

Для каждого файла-кандидата:
1. grep по всему репозиторию на предмет ссылок НА этот файл из
   других (ещё живых) документов — если найдёшь ссылку из
   актуального документа, не удаляй, пометь UNCERTAIN, опиши в ARP.
2. Быстро сверь содержимое с предполагаемой актуальной заменой —
   убедись, что замена реально покрывает то же самое (не обязательно
   дословно, просто по сути), не просто предположи по названию.
3. Помести результат в ARP: таблица файл → статус (DELETE/UNCERTAIN)
   → на что заменён/почему.

## Шаг 2 — удаление (только после моего подтверждения по Шагу 1)

git rm перечисленных файлов (история остаётся в git log, ничего не
теряется навсегда). НЕ удаляй файлы, помеченные UNCERTAIN — жди
решения.

## Rules

- Инвентаризация — обязательный отдельный шаг перед удалением, не
  пропускай.
- docs/product/DOMAIN_MODEL.md — НЕ ТРОГАТЬ, это другой, действующий
  файл, легко перепутать с docs/project/12_DOMAIN_MODEL.md.
- При любой неопределённости — не удаляй, помечай UNCERTAIN и жди.

## Validation

- git status --short — только перечисленные в Scope файлы (после
  Шага 2).
- grep -rn "17_NEW_CHAT_BOOTSTRAP\|16_CHAT_HANDOVER" . (кроме .git/)
  → 0 совпадений после удаления (кроме, возможно, самого ARP-отчёта).

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат. Инвентаризация
(Шаг 1) — отдельным ARP-разделом, жди REVIEW перед Шагом 2, как
было с переименованием Task Bus.

## Stop Condition

Не удаляй ничего (Шаг 2) без явного STATUS: OK от Architect именно
на инвентаризацию из Шага 1.
