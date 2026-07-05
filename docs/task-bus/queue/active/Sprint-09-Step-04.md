id: Sprint-09-Step-04
name: "ADR-0006: ратификация контракта Reader Expert + закрытие Sprint 09"
type: implementation

## Scope

Allowed paths:
- docs/adr/ADR-0006-reader-expert-contract.md (новый файл)
- docs/product/DOMAIN_MODEL.md (обновить Open Questions)
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md

Forbidden paths:
- любой код (apps/studio/**)

## Objective

По методу ADR-0004/ADR-0005 (из уже реализованного кода, построчные
ссылки, не абстрактное проектирование).

### ADR-0006-reader-expert-contract.md

Из кода Sprint-09-Step-01..03:

- Request: POST /api/reader { text: string } — произвольный
  фрагмент, та же гранулярность, что у Critic.
- Response: { ok: true, result: string } | { ok: false, error: string }
  — та же форма, что Line Editor, НЕ структура reviews[] как у
  Critic. Явно укажи: осознанное решение, реакция читателя — цельный
  текст, не список пунктов.
- Model/prompt: claude-sonnet-5, захардкожен. Явно инструктирует
  отвечать на русском (первый Expert с явной языковой инструкцией —
  Line Editor/Critic пока без неё, ретроактивный перевод их промптов
  отдельно запланирован на Sprint 14).
- AI Bus: третий вариант AIOperation.type "reader_reaction" — первый
  случай, когда третий вариант добавляется без техдолга (в отличие
  от critic_review, где потребовался JSON.stringify/TODO) — форма
  ответа уже совместима с AIResponse.text напрямую.
- Product Role mapping: Reader (UI) → Reader Expert — второе
  однозначное соответствие 1:1 (после Critic). Editor/Co-author
  по-прежнему используют Line Editor под разными ярлыками — НЕ
  меняется этим ADR, зафиксируй как остающийся open point.
- Review Triggers: по аналогии с ADR-0004/0005.

### DOMAIN_MODEL.md — Open Questions

Обнови «Which specific AI Expert(s) does each Product Role use?» —
Reader теперь резолвится в Reader Expert (ADR-0006). Editor/Co-author
остаются открытыми, не закрывай их.

### Закрытие Sprint 09

CURRENT_SPRINT.md — все 4 шага [x], статус: Closed. Явно укажи, что
НЕ входило в scope: Co-author/Editor как настоящие Expert'ы,
множественные именованные Reader (3-4, из vision-документа),
локализация промптов Line Editor/Critic (Sprint 14).

CURRENT_STEP.md — id: Sprint-09-Step-04, status: done, next: [].

PROJECT_STATE.md — Sprint 09: Closed, ADR-таблица (ADR-0006: Accepted).

## Rules

- Только документация, никакого кода.
- Метод ADR-0004/0005 — из кода, не абстрактно.

## Validation

- grep -n "ADR-0006" docs/project/PROJECT_STATE.md
- grep -n "Reader Expert" docs/adr/ADR-0006-reader-expert-contract.md
- git status --short — только перечисленные в Scope файлы.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
