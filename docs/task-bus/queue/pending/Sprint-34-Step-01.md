id: Sprint-34-Step-01
name: "ADR-0016: Story Bible архитектура (Series + Book metadata)"
type: architecture

## Контекст

Sprint 33 завершена (Trash System, Smart Collapse, Sidebar иерархия). Теперь нужна архитектурная основа для Story Bible — структурированное хранилище творческих решений и метаданных на уровне Series и Book.

ADR-0016 определяет:
- Какие поля добавить в Series/Book (decisions, constraints, themes, etc)
- Как иерархия Series → Book (наследование и override)
- Структура экспорта в Markdown (StoryBible.md)

## Objective

1. **Прочитать ADR-0016** (docs/adr/ADR-0016-story-bible-architecture.md)
2. **Согласовать с Product Owner:**
   - Список полей достаточен ли?
   - Иерархия наследования (Series → Book) логична?
   - Экспорт в Markdown структура верна?
3. **Подписать ADR** — если согласованы все стороны

## Validation

1. **Product Owner:** ✅ подтверждает Story Bible соответствует видению
2. **Architect:** ✅ валидирует схему, логику наследования, экспорт
3. **Programmer (Executor):** готов реализовать 6 шагов

## Output

Финализированный ADR-0016 в docs/adr/ с Status: Accepted

## Stop Condition

Не переходить к Step 02 без Product Owner approval и signatures в ADR.
