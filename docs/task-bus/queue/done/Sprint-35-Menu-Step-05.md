id: Sprint-35-Menu-Step-05
name: "Global keyboard shortcuts: Ctrl+K (search), Ctrl+Z/Y (undo/redo), Escape (close)"
type: implementation

## Objective

Реализовать глобальные keyboard shortcuts:

```
Ctrl+K       → Фокус на Search в Header
Ctrl+Plus    → Увеличить шрифт (17px → 18px)
Ctrl+Minus   → Уменьшить шрифт (17px → 16px)
Ctrl+Z       → Undo (если доступно)
Ctrl+Y       → Redo (если доступно)
Ctrl+X/C/V   → Cut/Copy/Paste (браузерные)
Ctrl+A       → Select all в editor
Escape       → Закрыть меню/диалог
```

## Scope

### Allowed paths:
- apps/studio/src/app/page.tsx (useEffect + keydown listener)
- apps/studio/src/components/Header.tsx (search input ref)

### Forbidden:
- Новые компоненты
- Менять существующий focus handling

## Implementation

**page.tsx:**
```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case '=':
        case '+':
          e.preventDefault();
          // Increase font size
          setFontSize(prev => Math.min(prev + 1, 24));
          break;
        case '-':
        case '_':
          e.preventDefault();
          // Decrease font size
          setFontSize(prev => Math.max(prev - 1, 12));
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            workspaceController.redo();
          } else {
            workspaceController.undo();
          }
          break;
        case 'y':
          e.preventDefault();
          workspaceController.redo();
          break;
      }
    }
    
    if (e.key === 'Escape') {
      closeAllMenus();
    }
  }
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [fontSize]);
```

## Validation

1. Ctrl+K → Search фокусируется
2. Ctrl++ → Font size увеличивается (не выше 24px)
3. Ctrl+- → Font size уменьшается (не ниже 12px)
4. Ctrl+Z → Undo вызывается (если impl)
5. Ctrl+Y → Redo вызывается (если impl)
6. Escape → Меню/диалоги закрываются
7. Не interfere с браузерными shortcuts

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншоты keyboard interactions
2. Видео: Ctrl+K, Ctrl+Z, Escape
3. Результат build

## Stop Condition

Все shortcuts работают (undo/redo skip if not impl).
