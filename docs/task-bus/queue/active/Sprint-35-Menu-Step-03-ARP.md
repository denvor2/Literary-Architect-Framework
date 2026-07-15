id: Sprint-35-Menu-Step-03-ARP
status: READY FOR REVIEW
date: 2026-07-15

## Что сделано

### View меню реализовано в Header.tsx

Добавлена ветка условного рендеринга для View меню (меню.key === "view"):

1. **Тема (Light/Dark/Auto)**
   - 3 кнопки с текущим выбором отмечены фоном
   - Каждый выбор сохраняется в localStorage
   - applyTheme функция применяет класс `dark` на html элемент

2. **Размер текста (10-18px)**
   - Два button -/+ с текущим размером посередине
   - Нажатие ±1px с ограничением min=10, max=18
   - Размер сохраняется в localStorage
   - Применяется через document.documentElement.style.fontSize

3. **Боковая панель**
   - Кнопка toggle которая вызывает onToggleSidebar
   - Непосредственно collapse/expand боковую панель

4. **Режим фокуса**
   - Placeholder с disabled состоянием (скоро)

### Props добавлены в HeaderProps type

```typescript
onThemeChange?: (theme: "light" | "dark" | "auto") => void;
onFontSizeChange?: (size: number) => void;
onToggleSidebar?: () => void;
currentTheme?: "light" | "dark" | "auto";
currentFontSize?: number;
```

### Состояние и обработчики в page.tsx

- `currentTheme` state с инициализацией из localStorage
- `currentFontSize` state (default 14px)
- `applyTheme()` функция для применения тёмной/светлой темы
- `handleThemeChange()` сохраняет и применяет тему
- `handleFontSizeChange()` сохраняет и применяет размер
- useEffect при mount для загрузки сохранённых настроек
- Всё передано в оба Header вызова (mobile и desktop)

## Решения

1. **Theme система:** Используется Tailwind's `dark:` класс + localStorage
   - `dark:` класс применяется/убирается с помощью JS
   - Auto режим использует `window.matchMedia("(prefers-color-scheme: dark)")`

2. **Font size:** Применяется глобально через `document.documentElement.style.fontSize`
   - Все relative units (`em`, `rem`) будут масштабироваться от этого значения
   - Сохраняется в localStorage

3. **Sidebar toggle:** Использует существующий `setIsSidebarCollapsed` state

## Тестирование

- ✅ Dev сервер запущен на http://localhost:3000
- ✅ View меню видна в header dropdown
- ✅ Theme submenu показывает 3 опции (Light/Dark/Auto) с выделением текущего
- ✅ Clicking theme меняет фон страницы немедленно
- ✅ Font size -/+ кнопки работают
- ✅ Sidebar toggle collapse/expand функция работает

## Persists

- Theme выбор сохраняется в localStorage['theme']
- Font size сохраняется в localStorage['fontSize']
- Загружаются из localStorage при загрузке страницы

## Next Steps

- Step-04: Help & About меню
- Step-05: Global keyboard shortcuts (не зависит от menu)
- Step-06: Live verification на scratch server
