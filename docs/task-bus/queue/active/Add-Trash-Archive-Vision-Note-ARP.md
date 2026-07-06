# ARP — Add-Trash-Archive-Vision-Note

**Задача:** Дополнение к vision-документу: Корзина и Архив (идея, не спроектировано)
**Статус выполнения:** Готово к ревью

## Что сделано

В `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` добавлен раздел "## 9. Корзина и Архив (идея,
не спроектировано)" дословно по Step Card, сразу после раздела 8 (Серия книг, из
Add-Series-Vision-Note — обработана этим же прогоном непосредственно перед этой задачей, поэтому
нумерация 8→9 естественная, без коллизий). Ничего существующего не менялось.

## Валидация

```
grep -c "Корзина и Архив" docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md → 1
git status --short → единственный изменённый файл — docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md
                       (несёт правки и от Add-Series-Vision-Note, и от этой задачи — тот же
                       файл, оба Step Card это явно предполагали)
```

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
