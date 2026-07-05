id: Sprint-08-Step-04
name: "UI: responsive-панель замечаний Critic"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- apps/studio/src/ai/**
- apps/studio/src/app/api/**
- apps/studio/src/components/LineEditorPanel.tsx

## Objective

Sprint-08-Step-03 вывел замечания Critic как неоформленный список.
Этот шаг — финальная вёрстка: responsive-панель, которая
переключается снизу/сбоку автоматически по ширине экрана (media
query breakpoint), без ручных настроек и без плавающего окна —
решение согласовано с Product Owner.

Ориентир по раскладке (не менять поведение handleCritic/handleImprove,
только контейнер и стили вывода reviews для режима Critic):

- Узкий экран: список замечаний под текстом сцены (как сейчас,
  просто отформатировать: карточка на каждое замечание с category,
  severity, comment).
- Широкий экран (ориентировочно от ~1024px): список замечаний сбоку
  от текста, текст остаётся на переднем плане.
- Переключение — через CSS (например, flex-direction: column /
  row по media query или existing Tailwind breakpoint вроде lg:),
  не через JS-детекцию ширины окна.

Каждая карточка замечания — category и severity как небольшие
бейджи (можно раскрасить severity: low/medium/high разными
нейтральными оттенками, не кричащими), comment — обычным текстом.

## Rules

- Не трогай handleCritic/handleImprove — только JSX/стили вывода.
- Не добавляй настройки/переключатели — только автоматический
  responsive breakpoint.
- Не трогай Line Editor/Improve вывод (preview Original/Improved) —
  он остаётся как есть, это не в scope.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка в браузере на двух ширинах окна (например, 1400px
  и 600px) — приложи скриншоты или точное описание расположения
  панели на каждой ширине в ARP.
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
