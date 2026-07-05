# ARP — Add-Vision-Doc

## STATUS

OK

## SUMMARY (RU)

Создан `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` — исходное содержимое из Step Card
(разделы 1–5, "Явно не решено", "Что это НЕ меняет") сохранено дословно, без изменений.

**Применена Поправка 2 из `Sprint-09-Vision-Amendments.md`:** в конец файла, после раздела
"Что это НЕ меняет", добавлены два новых раздела дословно по тексту поправки:

- **Раздел 6 — Локализация.** Фиксирует решение Product Owner: первая версия продукта
  полностью на русском (интерфейс + ответы ИИ), английский — Sprint 30-40. Явно связано с
  уже выполненным Sprint-09-Step-01 (промпт Reader инструктирует отвечать по-русски).
  Явно отмечено: ретроактивный перевод промптов Line Editor/Critic на русский не входит в
  текущий scope.
- **Раздел 7 — Reader как несколько именованных помощников; Critic — тематические
  подкатегории (будущее).** Зафиксировано намерение (не реализовано): Reader — несколько
  параллельных именованных карточек, а не единый экземпляр со сбросом истории; Critic —
  общий (уже есть) + тематические подкатегории по списку ADR-0002 (Continuity Checker, Fact
  Checker, Developmental Editor → «Оценка сюжета», Style Editor → «Оценка стиля» — слово
  «редактор» намеренно исключено из подкатегорий Critic во избежание коллизии с ролью
  Editor). Явно помечено как не входящее в Sprint 09.

Никакое уже существующее содержимое файла не переписано — только добавление в конец, как и
требовали Rules обеих задач (Step Card и поправки).

## FILES MODIFIED

- `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` — новый файл (единственный).

## VALIDATION

```
$ grep -c "Локализация" docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md
1

$ grep -c "тематические подкатегории" docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md
1
```
`git status --short` подтверждает: ровно один новый файл документации (плюс перемещённый в
`active/` Step Card — не относится к содержимому изменений).

## RISKS

Нет — чисто документационная задача, содержимое согласовано заранее (и основной текст, и обе
поправки), код не менялся.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK` (задача помечена как формальность, но
процесс тот же). Изменения: новый `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`. Step Card и
этот ARP — в `docs/ai-bus/queue/active/Add-Vision-Doc.md` /
`docs/ai-bus/queue/active/Add-Vision-Doc-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`. Далее по очереди — `Rename-AIBus-Process-To-TaskBus.md` (+ addendum).
