id: Sprint-35-Menu-Step-04
name: "Help & About: Dialogs, Keyboard shortcuts, Version info"
type: implementation

## Objective

Реализовать **Help** меню + **About** диалог:

```
📚 Руководство
├── 📖 Как написать книгу          → GuideDialog или external link
└── 💻 Как работать в Studio       → GuideDialog или external link

ℹ️ О сайте
├── Версия: v1.0
├── Поддержка: support@example.com
├── Ваш ключ: [API key display]
└── Тариф: [current plan/subscription]
```

## Dialogs

### Help Links
- "Как написать книгу" → modal с гайдом (или external link)
- "Как работать в Studio" → modal с гайдом (или external link)

### About Dialog
```
┌──────────────────────────────────┐
│ ℹ️ О сайте                       │
├──────────────────────────────────┤
│ Literary Studio v1.0              │
│ © 2026 Denis Vorobyev            │
│                                  │
│ Поддержка: support@example.com   │
│ [открыть email]                  │
│                                  │
│ Ваш ключ:                        │
│ [sk-1234567890abcdef...]         │
│ [скопировать]                    │
│                                  │
│ Текущий тариф: Professional      │
│ Действует до: 2026-12-31         │
│ [Управлять подпиской]            │
└──────────────────────────────────┘
```

## Scope

### Allowed paths:
- apps/studio/src/components/Header.tsx (Help/About menu)
- Новые компоненты:
  - apps/studio/src/components/GuideDialog.tsx (Help guides)
  - apps/studio/src/components/AboutDialog.tsx
- apps/studio/src/app/page.tsx (state)

### Forbidden:
- API changes
- Менять backend данные

## Implementation

**Help Guides:**
- "Как написать книгу" → modal с текстом (placeholder или link)
- "Как работать в Studio" → modal с текстом (placeholder или link)
- Может быть embedded text или external link

**About Dialog:**
- Версия: hardcoded "v1.0"
- Поддержка: email link (support@example.com)
- Ваш ключ: display from auth context (API key или token)
  - [скопировать] button → copy to clipboard
- Тариф: display from subscription context
  - Название плана (Free/Pro/Enterprise)
  - Дата истечения
  - [Управлять] button → link to billing (if available)
- Modal: Close on Escape

## Validation

1. Help меню открывается (Руководство)
2. "Как написать книгу" → GuideDialog/link открывается
3. "Как работать в Studio" → GuideDialog/link открывается
4. About меню открывается (О сайте)
5. About dialog показывает:
   - Версия v1.0
   - Email поддержки (clickable)
   - API ключ (с кнопкой скопировать)
   - Тариф (название + дата)
6. Escape закрывает диалоги
7. Клик вне диалога закрывает его

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншот Help меню
2. Скриншоты Help dialogs (обе guide)
3. Скриншот About меню
4. Скриншот About dialog (все поля)
5. Результат build

## Stop Condition

Help & About dialogs работают, меню готово.
