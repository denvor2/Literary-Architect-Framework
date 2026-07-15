id: Sprint-34-Step-01-ARP
status: ready_for_review
type: architecture
date: 2026-07-15

# ADR-0016 Review: Story Bible Architecture (Series + Book Metadata)

## Summary

ADR-0016-story-bible-architecture.md разработана и готова к финализации. Архитектура определяет структуру Story Bible — слой метаданных и творческих решений для Series и Book.

## Architecture Overview

### Data Model

**Series-level Story Bible:**
- `targetAudience`, `genre[]`, `estimatedTotalWordCount`
- `decisions`, `throughlineElements[]` (сквозные элементы серии)
- `seriesConstraints[]` (что НЕ делать в серии)
- `status` (outline/in-progress/complete/published)

**Book-level Story Bible:**
- Same pattern + inherited from Series if omitted
- `mainPlotlines[]`, `principle`, `escalation`, `themes[]`
- `bookConstraints[]` (что НЕ делать в этой книге)
- `status` (outline/draft/editing/beta/published)

### Key Decisions

✅ **Inline fields vs JSON blob:** Выбрали inline fields для type safety и queryability
✅ **Inheritance pattern:** Book наследует от Series если поле не установлено
✅ **Export format:** Markdown (StoryBible.md) для версионирования и integration
✅ **UI structure:** 4 tabs в Gear dialog (Basic, Story Bible, Constraints, Metadata)

## Rationale

1. **Structured metadata** — критическая информация не теряется в заметках
2. **Series vs Book hierarchy** — соответствует авторской ментальной модели
3. **Constraints** — мощный, недоиспользуемый элемент для консистентности
4. **Markdown export** — offline work, Git integration, external tools
5. **Optional fields** — backward compatible, existing data не затронута

## Consequences

**Positive:**
- Авторы документируют решения один раз (Series) и переиспользуют
- Markdown export открывает Git/external tool интеграцию
- Ясное разделение Series vs Book metadata
- Constraints становятся actionable documentation

**Negative:**
- +16 fields в Series и Book models (migration required)
- UI более сложная (4 tabs)
- Нужна логика наследования в UI

**Neutral:**
- Existing books/series без Story Bible остаются функциональны
- Все поля optional — нет breaking changes

## Validation Checklist

✅ **Schema design** — type safe, queryable, simple
✅ **Inheritance logic** — clear, implements "inherit if omitted"
✅ **Export logic** — Markdown template готова
✅ **UI structure** — 4 tabs, manageable complexity
✅ **Backward compatibility** — existing data safe
✅ **User research alignment** — соответствует "Как писать в Literary Studio"

## Implementation Ready

Следующие 5 Step Cards готовы к выполнению:
- Step 02: Prisma schema (migration)
- Step 03: Domain Model + Repository
- Step 04: API endpoints
- Step 05: UI (Gear dialog)
- Step 06: Export (Story Bible.md)

## Stop Condition

ADR-0016 требует approval от:
- [ ] **Product Owner:** Confirms Story Bible structure matches user expectations
- [ ] **Architect:** Validates schema, export logic, UI hierarchy
- [ ] **Programmer:** Ready to implement all 6 steps

## Recommendation

**STATUS: Ready to accept**

ADR архитектура solid, опирается на existing patterns (ADR-0012, ADR-0014), backward compatible. Recommend to move forward with implementation.

---

**Next Step:** After Product Owner approval → Mark ADR as "Accepted" → Proceed to Step 02
