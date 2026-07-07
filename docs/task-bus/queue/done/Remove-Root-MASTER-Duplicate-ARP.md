id: Remove-Root-MASTER-Duplicate-ARP
name: "ARP: удалён дубликат ./MASTER_PROJECT_DOCUMENT.md в корне репозитория"
type: arp

## Что сделано

Подтверждено содержательное сравнение (не по имени): `diff` корневого `./MASTER_PROJECT_DOCUMENT.md`
против содержимого уже удалённого `docs/project/MASTER_PROJECT_DOCUMENT.md` (взято из коммита
`35c017e^`, до его удаления) — **побайтово идентичны**, пустой diff. Оба файла происходят из
одного и того же исходного коммита `2aa68f1` ("docs: synchronize project state after Sprint 06"),
задевавшего оба пути одновременно — подтверждает, что это не совпадение, а дубликат с самого
начала.

Дополнительно проверено (как в прошлой инвентаризации): нет входящих ссылок на корневой файл ни
из одного живого документа — только самоссылка внутри самого файла.

`git rm MASTER_PROJECT_DOCUMENT.md` выполнен.

## Соответствие Scope

Единственный изменённый путь — `./MASTER_PROJECT_DOCUMENT.md` (корень репозитория, не
`docs/project/`). Ничего больше не тронуто.

## Validation

- `git status --short` → только `D  MASTER_PROJECT_DOCUMENT.md`.
- `ls ./MASTER_PROJECT_DOCUMENT.md` → не существует (после коммита; сейчас staged deletion,
  рабочее дерево уже не содержит файл).

## Отклонения от Step Card

Нет.

## Stop Condition

Не закоммичено — жду `STATUS: OK` от Architect.
