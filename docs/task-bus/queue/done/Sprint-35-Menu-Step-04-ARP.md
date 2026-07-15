id: Sprint-35-Menu-Step-04-ARP
status: READY FOR REVIEW
date: 2026-07-15

## Что сделано

### Help меню реализовано

Добавлена ветка условного рендеринга для Help меню в Header.tsx:
- **Документация** (📖): открывает https://github.com/Denys-Vorovyev/Literary-Studio в новом tab
- **Горячие клавиши** (⌨️): вызывает onShowKeyboardShortcuts
- **Сообщить об ошибке** (🐛): открывает GitHub Issues в новом tab

### About меню реализовано

Добавлена ветка условного рендеринга для About меню в Header.tsx:
- Показывает название "Literary Studio" и версию (v0.1.0)
- **Автор** (👤): ссылка на GitHub профиль автора
- **Лицензия** (📄): ссылка на LICENSE файл в GitHub

### Keyboard Shortcuts диалог добавлен

Создан модальный диалог "Горячие клавиши" с основными shortcuts:
- Ctrl+K / Ctrl+F → Открыть поиск
- Ctrl+N → Новая книга
- Ctrl+S → Сохранить
- Ctrl+E → Экспортировать
- Escape → Закрыть меню/поиск

Диалог добавлен в три места:
1. Login screen (перед регистрацией)
2. Mobile layout (перед closing div)
3. Desktop layout (перед closing div)

### Props добавлены в HeaderProps

```typescript
onShowKeyboardShortcuts?: () => void;
appVersion?: string;
```

### Состояние в page.tsx

- `showKeyboardShortcuts` state управляет видимостью диалога
- `onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}` передан в оба Header вызова
- `appVersion="0.1.0"` передан в оба Header вызова

## Решения

1. **External links:** Все GitHub ссылки открываются с `window.open(..., "_blank")` для новой tab

2. **Keyboard Shortcuts:** Диалог показывает основные shortcuts используемые в приложении
   - Дополнительные shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+H) отмечены как "скоро" в меню
   - Можно расширить этот список в будущем

3. **About меню:** Включает версию из package.json (0.1.0)
   - Ссылки на GitHub профиль и LICENSE
   - Можно добавить Credits подробнее если нужно

## Тестирование

- ✅ Dev сервер работает на http://localhost:3000
- ✅ Help меню видна в header dropdown
- ✅ About меню видна в header dropdown
- ✅ Документация ссылка открывается
- ✅ Горячие клавиши диалог появляется при клике
- ✅ Диалог закрывается при клике "Закрыть"
- ✅ Версия отображается в About меню
- ✅ Все ссылки открываются в новом tab

## Next Steps

- Step-05: Global keyboard shortcuts (если ещё не реализованы)
- Step-06: Live verification на scratch server
