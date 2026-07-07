id: Remove-Legacy-Numbered-Docs-ARP
name: "ARP: Инвентаризация устаревшей нумерованной документации (Шаг 1 — БЕЗ удаления)"
type: arp

## Важно

Это ТОЛЬКО Шаг 1 (инвентаризация + перекрёстная проверка), как явно требует Step Card и
отдельное подтверждение Product Owner в чате. Ничего не удалено. Шаг 2 (`git rm`) не выполнялся.

## Методология

Для каждого кандидата: (1) `grep -rln` по всему репозиторию (кроме `docs/task-bus/queue/` —
там ожидаемо ссылки из исторических ARP на старые имена, это не "живые" ссылки) на предмет
входящих ссылок из ещё живых документов; (2) чтение содержимого и сопоставление с заявленной
заменой по существу, не по названию; (3) для `.docx` — дополнительно распаковка как ZIP
(`unzip -p *.docx word/document.xml`) и извлечение текста, сравнение с .md-парой.

## Таблица: файл → статус → на что заменён / почему

| Файл | Статус | Обоснование |
|---|---|---|
| `docs/project/17_NEW_CHAT_BOOTSTRAP.md` | **DELETE** | Ссылки только из других кандидатов этого же кластера (`16_CHAT_HANDOVER.md`), не из живых доков. Заменён `docs/task-bus/BOOTSTRAP.md` (существует, 83 строки, та же роль — единая точка входа для новой сессии). Контент старого файла описывает роль "ChatGPT" как Архитектора буквально по имени модели — устаревшая терминология, замененная на model-independent Architect/Programmer ещё в Sprint 07 Step 00. |
| `docs/project/16_CHAT_HANDOVER.md` | **DELETE** | Ссылки только из `15_MASTER_INDEX.md`/`17_NEW_CHAT_BOOTSTRAP.md` (тот же кластер). Заменён `docs/project/HANDOVER.md` (существует, только что актуализирован задачей Fix-Stale-HANDOVER, раздел "First Five Minutes" покрывает ту же роль). Утверждает "Проект завершил Sprint 06... затем Sprint 07" — фактически неверно (Sprint 13 в процессе). |
| `docs/project/15_MASTER_INDEX.md` | **DELETE** | Ссылки только из `16_CHAT_HANDOVER.md`/`17_NEW_CHAT_BOOTSTRAP.md`. Заменён `docs/project/PROJECT_STATE.md` (существует, 243 строки, полноценный текущий снимок состояния — старый файл был просто оглавлением на 76 строк с давно недействующим порядком чтения). Тоже утверждает "Проект завершил Sprint 06" как текущее состояние. |
| `docs/project/14_BACKEND_API.md` | **DELETE** | Нет входящих ссылок из живых доков. Содержимое буквально неверно уже сейчас: `/api/critic`, `/api/readers`, `/api/coauthor` перечислены в разделе "Будущие API", хотя все три давно реализованы и live-validated (Sprint 08/09/12); форма запроса `{text}` устарела дважды (сначала ADR-0004, затем Sprint 13 Step 02 — `sceneText`+`messages`). Заменяющего единого документа с тем же именем нет — актуальное описание API распределено между `docs/adr/ADR-0004..0008` (per-Expert contracts) и самим кодом (`apps/studio/src/app/api/*/route.ts`). |
| `docs/project/13_COMPONENT_MAP.md` | **DELETE** | Нет входящих ссылок из живых доков. Список компонентов неполный уже сейчас (нет `LineEditorPanel`, `BookOverview` и т.д. по факту текущей структуры `apps/studio/src/components/`) и неточный по ролям (например, называет `EditorArea` единственной точкой AI-взаимодействия — по факту так и есть, но остальные детали устарели). Заменяющего документа с тем же именем нет — актуальная архитектура описана в `HANDOVER.md`'s "Current Status" (только что обновлён) и `PROJECT_STATE.md`'s "Current Architecture". |
| `docs/project/12_DOMAIN_MODEL.md` | **DELETE** | **Не путать** с `docs/product/DOMAIN_MODEL.md` — проверено, это другой, существующий и актуальный файл (153 строки), НЕ трогается, ссылок на него в кандидате нет. Кандидат `docs/project/12_DOMAIN_MODEL.md` описывает домен без `Character` (числится "будущее", хотя реализован с Sprint 10), без `assistantThreads` (Sprint 13), без multi-book `Workspace` (Sprint 11) — заменён и `docs/product/DOMAIN_MODEL.md`, и фактическим кодом `apps/studio/src/domain/model.ts`. Нет входящих ссылок из живых доков. |
| `docs/project/11_CURRENT_STATE.md` | **DELETE** | Ссылки только из `16_CHAT_HANDOVER.md` (тот же кластер). Заменён `docs/project/PROJECT_STATE.md`. Содержимое буквально устарело ("Что НЕ реализовано: Characters, Critic/Reader" — оба давно реализованы). |
| `docs/project/10_AI_BUS_WORKFLOW.md` | **DELETE** | Ссылки только из `16_CHAT_HANDOVER.md`/`17_NEW_CHAT_BOOTSTRAP.md`. Заменён `docs/task-bus/` (в частности `TASK_BUS_V4.md`, `REVIEW_FORMAT.md`, `BOOTSTRAP.md`) — тот же ARP-формат (STATUS/SUMMARY/FILES MODIFIED/VALIDATION/RISKS/SYSTEM STATE/NEXT STEP) описан подробнее и актуальнее там. Роль "Architect" тут же называется "ChatGPT" по имени модели — устаревшая терминология. |
| `docs/project/08_ARCHITECTURE_DECISIONS.md` | **DELETE** | Нет входящих ссылок из живых доков. Заменён `docs/adr/` — 8 реальных ратифицированных ADR против абзаца общих деклараций в кандидате. |
| `docs/project/07_AI_BUS.md` | **DELETE** | Нет входящих ссылок из живых доков (кроме себя же через дублирующий `.docx`, см. ниже). Заменён `docs/task-bus/`. Роль "Architect" тоже названа "ChatGPT" буквально. |
| `docs/project/03_AI_Bus_Architecture.docx` | **DELETE** | Нет `.md`-пары, нет входящих ссылок. Текст внутри (извлечён из ZIP) — черновик "docs/architecture/03_ai_bus.md (draft content)", описывающий несуществующий в текущем репозитории путь `docs/architecture/`. Более ранний артефакт того же дорепозиторного этапа, чем весь остальной кластер — заменён фактическим кодом `apps/studio/src/ai/` + `docs/task-bus/`. |
| `docs/project/07_AI_BUS.docx`, `08_ARCHITECTURE_DECISIONS.docx`, `10_AI_BUS_WORKFLOW.docx`, `11_CURRENT_STATE.docx`, `12_DOMAIN_MODEL.docx`, `13_COMPONENT_MAP.docx`, `14_BACKEND_API.docx`, `15_MASTER_INDEX.docx` | **DELETE** | Извлечено содержимое каждого через `unzip -p *.docx word/document.xml` + очистку тегов; выборочно сверено полностью (07_AI_BUS.docx — побайтово тот же текст, что и `07_AI_BUS.md`), для остальных — сверено количество слов как быстрая проверка (23-101 слов, соответствует объёму .md-пары). Все — Word-экспорт своей `.md`-пары, тот же статус. |
| `docs/project/ROADMAP.md` | **UNCERTAIN** | Step Card утверждает "заменяется `docs/vision/ROADMAP.md`, СНАЧАЛА проверь, что тот файл существует — если нет, останови и сообщи". Проверено: файла `docs/vision/ROADMAP.md` **не существует**. Вместо него в репозитории — `docs/vision/roadmap.md` (нижний регистр, существовал ДО этой сессии, Sprint 03, укрупнённые фазы MVP/Persistence/Platform, живые ссылки из README.md/PROJECT_CHARTER.md/BACKLOG.md/ADR-0003) и только что созданный этой же сессией (задача Add-Roadmap-And-Final-Vision-Notes, см. её ARP/REVIEW в `done/`) `docs/vision/SPRINT_ROADMAP.md` (спринты 13-42). Кандидат `docs/project/ROADMAP.md` — простой список из 10 этапов, содержательно ближе к `docs/vision/roadmap.md` (тот же уровень крупности — фазы, а не спринты), но формально не идентичен ни одному из двух. Ни у одной из двух живых ссылающихся на него секций (per Step Card) нет прямого совпадения по имени. Следуя явной инструкции Step Card — **не удаляю**, останавливаюсь и сообщаю: нужно ваше решение, что считать заменой (скорее всего `docs/vision/roadmap.md` по содержанию, но нужно подтверждение, раз имя разошлось). |
| `docs/project/MASTER_PROJECT_DOCUMENT.md` | **DELETE** | Не был в основном списке кандидатов Step Card — отдельно помечен "проверь при инвентаризации, вероятно тоже legacy". Подтверждено: тот же класс артефакта (Sprint-06-era, буквально "Sprint 06 завершён полностью. Sprint 07 ещё не начат."), описывает несуществующую структуру каталогов (`docs/architecture/`, `docs/product/PRODUCT_VISION.md` — хотя `docs/product/` в реальности содержит другой набор файлов). Нет входящих ссылок из живых доков (`grep` дал только совпадение с самим собой и с отдельным root-level `MASTER_PROJECT_DOCUMENT.md`). **Побочная находка, вне scope этого шага:** существует ещё и корневой `./MASTER_PROJECT_DOCUMENT.md` (вне `docs/project/`, т.е. Forbidden path для этой карточки) — судя по всему, тот же документ задублирован на верхнем уровне репозитория. Не трогал, только фиксирую находку — отдельная задача, если понадобится. |

