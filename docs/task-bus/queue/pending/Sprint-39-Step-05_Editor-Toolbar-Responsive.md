# Sprint-39-Step-05: Editor Toolbar Responsive & Layout

**Статус:** PENDING  
**Приоритет:** 🟠 ВЫСОКИЙ  
**Зависит от:** Sprint-39-Step-04 (Bottom Sheets)

---

## Требование

Адаптировать toolbar редактора для мобилей: горизонтально скроллящаяся toolbar с кнопками форматирования, поиска, AI-инструментов и помощников.

---

## Что нужно сделать

### Part A: Toolbar Restructuring (EditorArea.tsx)

**Текущая структура (desktop):**
```
[Undo] [Redo] | [Bold] [Italic] [Quote] | [Find] | [AI] [Assistants]
```

**На мобилях:**
- Horizontal scroll контейнер (`overflow-x: auto`)
- Иконки: 16-20px визуально, но tap target 44x44px
- Padding между иконками: 4px
- Dividers: 0.5px solid `--border`, margin 0 4px

**Порядок (L→R):**
1. Undo (arrow-back-up icon) — disabled если нет undo
2. Redo (arrow-forward-up icon) — disabled если нет redo
3. Divider
4. Bold (bold icon)
5. Italic (italic icon)
6. Quote (quote icon)
7. Divider
8. Find (search icon) → opens Find & Replace
9. AI Tools (sparkles, accent color) → opens AIToolsPanel
10. Assistants (message-circle icon) → switches to Assistants tab

### Part B: Icon Colors & States

**Default:** `--text-secondary`
**Hover:** slightly lighter
**Active/Toggled:** `--text-accent` (e.g., if Bold is applied to selection)
**Disabled:** `--text-muted`, opacity-40
**AI icon:** always `--text-accent` (prominent)

### Part C: Layout Changes

**Page.tsx structure:**
```
<Header />  {/* top-fixed */}
<main>
  {activeTab === 'collection' && <Sidebar isDrawer />}
  {activeTab === 'editor' && (
    <>
      <EditorArea toolbar={<Toolbar />} />
      <StatsFooter />
    </>
  )}
  {activeTab === 'assistants' && <AssistantsPanel />}
</main>
<BottomSheets />  {/* ActionsSheet, SettingsSheet, AIToolsPanel */}
```

**Spacing:**
- Header: fixed top, height ~52-60px
- Main content: `margin-top: 60px` (account for fixed header)
- Footer: 0.5px border-top, 36px height for stats

### Part D: Textarea Container

**Editor textarea:**
- Placeholder: Scene title on line 1 (13px, muted)
- Font: `--font-voice` (serif), 16px, line-height 1.7
- Min-height: calc(100vh - header - toolbar - footer)
- Padding: 14px
- Border: none
- Resize: none

---

## Файлы для изменения

**Обновить:**
1. [src/components/EditorArea.tsx](src/components/EditorArea.tsx) — Toolbar refactor for mobile
2. [src/app/page.tsx](src/app/page.tsx) — Layout restructuring
3. [src/components/StatsFooter.tsx](src/components/StatsFooter.tsx) — если нужны изменения

---

## Стоп-условие

✅ Toolbar горизонтально скроллится на мобилях  
✅ Tap targets всех кнопок ≥ 44x44px  
✅ Dividers видимы и правильно расположены  
✅ Иконки отображаются правильно (color, size)  
✅ Disabled состояние работает (undo/redo)  
✅ AI icon всегда accent color  
✅ Main content не перекрывается fixed header  
✅ Textarea полностью видима на всех viewport'ах  

