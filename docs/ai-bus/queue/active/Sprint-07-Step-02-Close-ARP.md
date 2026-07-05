# ARP — Sprint-07-Step-02-Close (FIX round)

## STATUS

OK

## SUMMARY

Architect выпустил FIX по итоговому коммиту закрытия Sprint 07 (`15dc5a1`): в
`docs/project/PROJECT_STATE.md` оставались устаревшие утверждения — Expert Contract как
`Proposed`/неутверждённый (уже ратифицирован ADR-0004), `LineEditorPanel.tsx` как обходящий AI
Bus (устранено в Step 02), и несколько мест, буквально противоречащих факту закрытия Sprint 07
("Sprint 07 has not been started..."). Прошёлся по всему файлу целиком (не только по
указанным в FIX номерам строк, так как они сместились после предыдущего коммита), исправил:

1. `Last updated` / `Project Health` (шапка файла) — дата "(Sprint 07 closing)"; Sprint 05–07
   все "complete and committed".
2. `Current Architecture` — утверждение "Expert Contract... not yet ratified" заменено на
   явную ссылку на ратифицированный ADR-0004 (supersedes ADR-0002).
3. `Current Architecture` — удалён пункт про `LineEditorPanel.tsx`, обходящий AI Bus (факт
   больше не верен после Step 02).
4. `Current Priorities` — удалён пункт «Formalize the Expert Contract... still pending»;
   список перенумерован.
5. `Open Decisions` — удалён пункт «Expert Contract ratification... needs to be written up».
6. `Known Risks` — удалён пункт «ADR-0002 remains intentionally unratified».
7. **Дополнительно, вне явно перечисленных в FIX номеров** (обнаружено при полном
   прохождении файла, как и было прямо запрошено): `Next Milestone` — текст «Sprint 06 is
   closed; Sprint 07 has not been started» прямо противоречил факту закрытия Sprint 07;
   заменено на «Sprint 07 is closed; Sprint 08 has not been started». Соответствующие
   пункты в `Current Priorities`/`Open Decisions` про "Decide Sprint 07 scope" также
   обновлены на "Sprint 08 scope" — той же природы устаревание (номер спринта), это
   правки внутри уже редактируемых пунктов ради согласованности, а не независимое
   расширение scope.

**Не тронуто сознательно:** в `Open Decisions` осталась формулировка "Chief Software
Architect" (не "Architect") — это добавочный, отдельный вид устаревания (терминология
Sprint 07 Step 00), не относящийся к ADR-0002/LineEditorPanel/статусу спринта, который
явно очерчивал scope этого FIX. Не стал самовольно расширять исправление на терминологию,
раз задача явно называла конкретные темы для правки.

## FILES MODIFIED

- `docs/project/PROJECT_STATE.md` — единственный изменённый файл. Только текстовые правки,
  код не менялся.

## VALIDATION

```
$ grep -n "ADR-0002" docs/project/PROJECT_STATE.md
62:  superseded [ADR-0002](../adr/ADR-0002-expert-contract-vision.md). Committed
77:  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
95:| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Superseded by ADR-0004 |
```
Все три упоминания — исторический/справочный контекст ("superseded", "supersedes",
таблица со статусом "Superseded by ADR-0004"), ни одно не описывает ADR-0002 как
действующий контракт.

```
$ grep -n "LineEditorPanel" docs/project/PROJECT_STATE.md
65:  (`LineEditorPanel.tsx`), routing it through `aiBus.execute()` instead — no UI-visible change.
```
Единственное упоминание — внутри описания уже выполненного Step 02 ("routing it through
aiBus.execute() instead"), не как существующая проблема.

```
$ grep -n -i "proposed\|unratified" docs/project/PROJECT_STATE.md
(пусто)
```

```
$ grep -n "Sprint 07" docs/project/PROJECT_STATE.md
7:**Last updated:** 2026-07-05 (Sprint 07 closing)
8:**Project Health:** Healthy — on track. Sprint 05, Sprint 06, and Sprint 07 are all complete
20:Sprint 07 — Architecture Ratification & AI Bus Formalization (closed). All three steps
53:- **Sprint 07** — architecture ratification and cleanup, no user-visible behavior change.
136:None defined. Sprint 07 is closed; Sprint 08 has not been started and has no scope in this
```
Все пять — согласованно описывают Sprint 07 как закрытый.

`git status --short` (после коммита `b08b555`) — пусто относительно `PROJECT_STATE.md`;
никакой другой файл этим коммитом не тронут.

## RISKS

- `Open Decisions` по-прежнему использует формулировку "Chief Software Architect" вместо
  установленного в Sprint 07 Step 00 термина "Architect" — сознательно не исправлено (вне
  заявленного scope этого FIX), но фиксирую как известную, отдельную мелкую несогласованность.
- `Current Architecture`'s пункт "**Post-Sprint-06 layering:**" сохраняет историческое
  название по спринту происхождения — фактически всё ещё корректно (архитектура введена в
  Sprint 06 и не изменилась), не тронуто, так как не входит в перечисленные темы FIX.

## SYSTEM STATE

Закоммичено и запушено: `b08b555` — "Sprint 07: fix stale ADR-0002/LineEditorPanel
references in PROJECT_STATE.md". `git status --short` относительно кода/PROJECT_STATE.md
пусто.

Отдельно от этого коммита (по инструкции — не смешивать с ним): Step Card перемещён
`pending/ → active/` (`docs/ai-bus/queue/active/Sprint-07-Step-02-Close.md`), этот ARP-файл
добавлен рядом в `active/`. Эти два файла ещё не закоммичены — оформляю отдельным,
самостоятельным коммитом (queue-бухгалтерия, не относится к содержанию исправления
`PROJECT_STATE.md`), чтобы не нарушить явную инструкцию "не коммить что-либо ещё сверх
[PROJECT_STATE.md]" применительно к коммиту самого исправления.

`docs/ai-bus/queue/pending/STANDING-PROMPT.md` остаётся на месте, не трогал — это
постоянный процедурный документ ("читать в начале каждой сессии"), а не Step Card для
перемещения через pending/active/done; возможно, ему стоит быть не в `pending/`, а прямо в
`docs/ai-bus/`, но это не моё решение — оставляю как наблюдение для Architect.

## NEXT STEP

Жду `REVIEW.md` в `docs/ai-bus/queue/active/` (см. Programmer Response to Review,
`docs/ai-bus/queue/README.md`). Sprint 08 не начат и не заскоуплен.
