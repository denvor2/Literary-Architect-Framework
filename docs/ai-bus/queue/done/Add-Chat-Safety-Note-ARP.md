# ARP — Add-Chat-Safety-Note

## STATUS

OK

## SUMMARY (RU)

Добавлен один новый раздел в `docs/ai-bus/STANDING-PROMPT.md`, дословно по тексту из Step
Card, без изменения остального содержимого файла. Раздел описывает практику: полная
конфигурация с примерами запрещённых операций живёт только в файле (ARP/коммит), а в самом
чат-сообщении такие вещи описываются словами, а не приводятся построчно и многократно — по
причине, изложенной в самом Step Card (техническое ограничение интерфейса чата, не мера
безопасности против реального риска).

## FILES MODIFIED

- `docs/ai-bus/STANDING-PROMPT.md` — один новый раздел добавлен, остальное не тронуто.

## VALIDATION

```
$ grep -c "Избегать блокировки" docs/ai-bus/STANDING-PROMPT.md
1
```
`git status --short` подтверждает: изменён только этот файл.

## RISKS

Нет.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменён только `STANDING-PROMPT.md`.
Step Card и этот ARP — в `docs/ai-bus/queue/active/Add-Chat-Safety-Note.md` /
`docs/ai-bus/queue/active/Add-Chat-Safety-Note-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`.
