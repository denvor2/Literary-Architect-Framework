id: Sprint-35-Menu-Step-06
name: "Live verification: Все меню работают на scratch-порту"
type: testing

## Objective

Независимая проверка всех пунктов меню на свежем scratch-порту (не dev сервер PO).

Запустить app на scratch-порту 3418 (отделить от dev-сервера).
Проверить все пункты меню и shortcuts.

## Scope

### Allowed paths:
- npm run build
- Запуск на свежем порту
- Live browser testing

### Forbidden:
- Менять код (только verification)

## Validation Checklist

### File меню
- [ ] Новая книга → создаёт книгу в Sidebar
- [ ] Новая серия → открывает диалог
- [ ] Выход → logout, редирект на login

### Edit меню
- [ ] Удалить книгу → confirm, удаляется
- [ ] Undo disabled (если нет impl)
- [ ] Redo disabled (если нет impl)

### View меню
- [ ] Focus Mode ✓ indicator переключается
- [ ] Светлая тема ● indicator работает
- [ ] Тёмная тема ● indicator работает
- [ ] Theme persist: refresh → same theme
- [ ] Fullscreen работает (или disabled)

### Help меню
- [ ] Горячие клавиши dialog открывается
- [ ] О программе dialog открывается
- [ ] Escape закрывает диалоги

### Keyboard shortcuts
- [ ] Ctrl+K → Search фокусируется
- [ ] Ctrl+Z → Undo (if impl)
- [ ] Escape → Close menu

## Output

ARP в docs/task-bus/queue/active/:
1. Чек-лист (✅/❌ для каждого пункта)
2. Скриншоты всех меню (open state)
3. Видео: Ctrl+K, theme toggle, menu interactions
4. Результат `npm run build` (success)

## Stop Condition

Все пункты работают (или документировано почему disabled).