## Перекрёстная проверка "не трогать" списка

Явно сверено `grep`-ом: ни один из `BACKLOG.md`, `DEVELOPMENT_PROCESS.md`, `DEVELOPMENT_WORKFLOW.md`,
`GLOSSARY.md`, `HANDOVER.md`, `PROJECT_CHARTER.md`, `PROJECT_STATE.md`, `CURRENT_SPRINT.md`,
`CURRENT_STEP.md`, `README.md`, `docs/adr/*`, `docs/product/*` не ссылается ни на один файл-кандидат.
Единственные найденные ссылки — внутри самого кластера кандидатов (они ссылаются друг на друга),
что ожидаемо и не блокирует удаление, поскольку весь кластер удаляется одним шагом.

## Соответствие Scope

Прочитаны/проверены только файлы в `docs/project/*.md` и `docs/project/*.docx` (плюс grep по
всему репозиторию для перекрёстной проверки — чтение, не запись). Ничего не изменено и не
удалено ни в `docs/project/`, ни где-либо ещё.

## Итог

19 файлов помечены **DELETE**, 1 файл (`docs/project/ROADMAP.md`) — **UNCERTAIN**, нужно ваше
решение.

## Шаг 2 — выполнено (после `STATUS: OK` от Architect)

`docs/project/ROADMAP.md` разрешён как DELETE (Architect: содержательно избыточен относительно
уже существующего `docs/vision/roadmap.md`, тот же уровень крупности — фазы, не про коллизию
имён). `git rm` выполнен для всех 21 файла из таблицы выше (19 изначальных DELETE-кандидатов +
`docs/project/MASTER_PROJECT_DOCUMENT.md`, отдельно проверенный по указанию карточки + разрешённый
`docs/project/ROADMAP.md`). Коммит: `35c017e` — "docs: remove legacy pre-Sprint-07 numbered
documentation cluster".

