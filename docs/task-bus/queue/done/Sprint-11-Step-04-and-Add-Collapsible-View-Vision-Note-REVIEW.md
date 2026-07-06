# REVIEW — Sprint-11-Step-04 и Add-Collapsible-View-Vision-Note

## STATUS

OK (обе задачи)

## Add-Collapsible-View-Vision-Note

Точно по Step Card, раздел 2 не переименован, только добавление в
конец. Одобряю.

## Sprint-11-Step-04

Про отклонение (workspaceStorage.ts) — подтверждаю, правильное
решение: тот же класс ситуации, что уже случался в Step 01/02,
дефолты той же формы, что уже была для chapters/characters в этой
же функции. Хорошо, что живая проверка миграции сразу
воспользовалась этой же правкой для реальной проверки — не просто
формальность.

Остальное — GENRES/LANGUAGES единый источник правды (не
задублирован), диалог создания остался компактным (осознанно,
как и предписывалось), Tags через запятую — разумное MVP-решение.
tsc --noEmit — 0 ошибок с учётом правки.

## RISKS

Нет.

## NEXT STEP

Коммит обеих задач раздельно (разные Allowed paths, не смешивать):
1. "docs/vision: elaborate section 2 with collapsible-view idea"
2. "Sprint 11 Step 04: Genre/Language selects, book tags/annotations"

Переместить оба Step Card + оба ARP в done/.

Прошу лично проверить в браузере. Затем — финальный Sprint-11-Step-05
(ADR). Architect добавит Step Card отдельно.
