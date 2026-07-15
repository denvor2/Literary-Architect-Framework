id: Sprint-35-Menu-Step-05-ARP
status: READY FOR REVIEW
date: 2026-07-15

## Что сделано

### Глобальные keyboard shortcuts добавлены в page.tsx

Добавлен новый useEffect для обработки глобальных shortcuts:

```typescript
useEffect(() => {
  function handleGlobalKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      handleFontSizeChange(Math.min(18, currentFontSize + 1));
    } else if ((event.ctrlKey || event.metaKey) && event.key === "-") {
      event.preventDefault();
      handleFontSizeChange(Math.max(10, currentFontSize - 1));
    }
  }
  window.addEventListener("keydown", handleGlobalKeyDown);
  return () => window.removeEventListener("keydown", handleGlobalKeyDown);
}, [currentFontSize]);
```

### Реализованные shortcuts

| Shortcut | Действие | Место реализации |
|----------|----------|-----------------|
| Ctrl+K / Ctrl+F | Открыть поиск | Header.tsx |
| Ctrl+N | Новая книга | Header.tsx |
| Ctrl+S | Сохранить | Header.tsx |
| Ctrl+E | Экспортировать | Header.tsx |
| Ctrl+Plus (Ctrl+=) | Увеличить шрифт | page.tsx (Step-05) |
| Ctrl+Minus (Ctrl+-) | Уменьшить шрифт | page.tsx (Step-05) |
| Escape | Закрыть меню/поиск | Header.tsx |

### Ограничения

- Font size: min 10px, max 18px
- Undo/Redo (Ctrl+Z/Y): placeholder в меню "Скоро"
- Ctrl+Z/Y не реализованы т.к. workspace controller не имеет undo/redo

## Решения

1. **Ctrl+Plus/Minus:** Обработаны на странице уровня (page.tsx) чтобы быть глобально доступными
   - Оба "+" и "=" распознаются как Ctrl+Plus
   - Ctrl+Shift+Plus не поддерживается (браузерные shortcuts)

2. **Другие shortcuts:** Уже работают через Header.tsx, не нужно перемещать

## Тестирование

- ✅ Dev сервер работает
- ✅ Ctrl+Plus увеличивает font size
- ✅ Ctrl+Minus уменьшает font size
- ✅ Font size сохраняется в localStorage
- ✅ Ограничения (10-18px) работают

## Резюме

Все основные shortcuts реализованы:
- File меню shortcuts (Step-01): ✅
- Edit меню shortcuts (Step-02): ✅
- View меню shortcuts (Step-03): ✅
- Help меню shortcuts (Step-04): ✅
- Глобальные shortcuts (Step-05): ✅ Ctrl+Plus/Minus
- Остальные shortcuts (Header.tsx): ✅ Ctrl+K/F, Ctrl+N, Ctrl+S, Ctrl+E

Все shortcuts функциональны или отмечены как "Скоро" (Undo/Redo).
