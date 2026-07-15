id: Sprint-34-Design-Step-05
name: "Dark mode polish: colors, contrast, readability"
type: implementation

## Objective

Dark mode должна выглядеть как целое, не как инвертированный light mode:
- Контраст текста ✅ (читаемо на всех экранах)
- Цвета (zinc scale, не slashed)
- Акцент (blue) work на обоих режимах
- Input fields, buttons, borders видны четко

## Scope

### Allowed paths:
- apps/studio/globals.css (@media prefers-color-scheme: dark)
- apps/studio/src/components/* (если нужна коррекция)

### Forbidden:
- Новые цвета (только zinc + blue + семантические)

## Validation

1. Dark mode desktop — скриншот
2. Dark mode tablet — скриншот
3. Dark mode mobile — скриншот
4. WCAG AA contrast (4.5:1 для text)
5. Все компоненты видны (buttons, inputs, badges)
6. Accent color (blue) не мешает

## Output

ARP в docs/task-bus/queue/active/:
1. 9+ скриншотов (desktop/tablet/mobile × light/dark + hybrid)
2. Contrast checker results (если есть инструмент)

## Stop Condition

Dark mode выглядит как light mode, но в темных тонах (качественная инверсия).
