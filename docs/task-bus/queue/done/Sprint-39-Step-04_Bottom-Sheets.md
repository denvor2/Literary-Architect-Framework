# Sprint-39-Step-04: Bottom Sheets (Actions, Settings, AI Tools)

**Статус:** PENDING  
**Приоритет:** 🟠 ВЫСОКИЙ  
**Зависит от:** Sprint-39-Step-03 (Library Screen)

---

## Требование

Три bottom sheet компонента:
1. **Actions Sheet** — меню действий для глав/сцен (переименовать, опубликовать, переместить, удалить)
2. **Settings Sheet** — меню настроек (File, View, Help, Logout)
3. **AI Tools Panel** — быстрые команды AI для редактора (2x2 grid + textarea)

---

## Что нужно сделать

### Part A: BottomSheet Base Component

**Файл:** `src/components/BottomSheet.tsx`

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showDragHandle?: boolean;
}
```

Features:
- Drag handle сверху (полоска)
- Title (опционально)
- Content
- Overlay с rgba(0,0,0,0.45)
- Close при клике overlay или Escape
- Smooth slide-up/down animation (300ms)
- Z-index: 50 (выше drawer'а 40)

### Part B: Actions Sheet (для Chapter/Scene)

**Для главы (Chapter):**
1. Переименовать (pencil icon)
2. Опубликовать (copy icon)
3. Переместить выше (arrow-up icon)
4. Переместить ниже (arrow-down icon)
5. --- (divider)
6. Удалить главу (trash, красный `--text-danger`)
7. --- (divider)
8. Отмена (button внизу)

**Для сцены (Scene):**
1. Переименовать
2. Опубликовать (или: Показать vs Рассказать)
3. Переместить выше
4. Переместить ниже
5. --- (divider)
6. Удалить сцену (красный)
7. --- (divider)
8. Отмена

**Стиль:**
- Padding: 14px для всех кнопок
- Высота кнопки: ~48px (включая padding 12px)
- Font-size: 15px
- Divider: 0.5px solid `--border`, margin 6px 8px 0
- Delete button: color `--text-danger`
- Отмена button: background `--fill-secondary`, width 100%, padding 12px

### Part C: Settings Sheet

**Структура:**
1. Profile (avatar + name, tap → Account screen)
2. --- divider ---
3. **File section:**
   - Export book
   - Import book
4. **View section:**
   - Theme (Light/Dark/System)
   - Language (EN/RU)
5. **Help section:**
   - Guide
   - About
6. --- divider ---
7. Logout (красный `--text-danger`)

**Стиль:** как Actions Sheet

### Part D: AI Tools Panel

**Bottom sheet поверх редактора (не заменяет его):**
- Title: "AI-инструменты · [Scene name]"
- 2x2 grid быстрых команд:
  - Переписать (wand icon)
  - Продолжить (shuffle icon)
  - Показать vs рассказать (eye icon)
  - Сократить (align-left icon)
- Textarea: "Что слушать в этой сцене? (опционально)"
- Button: "Применить к выделению"
- Drag handle и close на Escape/overlay click

**Стиль:**
- Buttons в grid: padding 12px, border 0.5px `--border`, border-radius 8px
- Textarea: width 100%, min-height 60px

---

## Файлы для изменения

**Новые:**
1. [src/components/BottomSheet.tsx](src/components/BottomSheet.tsx) — base component
2. [src/components/ActionsSheet.tsx](src/components/ActionsSheet.tsx) — для chapter/scene
3. [src/components/SettingsSheet.tsx](src/components/SettingsSheet.tsx) — меню настроек
4. [src/components/AIToolsPanel.tsx](src/components/AIToolsPanel.tsx) — AI инструменты

**Обновить:**
5. [src/app/page.tsx](src/app/page.tsx) — manage sheet states (isActionsOpen, isSettingsOpen, isAIToolsOpen)
6. [src/components/Sidebar.tsx](src/components/Sidebar.tsx) — trigger ActionsSheet при клике на chapter/scene

---

## Стоп-условие

✅ BottomSheet base component создана, slide animations работают  
✅ ActionsSheet отображает действия для chapter корректно  
✅ ActionsSheet отображает действия для scene корректно  
✅ Delete действие заблокировано (нужно открыть меню)  
✅ SettingsSheet отображает все разделы (File, View, Help, Logout)  
✅ AIToolsPanel отображает 2x2 grid быстрых команд  
✅ Textarea для свободного ввода работает в AIToolsPanel  
✅ Все sheets закрываются на Escape / overlay click  
✅ Drag handle видимо и функционально  
✅ Z-index корректный (выше drawer'а)  

