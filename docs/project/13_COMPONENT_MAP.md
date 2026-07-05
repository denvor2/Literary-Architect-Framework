# 13_COMPONENT_MAP

## Назначение

Документ описывает все основные компоненты Literary Studio и их ответственность.

## Структура

### page.tsx
Корневой orchestrator. Не содержит бизнес-логики.

### useWorkspaceController
Единственная точка управления Workspace.

### Header
Верхняя панель приложения.

### Sidebar
Навигация по книге, главам и сценам.

### EditorArea
Редактирование сцены и взаимодействие с AI Bus.

### AssistantPanel
Панель литературных помощников.

### NewBookDialog
Создание новой книги.

### DeveloperTools
Инструменты разработчика.

## Сервисные модули

- domain/model.ts
- domain/workspace.ts
- storage/workspaceStorage.ts
- ai/operations.ts
- ai/context.ts
- ai/response.ts
- ai/applier.ts
- ai/aiBus.ts

## Правила

- UI не хранит бизнес-логику.
- Workspace изменяется только через Controller.
- AI вызывается только через AI Bus.
- localStorage используется только через workspaceStorage.
