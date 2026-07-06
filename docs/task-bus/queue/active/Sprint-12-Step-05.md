id: Sprint-12-Step-05
name: "ADR-0008: Co-author Expert Contract + пересмотр ADR-0004 + закрытие Sprint 12"
type: implementation

## Scope

Allowed paths:
- docs/adr/ADR-0008-coauthor-expert-contract.md (новый файл)
- docs/adr/ADR-0004-expert-contract-specification.md (только добавить
  раздел о пересмотре, не переписывать существующее содержимое)
- docs/product/DOMAIN_MODEL.md (обновить Open Questions)
- docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md (только добавить
  раздел о переносе UI-работы (консолидация переключателя, chat) в
  Sprint 13 — см. ниже)
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md

Forbidden paths:
- любой код (apps/studio/**)

## Objective

### ADR-0008-coauthor-expert-contract.md

По методу ADR-0004/0005/0006/0007 (из кода, построчные ссылки).

- Request: POST /api/coauthor { currentText: string, bookContext: Book }
  — currentText может быть пустым (черновик с нуля), bookContext
  обязателен (в отличие от improve_text, где он опционален).
- Response: { ok: true, result: string } | { ok: false, error } —
  та же форма, что Line Editor/Reader.
- Первый по-настоящему генеративный Expert — производит Revision
  (новый/продолженный текст), не Review.
- Контекст: первый Expert, получающий Book целиком (все главы/сцены/
  персонажи/метаданные), не только текущую сцену — по таблице
  контекстов, согласованной с Product Owner (раздел про контексты,
  зафиксированный в этом же ADR или со ссылкой на обсуждение).
- Product Role mapping: Co-author (UI) → Co-author Expert —
  однозначное соответствие, впервые с самого начала проекта (Co-author
  был единственной ролью без реального маппинга, см. DOMAIN_MODEL.md
  Open Questions).
- Review Triggers.

### Пересмотр ADR-0004 (Editor)

Добавить раздел (не переписывать существующее): improve_text/
/api/line-editor теперь принимает опциональный bookContext — Editor
теперь тоже видит книгу целиком, но ЗАДАЧА не изменилась (полировка
текста, контекст используется только для согласованности, явно
ограничено промптом). Ratified as of Sprint 12. Обратная
совместимость сохранена (bookContext опционален).

### DOMAIN_MODEL.md

Обновить Open Questions: Co-author теперь резолвится в Co-author
Expert (ADR-0008). Editor уже был резолвлен в Line Editor
(ADR-0004) — теперь дополнительно отмечен как получающий книжный
контекст. Reader/Critic — без изменений в этом отношении.

### BOOK_LEVEL_ASSISTANTS_VISION.md

Добавить раздел (после текущего последнего): консолидация
переключателя помощников (карточки справа + responsive нижний
список) и сохранение выбранного режима — перенесено в Sprint 13,
вместе с чат-механизмом (не делается отдельно, чтобы не переделывать
одно и то же дважды). Также кратко зафиксировать находки из
браузерного тестирования Sprint 12 (баг с меткой кнопки — уже
исправлен; служебная информация на английском — отложена до
Sprint 14).

### Закрытие Sprint 12

CURRENT_SPRINT.md — все 5 шагов + 1 экстренный фикс [x], статус:
Closed. Честное summary (Co-author — первый генеративный Expert с
полным контекстом книги; Editor расширен тем же контекстом,
пересмотр ADR-0004; найден и исправлен баг метки кнопки). Out of
Scope: консолидация переключателя, персистентность режима, чат-
механизм — все перенесены в Sprint 13.

CURRENT_STEP.md — id: Sprint-12-Step-05, status: done, next: [].

PROJECT_STATE.md — Sprint 12: Closed, ADR-таблица (ADR-0008:
Accepted, ADR-0004: Accepted, revised Sprint 12).

## Rules

- Только документация, никакого кода.
- Метод предыдущих ADR — из кода, не абстрактно.
- Не переписывай существующее содержимое ADR-0004 — только
  добавление раздела о пересмотре.

## Validation

- grep -n "ADR-0008" docs/project/PROJECT_STATE.md
- grep -n "Co-author Expert" docs/adr/ADR-0008-coauthor-expert-contract.md
- grep -n "Sprint 12" docs/adr/ADR-0004-expert-contract-specification.md
- git status --short — только перечисленные в Scope файлы.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
