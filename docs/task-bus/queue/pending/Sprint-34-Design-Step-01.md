id: Sprint-34-Design-Step-01
name: "Audit: Desktop layout (1200px+) — структура, spacing, типография"
type: implementation

## Objetivo

Провести полный аудит текущего Desktop UI против целевого состояния (скрин из макета):
- 3-колоночный layout (Sidebar | Editor | Assistant Panel)
- Spacing, padding, gaps
- Типография (заголовки, body text)
- Цвета (zinc palette, dark mode)
- Компоненты (buttons, inputs, dialogs)

## Scope

### Allowed paths:
- apps/studio/src/app/page.tsx (главный layout)
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/components/AssistantPanel.tsx
- apps/studio/src/components/Header.tsx

### Forbidden:
- Переписывать компоненты (только аудит)
- Менять логику

## Validation

1. Скриншоты текущего состояния (desktop 1200px+)
2. Сравнение со скрин-целью (макет)
3. Список найденных gaps (spacing, colors, typography)
4. Список TODO для Step-02-07

## Output

ARP в docs/task-bus/queue/active/:
1. 5+ скриншотов текущего состояния
2. Таблица: Gap | Priority | Fix location
3. Список изменений для Step-02+

## Stop Condition

Готовый audit report перед Step-02.
