# Инвентаризация (Шаг 1) — Rename-AIBus-Process-To-TaskBus

Полный `grep -rn "AI Bus\|ai-bus\|AI_BUS" docs/` — 263 строки. Ничего не переименовано,
никакой код не менялся, `git status` пуст по коду.

## ⚠️ Главная находка перед Шагом 2 (требует решения, не line-by-line вопрос)

**`docs/ai-bus/queue/done/` содержит 33 файла**, и по букве Scope (`docs/ai-bus/**`, включая
переименование папки) все они подпадают под переименование пути — папка неизбежно
переезжает в `docs/task-bus/queue/done/` вместе со всем остальным. Но многие из этих файлов
**внутри своего текста** упоминают «AI Bus» в обоих смыслах одновременно (например, мой же
`Sprint-08-Step-02-ARP.md` в одном абзаце говорит и «AI Bus real dispatch» — про код, и
«ARP файлом в `docs/ai-bus/queue/active/`» — про процесс/путь).

Это прямо конфликтует с уже зафиксированным в `docs/ai-bus/queue/README.md` принципом:
*«`done/` is append-only: a file, once placed here, is never edited or removed — it is a
historical record»* — тем же принципом, что уже применяется к `EXECUTION_LOG.md`.

**Не переписывал текст ни одного файла в `done/`** — только неизбежное перемещение пути
(папка `ai-bus` → `task-bus` затронет и `done/` как подпапку). Внутреннее содержимое
33 архивных файлов пометил ниже отдельным блоком **UNCERTAIN**, а не построчно —
если разбирать каждую строку по отдельности, это ещё ~90 строк, большинство из которых
смешивают оба смысла в одном файле. **Моя рекомендация:** не переписывать текст внутри уже
заархивированных `done/*.md` — только путь. Но решение не моё — жду вашего.

## 1. Полностью PROCESS — переименовать без сомнений

Эти файлы/строки целиком про протокол Architect↔Programmer, без единого упоминания
продуктового кода:

| Файл | Строки |
|---|---|
| `docs/ai-bus/AI_BUS_V3.md` | 2, 8, 12, 31 |
| `docs/ai-bus/AI_BUS_V4.md` | 1, 4, 10, 34, 105–114, 164, 179 |
| `docs/ai-bus/BOOTSTRAP.md` | 1, 10, 29–31, 35, 40, 54 |
| `docs/ai-bus/BRIDGE.md` | 1, 6, 14, 15, 22, 28, 30, 36, 37, 40, 47, 48 |
| `docs/ai-bus/EXECUTION_ALIGNMENT.md` | 1, 3, 5, 11, 53 |
| `docs/ai-bus/EXECUTION_CLOSURE.md` | 1, 4, 51, 57 |
| `docs/ai-bus/EXECUTION_LOG.md` | 1, 9, 101, 104, 105, 106, 115, 118 |
| `docs/ai-bus/PROMPT_TEMPLATE.md` | 1 |
| `docs/ai-bus/REVIEW_FORMAT.md` | 1 |
| `docs/ai-bus/STANDING-PROMPT.md` | 4, 9, 25 |
| `docs/ai-bus/STEP_CARD_TEMPLATE.yml` | 1 |
| `docs/ai-bus/queue/README.md` | 1, 6*, 17, 19, 20*, 62* |
| `docs/project/CURRENT_STEP.md` | 3, 4*, 5* |
| `docs/project/GLOSSARY.md` | 15, 17, 21, 31*, 78* |
| `docs/project/CURRENT_SPRINT.md` | 49*, 50* |
| `docs/project/PROJECT_STATE.md` | 56, 57* |

`*` — строка содержит путь/ссылку на файл внутри `docs/ai-bus/`, который переедет —
ссылку нужно обновить вместе с переименованием (не текстовую замену «AI Bus», а путь).

**Активные Step Card этой же задачи** (`Rename-AIBus-Process-To-TaskBus.md`,
`-Addendum.md`) — их собственный текст про сам процесс переименования не трогаю по тем же
причинам, что и `done/`: это описание задания, а не постоянная документация.

## 2. Полностью PRODUCT — не трогать

Все описывают `apps/studio/src/ai/aiBus.ts` (реальный код-диспетчер) или архитектуру
продукта, никак не процесс:

| Файл | Строки |
|---|---|
| `docs/adr/ADR-0004-expert-contract-specification.md` | 19, 61, 91, 144, 164 |
| `docs/adr/ADR-0005-critic-expert-contract.md` | 15, 49, 99, 114 |
| `docs/project/08_ARCHITECTURE_DECISIONS.md` | 15, 21 (прочитал файл целиком — «AI Bus» там = `aiBus.execute()`, не процесс) |
| `docs/project/11_CURRENT_STATE.md` | 11, 30, 31 (прочитал файл целиком — «AI Bus v5» = код) |
| `docs/project/13_COMPONENT_MAP.md` | 22, 48 (про `EditorArea`/правило «AI вызывается только через AI Bus» = код) |
| `docs/project/14_BACKEND_API.md` | 76 |
| `docs/project/CURRENT_SPRINT.md` | 15, 26, 63, 65, 91 (везде «AI Bus dispatch»/«real dispatch» = код) |
| `docs/project/HANDOVER.md` | 46, 49, 55 (`aiBus.execute`, явно код) |
| `docs/project/PROJECT_STATE.md` | 20, 47, 60, 85, 93, 95 (везде «AI Bus v5» = код) |
| `docs/project/MASTER_PROJECT_DOCUMENT.md` | 85 (рядом с «Workspace Controller реализован», «Storage Layer реализован» — тот же ряд, про код) |
| **Запрещённые пути (не трогать по прямому указанию Step Card):** | |
| `docs/product/DOMAIN_MODEL.md` | 6, 143 |
| `docs/product/EXPERT_CATALOG.md` | 4 |
| `apps/studio/**` | не входит в grep выше (я не искал в коде — Forbidden path) |

