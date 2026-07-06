id: Sprint-10-Close
name: "Закрытие Sprint 10 (Персонажи + парность Chapter/Scene)"
type: implementation

## Scope

Allowed paths:
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md

Forbidden paths:
- любой код (apps/studio/**)
- docs/adr/** (ADR не нужен — это CRUD-расширение домен-модели без
  AI Expert'а, не Expert Contract; ADR-0004/0005/0006 остаются
  единственными)

## Objective

Sprint 10 не потребовал ADR (в отличие от Sprint 08/09) — это было
чистое расширение домен-модели (Character, Chapter.subtitle) и UI,
без нового AI Expert'а или изменения AI Bus. Закрытие — только
обновление живых project-документов.

### CURRENT_SPRINT.md

Статус: Closed. Итоговое summary, покрывающее весь фактический объём
(значительно больше исходно запланированных 2 шагов — перечисли
честно, по реальным коммитам, не только по номерам Step):

- Character — новая сущность (id, name, description, notes, photoUrl),
  собственная панель редактирования, автовыделение при создании,
  автофокус на имени
- Chapter — поле subtitle, панель редактирования (title/subtitle),
  автовыделение при создании
- Scene — редактируемое название (отдельно от текста), автовыделение
  при создании (включая создание не в текущей выбранной главе),
  Enter-переход от названия к тексту
- Навигация: возврат к обзору книги из Sidebar, кнопки создания
  (Book/Chapter/Scene/Character) в едином месте и стиле
- UI Style Guide (docs/design/UI_STYLE_GUIDE.md) — новое соглашение,
  применённое ретроактивно к существующим кнопкам
- Два бага, устранённых по ходу: подсветка сцен с коллизией id между
  главами; controlled/uncontrolled warning на старых данных без
  subtitle
- Suppress-Extension-Hydration-Warning — не по теме спринта, но
  выполнено в это же окно

Явно укажи, что НЕ входило в scope: мультикнижность (обнаружена как
отдельная, более крупная проблема — см. ниже), помощники на форме
персонажа/главы, Корзина/Архив — все зафиксированы в
docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md, не в этом Sprint.

### CURRENT_STEP.md

id: Sprint-10-Close, status: done, next: [].

### PROJECT_STATE.md

Current Sprint → Sprint 10: Closed. Domain Model раздел (если там
перечислены сущности) — добавить Character, обновить Chapter (+
subtitle). НЕ трогай ADR-таблицу — ADR-0006 остаётся последним,
никакой новый ADR не добавлялся в этом спринте (явно так и укажи в
комментарии рядом, чтобы не выглядело забытым пропуском при будущем
чтении).

Добавь также в Current Sprint или отдельным примечанием: следующий
Sprint 11 — мультикнижность, поднята из-за обнаруженного риска потери
данных (создание новой книги полностью замещает предыдущую) —
приоритизирована Product Owner выше ранее запланированного Co-author.

## Rules

- Только документация.
- Не создавай ADR — обоснование выше.

## Validation

- grep -n "Sprint 10" docs/project/PROJECT_STATE.md → статус Closed
- git status --short — только 3 файла.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