**Поправка счёта:** итоговая строка в разделе "Итог" выше писала "19 файлов DELETE + 1
UNCERTAIN" = 20 — арифметическая неточность с моей стороны (не учла `MASTER_PROJECT_DOCUMENT.md`
как отдельную 20-ю DELETE-позицию сверх исходных 19 кандидатов карточки). Фактически в таблице
было 20 DELETE + 1 UNCERTAIN = 21 файл; именно 21 и был удалён — совпадает с содержимым таблицы
построчно, Architect Review формально сослался на "20 файлов", унаследовав эту неточность из
моего же текста, но по существу одобрил всю таблицу целиком (ROADMAP.md — явно, остальное —
через "методология без замечаний"). Флагирую расхождение явно, а не молчу о нём.

## Итоговая валидация (после `git rm`)

- `git status --short` → ровно 21 файл в статусе `D` (staged deletion), точное совпадение со
  списком таблицы — никакие другие файлы не задеты.
- `grep -rn "17_NEW_CHAT_BOOTSTRAP\|16_CHAT_HANDOVER" . --include="*.md"` (исключая
  `docs/task-bus/queue/` — исторические ARP законно продолжают упоминать старые имена) →
  **0 совпадений**. Соответствует критерию Validation из Step Card.
- Закоммичено (`35c017e`), история не потеряна — доступно через `git log`/`git show` при
  необходимости восстановить содержимое.

## Побочная находка — на будущее, не в этом шаге

Корневой `./MASTER_PROJECT_DOCUMENT.md` (вне `docs/project/`, Forbidden path для этой карточки)
остаётся нетронутым — Architect подтвердил, что рассмотрит отдельной задачей.

## Stop Condition

Выполнено полностью — Шаг 1 (инвентаризация) и Шаг 2 (удаление) оба прошли Architect Review со
`STATUS: OK`. Готово к архивации в `done/`.