**Важное уточнение:** `docs/project/PROJECT_STATE.md:35` — *«AI Bus v4 established as the
canonical, now-frozen execution protocol»* — это единственная строка, где **сам продуктовый
документ описывает исторический факт про ПРОЦЕССНЫЙ протокол v4** (Sprint 04). Здесь «AI Bus
v4» = процесс (`docs/ai-bus/AI_BUS_V4.md`), а не код — несмотря на то, что синтаксически
похоже на соседние «AI Bus v5» (код). Пометил как **PROCESS** отдельно, не в общей таблице
PRODUCT.

## 3. UNCERTAIN — нужно ваше решение

| # | Файл:строка | Текст | Почему сомневаюсь |
|---|---|---|---|
| 1 | `docs/project/15_MASTER_INDEX.md:24` | `- AI Bus` (под заголовком «Архитектура») | Пункт-указатель без контекста — может указывать и на продуктовый раздел `08_ARCHITECTURE_DECISIONS.md#ai-bus` (PRODUCT), и на процессный `10_AI_BUS_WORKFLOW.md` (PROCESS). Не могу определить однозначно. |
| 2 | `docs/architecture/AI_BUS.md` (весь файл, строки 1,3,5) | «AI Bus --- протокол взаимодействия Архитектора (ChatGPT) и Claude.» | Содержимое однозначно PROCESS, но путь `docs/architecture/` **не входит** в Allowed paths этого Step Card вообще. Не трогал. Нужно решение: расширить Scope на этот файл, или сознательно оставить как есть (тогда в проекте останется файл с именем «AI_BUS.md», описывающий процесс, вне зоны этого переименования). |
| 3 | `docs/reports/SPRINT-04.md` (строки 33,52,61,62,81,95,102,112,117,118,124) | Весь блок про «AI Bus v4 frozen», Step Cards, Bridge | Содержимое однозначно PROCESS (Sprint 04, установление протокола v4), но `docs/reports/` **не входит** в Allowed paths. Это исторический sprint-отчёт — по аналогии с `EXECUTION_LOG.md`, вероятно, тоже должен остаться неизменным как исторический документ, а не только из-за формального Scope. Не трогал. |
| 4 | `docs/reports/SPRINT_06_REPORT.md` (строки 97,115,121) | Смешанно: строка 97/121 — PRODUCT («AI Bus (aiBus.execute)», «минуя AI Bus»), строка 115 — неясно без более широкого контекста | Тот же файл вне Allowed paths (`docs/reports/`) — не трогал независимо от классификации. |
| 5 | `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md:93` | «операции AI Bus должны их поддерживать» | PRODUCT по смыслу (расширение Operation-модели), но `docs/vision/` не входит в Allowed paths. Не трогал. |
| 6 | Файлы `docs/project/07_AI_BUS.md`, `10_AI_BUS_WORKFLOW.md` | Содержимое — PROCESS (протокол ChatGPT/Claude, ARP-формат) | Сами **имена файлов** содержат `AI_BUS`, но Step Card явно предписывает переименовать только `docs/ai-bus/` → `docs/task-bus/` и `AI_BUS_V4.md` → `TASK_BUS_V4.md` — про переименование ЭТИХ конкретных файлов (`07_AI_BUS.md`, `10_AI_BUS_WORKFLOW.md`) ничего не сказано. Если поменять текст внутри («AI Bus» → «Task Bus»), но оставить имя файла `07_AI_BUS.md` — получится нестыковка (файл называется по-старому, текст внутри — по-новому). Нужно решение: переименовать и эти файлы тоже, или оставить их имена как есть и просто обновить текст внутри. |
| 7 | `docs/project/15_MASTER_INDEX.md:13` | `5. AI_BUS_WORKFLOW` (пункт обязательного порядка чтения) | Ссылается на файл `10_AI_BUS_WORKFLOW.md` — та же нестыковка, что в п.6: если этот файл не переименовывается, ссылка остаётся корректной как есть; если переименовывается — нужно поправить и здесь. |

## Проверка соответствия ожиданиям Step Card

- Все упоминания в `ADR-0004`/`ADR-0005` — подтверждено, ровно PRODUCT, как и предполагал сам
  Step Card («скорее всего их там нет [процессных], если сомневаешься — не трогай»). Оставляю
  оба ADR полностью нетронутыми.
- `docs/product/DOMAIN_MODEL.md`, `docs/product/EXPERT_CATALOG.md` — Forbidden path,
  подтверждено PRODUCT-содержимым, не трогал.
- `apps/studio/**` — не искал вообще, Forbidden path, ни одной строки не читал ради этой
  задачи.

## Stop Condition

Согласно Step Card, останавливаюсь здесь — Шаг 2 (само переименование) не начат. Жду решения
по:

1. Судьба `docs/ai-bus/queue/done/` (33 файла) — переезжает только путь, текст не трогать?
2. Пункты UNCERTAIN 1–7 выше.

Ничего не закоммичено, код не менялся, `docs/ai-bus/**` физически не переименован.
