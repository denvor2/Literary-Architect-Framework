id: Sprint-07-Step-02-Close
name: "Commit Step 02 + Close Sprint 07"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/LineEditorPanel.tsx (уже изменён, только commit)
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md

Forbidden paths:
- всё остальное

## Objective

Sprint-07-Step-02 (LineEditorPanel → AI Bus) получил STATUS: OK от
Architect. Два действия:

### Действие 1 — commit Step 02

```
git add apps/studio/src/components/LineEditorPanel.tsx
git commit -m "Sprint 07 Step 02: route LineEditorPanel through AI Bus, closing the last direct /api/line-editor call"
git push origin main
```

### Действие 2 — закрыть Sprint 07

Обнови три файла:

1. **CURRENT_SPRINT.md** — отметь Step 02 `[x]`, статус спринта:
   Closed. Добавь итоговое summary в стиле закрытия Sprint 06: что
   сделано (терминология Architect/Programmer + git-based queue/
   формализация вне Sprint-нумерации — см. AI Bus v5 note ниже;
   ADR-0004 Expert Contract; устранение AI Bus bypass в
   LineEditorPanel), что не входило в scope (второй Expert,
   PostgreSQL/Prisma, авторизация, изменения /api/line-editor или
   UI-поведения).

   Примечание для формулировки: Step 00 исторически называется
   "Sprint-07-Step-00", менять этот факт не нужно (коммит уже есть),
   но зафиксируй в summary одну фразу, что процессные изменения
   AI Bus впредь трекаются в docs/ai-bus/ вне Sprint-нумерации, а не
   как прецедент на будущее.

2. **CURRENT_STEP.md** — id: Sprint-07-Step-02, status: done,
   next: [] (Sprint 08 ещё не начат, шаги не определены).

3. **PROJECT_STATE.md** — обнови "Current Sprint" (Sprint 07:
   Closed), добавь Step 02 в Completed Milestones, убери из Known
   Risks пункт про LineEditorPanel bypass (он больше не актуален,
   так как только что устранён).

Коммит:
```
git add docs/project/CURRENT_SPRINT.md docs/project/CURRENT_STEP.md docs/project/PROJECT_STATE.md
git commit -m "Sprint 07: close sprint, sync project state"
git push origin main
```

## Validation

- npm run build / npm run lint (apps/studio) — код не менялся в
  Действии 2, но подтверди, что Действие 1 (уже провалидированное
  предыдущим ARP) закоммитилось без конфликтов.
- git log -2 --format="%H %s" — приложи оба хэша.
- git status --short — должно быть пусто.

## Output

ARP как файл: docs/ai-bus/queue/active/Sprint-07-Step-02-Close-ARP.md
(см. STANDING-PROMPT.md) + вывод в чат как обычно.

## Stop Condition

Оба коммита можно делать сразу (это не архитектурное решение, а
исполнение уже одобренного STATUS: OK + механическая синхронизация
документов состояния) — но обязательно пришли ARP на ревью после.
