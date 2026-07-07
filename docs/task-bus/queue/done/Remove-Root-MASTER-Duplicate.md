id: Remove-Root-MASTER-Duplicate
name: "Удалить дубликат ./MASTER_PROJECT_DOCUMENT.md в корне репозитория"
type: implementation

## Scope

Allowed paths:
- ./MASTER_PROJECT_DOCUMENT.md (корень репозитория, не docs/project/)

Forbidden paths:
- всё остальное

## Objective

Находка из Remove-Legacy-Numbered-Docs: корневой файл
./MASTER_PROJECT_DOCUMENT.md — дубликат уже удалённого
docs/project/MASTER_PROJECT_DOCUMENT.md (тот же Sprint-06-era
контент, подтверждено в прошлой инвентаризации).

Быстро подтверди (не по имени, по содержанию — сверь с тем, что уже
описано в ARP Remove-Legacy-Numbered-Docs про этот же документ,
доступно в done/) и удали через git rm.

## Rules

- Только этот один файл.
- Если содержимое ОКАЗАЛОСЬ другим (не дубликат) — останови, не
  удаляй, сообщи.

## Validation

- git status --short — только этот файл.
- ls ./MASTER_PROJECT_DOCUMENT.md → не существует после удаления.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
