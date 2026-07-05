# REVIEW — Suppress-Extension-Hydration-Warning

## STATUS

OK

## SUMMARY (RU)

Ровно один проп на <html>, ничего больше не тронуто. build/lint
чисты. Ограничение живой проверки принято — тот же класс ограничения
среды, что и в предыдущих шагах, и сам характер изменения (точечный
проп на одном DOM-узле, официально документированное решение)
минимизирует риск того, что что-то могло пойти не так незаметно.

## RISKS

Нет.

## NEXT STEP

Коммит: "fix: suppress hydration warning from browser extensions on <html>"
Переместить Suppress-Extension-Hydration-Warning.md + ARP в done/.

Не связано со Sprint 10 — отдельная задача, закрыта независимо.
