id: Sprint-34-Design-Step-03
name: "Tablet layout (768-1024px): Sidebar collapse, Editor responsive"
type: implementation

## Objective

Tablet-оптимизированный layout:
- Sidebar: может collapse в hamburger
- Editor: responsive text sizing
- Assistant Panel: может stack or sidebar

Breakpoint: 768px-1024px

## Scope

### Allowed paths:
- apps/studio/src/app/page.tsx (@media queries, state)
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/globals.css

## Validation

1. iPad landscape (1024px) — скриншот
2. iPad portrait (768px) — скриншот
3. Hamburger menu работает (toggle collapse)
4. Editor текст читаемый
5. Assistant Panel accessible (не скрыта)
6. Темная тема работает на обоих размерах

## Output

ARP в docs/task-bus/queue/active/:
1. 4+ скриншота (landscape, portrait, light, dark)
2. Результат build

## Stop Condition

Tablet выглядит OK на 768px и 1024px.
