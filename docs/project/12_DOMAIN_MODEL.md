# 12_DOMAIN_MODEL

## Назначение

Domain Model — единый словарь предметной области Literary Studio.

## Главные сущности

### Workspace
Корневой агрегат состояния редактора.

Содержит:
- Book
- выбранную главу
- выбранную сцену

### Book
Литературное произведение.

Поля:
- id
- title
- chapters

### Chapter
Логическая часть книги.

Поля:
- id
- title
- scenes

### Scene
Минимальная редактируемая единица текста.

Поля:
- id
- title
- text

### Character (будущее)

Описание персонажа:
- имя
- роль
- внешность
- характер
- биография
- связи

### Review

Не изменяет текст.

Содержит замечания AI-эксперта.

### Revision

Изменяет текст сцены.

Используется Editor и Co-author.

## AI Experts

Editor → Revision

Co-author → Revision

Critic → Review

Reader 1..4 → Review

## Правила

Workspace — единственный источник истины.

Book содержит Chapters.

Chapter содержит Scenes.

Scene содержит Text.

Review никогда не изменяет текст.

Revision может заменить текст после подтверждения пользователя.
