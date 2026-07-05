id: Sprint-08-Step-05
name: "ADR-0005: ратификация контракта Critic Expert + закрытие Sprint 08"
type: implementation

## Scope

Allowed paths:
- docs/adr/ADR-0005-critic-expert-contract.md (новый файл)
- docs/product/DOMAIN_MODEL.md (обновить Open Questions)
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md
- docs/adr/ADR-0004-expert-contract-specification.md (если нужно добавить
  ссылку на ADR-0005, без переписывания содержимого)

Forbidden paths:
- любой код (apps/studio/**)

## Objective

По тому же методу, что ADR-0004 (контракт ратифицируется из уже
реализованного кода, построчные ссылки на файлы, а не абстрактное
проектирование) — задокументировать контракт Critic Expert.

### ADR-0005-critic-expert-contract.md

Структура как у ADR-0004: Context, Decision, Consequences, Review
Triggers. Зафиксировать из кода (Sprint-08-Step-01..04):

- Request: POST /api/critic { text: string } — произвольный фрагмент
  текста, не обязательно целая Scene (отличие от Line Editor —
  явно укажи это как первый пример второй гранулярности ввода).
- Response: { ok: true, reviews: [{ category, severity, comment }] }
  | { ok: false, error: string }, HTTP 400/500 — те же коды и паттерн
  ошибок, что у Line Editor (ADR-0004), но другая форма успешного
  ответа (массив структурированных находок вместо строки текста).
- Model/prompt: claude-sonnet-5, захардкожен, не параметризуется —
  тот же принцип, что у Line Editor.
- AI Bus: AIOperation.type "critic_review" — второй вариант union,
  первый реальный прецедент ветвления по operation.type (см.
  aiBus.ts, Sprint-08-Step-02). Зафиксируй известный техдолг:
  AIResponse.text временно хранит JSON.stringify(reviews) — TODO
  в коде, не устранено в этом ADR (это факт о текущем состоянии,
  не решение, которое нужно принимать сейчас).
- Product Role mapping: Critic (UI) → Critic Expert — впервые
  однозначное соответствие 1:1 без двусмысленности (в отличие от
  Editor/Co-author/Reader, которые всё ещё используют Line Editor
  под разными ярлыками — это НЕ меняется этим ADR, зафиксируй как
  оставшийся open point, не решай его здесь).
- Review Triggers: по аналогии с ADR-0004 — что должно вызвать
  пересмотр этого ADR (например, если reviews обретёт runtime-
  валидацию схемы, если AIResponse перестанет быть строкой).

### DOMAIN_MODEL.md — Open Questions

Обнови пункт «Which specific AI Expert(s) does each Product Role
use?» — Critic теперь однозначно резолвится в Critic Expert (сошлись
на ADR-0005). Editor/Co-author/Reader — по-прежнему открытый вопрос,
не закрывай его целиком, только частично для Critic.

### Закрытие Sprint 08

CURRENT_SPRINT.md — все 5 шагов [x], статус: Closed, итоговое summary
(второй Expert, критик, впервые реальное ветвление AI Bus по
operation.type, DOMAIN_MODEL резолюция для Critic). Явно укажи, что
НЕ входило в scope: Co-author/Reader как отдельные Expert'ы,
типизация AIResponse под ReviewResult (остаётся техдолгом),
Sprint 09 не начат.

CURRENT_STEP.md — id: Sprint-08-Step-05, status: done, next: [].

PROJECT_STATE.md — Current Sprint (Sprint 08: Closed), добавить
Completed Milestones, обновить ADR-таблицу (ADR-0005: Accepted).

## Rules

- Только документация, никакого кода.
- Метод ADR-0004 (из кода, построчные ссылки) — не абстрактное
  проектирование задним числом.
- Не закрывай Editor/Co-author/Reader open question — только Critic.

## Validation

- grep -n "ADR-0005" docs/project/PROJECT_STATE.md
- grep -n "Critic Expert" docs/adr/ADR-0005-critic-expert-contract.md
- git status --short — только перечисленные в Scope файлы.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
