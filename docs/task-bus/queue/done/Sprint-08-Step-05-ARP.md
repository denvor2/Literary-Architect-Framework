# ARP — Sprint-08-Step-05: ADR-0005 (Critic Expert Contract) + закрытие Sprint 08

## STATUS

OK

## SUMMARY (RU)

Создан `docs/adr/ADR-0005-critic-expert-contract.md` тем же методом, что и ADR-0004: контракт
Critic Expert извлечён из уже реализованного кода (Sprint-08-Step-01..04), каждое утверждение
со ссылкой файл:строка. Зафиксировано: request/response схема `/api/critic` (тот же `{text}`
на входе, но структурированный массив `reviews` на выходе, а не строка — первое расхождение
формы успешного ответа между двумя Expert'ами), позиция в цепочке AI Bus v5 (первое реальное
ветвление по `operation.type`, с явно перенесённым техдолгом — `JSON.stringify(reviews)` в
`AIResponse.text`, не устранённым этим ADR), однозначное соответствие Critic (Product Role) →
Critic Expert. Раздел Known Gaps честно фиксирует нерешённое: отсутствие runtime-валидации
`reviews`, временность `JSON.stringify`-представления, нерешённость Co-author/Editor/Reader.

`docs/product/DOMAIN_MODEL.md`: обновлён только пункт Open Questions про соответствие
Product Role → AI Expert — добавлено «Resolved for Critic (ADR-0005)», формулировка про
Editor/Co-author/Reader сохранена как открытая, не закрыта.

`docs/adr/ADR-0004-expert-contract-specification.md`: добавлена одна датированная аннотация
после шапки метаданных (per the "dated annotation" pattern already established in this
project for ADR clarifications) — что Review Trigger «второй Expert предложен» сработал, со
ссылкой на ADR-0005; текст Decision не тронут.

`CURRENT_SPRINT.md` переписан полностью под закрытие Sprint 08 (все 5 шагов `[x]`, summary,
Out of Scope, Known Open Items — включая честно перенесённое ограничение по браузерной
автоматизации, актуальное для Steps 03–04). `CURRENT_STEP.md` → `Sprint-08-Step-05`/`done`.
`PROJECT_STATE.md`: Current Sprint, Completed Milestones (добавлен Sprint 08), таблица
Accepted ADRs (добавлен ADR-0005), Current Architecture (упомянут Critic Expert и реальная
диспетчеризация AI Bus). Дополнительно, вне буквально перечисленных в Step Card трёх пунктов,
но ради согласованности (по тому же принципу, что уже применялся в предыдущей FIX-задаче
Sprint 07): поправил соседние упоминания «Sprint 08 scope» → «Sprint 09 scope» в Current
Priorities/Open Decisions/Next Milestone — иначе эти секции противоречили бы факту закрытия
Sprint 08 сразу после его добавления в Completed Milestones.

## FILES MODIFIED

- `docs/adr/ADR-0005-critic-expert-contract.md` — новый файл.
- `docs/adr/ADR-0004-expert-contract-specification.md` — одна аннотация добавлена, Decision
  не переписан.
- `docs/product/DOMAIN_MODEL.md` — один пункт Open Questions обновлён (только про Critic).
- `docs/project/CURRENT_SPRINT.md` — переписан под закрытие Sprint 08.
- `docs/project/CURRENT_STEP.md` — обновлён id/status.
- `docs/project/PROJECT_STATE.md` — Current Sprint, Completed Milestones, ADR-таблица,
  Current Architecture, плюс согласованность Sprint 08→09 в трёх соседних секциях.

## VALIDATION

```
$ grep -n "ADR-0005" docs/project/PROJECT_STATE.md
21, 73, 84, 103, 114 — пять упоминаний, все корректны (Completed Milestones,
Current Architecture ×2, ADR-таблица)

$ grep -n "Critic Expert" docs/adr/ADR-0005-critic-expert-contract.md
1: заголовок документа
71: формулировка 1:1-соответствия

$ git status --short
 M .gitignore                                          ← не относится к этой задаче, не трогал
 M docs/adr/ADR-0004-expert-contract-specification.md   ← в Scope (аннотация)
A  docs/ai-bus/queue/active/Sprint-08-Step-05.md         ← перемещённый Step Card
 M docs/product/DOMAIN_MODEL.md                          ← в Scope
 M docs/project/CURRENT_SPRINT.md                        ← в Scope
 M docs/project/CURRENT_STEP.md                          ← в Scope
 M docs/project/PROJECT_STATE.md                          ← в Scope
?? docs/adr/ADR-0005-critic-expert-contract.md            ← в Scope (новый файл)
```
`apps/studio/**` — нет ни одной строки в diff, подтверждено отсутствием этого пути в выводе
`git status`. Только документация, как и требовалось.

## RISKS

- Расширение правок в `PROJECT_STATE.md` за пределы буквально трёх пунктов Step Card (Current
  Sprint / Completed Milestones / ADR-таблица) — на «Current Architecture» и согласованность
  номера спринта в Current Priorities/Open Decisions/Next Milestone. Сделано ради
  предотвращения немедленно устаревших утверждений («Sprint 08 not started» сразу после
  «Sprint 08 closed» в Completed Milestones), а не как самовольное расширение scope — тот же
  принцип уже применялся и был принят в FIX-задаче Sprint-07-Step-02-Close.
- ADR-0004 получил аннотацию (не в Scope дословно — Scope упоминал это как опциональное: «если
  нужно добавить ссылку на ADR-0005, без переписывания содержимого») — добавлена именно
  ссылка, без переписывания Decision/Context/Consequences.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Все изменения — только документация.
Step Card и этот ARP — в `docs/ai-bus/queue/active/Sprint-08-Step-05.md` /
`docs/ai-bus/queue/active/Sprint-08-Step-05-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`. Sprint 09 не начат и не заскоуплен.
