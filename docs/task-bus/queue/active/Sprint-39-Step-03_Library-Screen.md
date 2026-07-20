# Sprint-39-Step-03: Library/Collection Screen with Drawer

**Статус:** PENDING  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Зависит от:** Sprint-39-Step-02 (Header + Drawer State)

---

## Требование

Экран библиотеки с разворачиваемыми секциями (Books, Series, Characters, Ideas, Trash). На мобилях открывается как drawer слева, редактор остается виден. Активная сцена подсвечена тоном `--bg-accent`.

---

## Что нужно сделать

### Part A: Expandable Sections (Books, Series, Characters, Ideas, Trash)

**В Sidebar.tsx:**

1. **Структура:**
   - 📚 КНИГИ (Books) — chevron-down/right, список книг
     - 📖 Книга 1 — chevron-down/right, список глав
       - 📄 Chapter 1 — chevron-down/right, список сцен
         - Scene 1 (active: bg-accent)
         - Scene 2
       - 📄 Chapter 2
   - 📚 СЕРИИ (Series) — chevron-down/right
   - 👥 ПЕРСОНАЖИ (Characters) — chevron-down/right
   - 💡 ИДЕИ (Ideas) — chevron-down/right
   - 🗑️ КОРЗИНА (Trash) — chevron-down/right

2. **Иконки:**
   - Развернута (expanded): `chevron-down` 
   - Свернута (collapsed): `chevron-right`
   - Неразворачивается (leaf item): нет иконки (или мертвая иконка)

3. **Цвета и иерархия:**
   - Section header: 13px, 500 weight, `--text-secondary`, padding 12px 14px
   - Book/Chapter: 14px, `--text-secondary`, padding 12px 14px
   - Scene: 14px, `--text-secondary`, padding 10px 12px 10px 28px (indent)
   - Active scene (открыта в редакторе): background `--bg-accent`, text `--text-accent`
   - Disabled/muted (например, в Trash): color `--text-muted`

4. **Bottom Sheet (Drawer на мобилях):**
   - Position: fixed left-0 top-0, z-index: 40
   - Width: 80% или ~300px (whichever is smaller)
   - Overlay за drawer: background rgba(0,0,0,0.45)
   - Drawer скрыта на планшетах (≥768px), боковая колонка видна обычно

### Part B: Context Menu (Bottom Sheet Actions)

При клике на chapter/scene → появляется bottom sheet с действиями:
- Переименовать
- Опубликовать / Скопировать
- Переместить выше / ниже
- ---
- Удалить (красный, `--text-danger`)
- Отмена (кнопка внизу)

**Обязательно:** Удаление не должно быть доступно одним тапом (нужно открыть меню).

### Part C: Mobile Drawer Integration

**На мобилях (375px-640px):**
- Sidebar скрыта по умолчанию
- Drawer открывается от левого края при клике hamburger (Step-01)
- Клик на сцену → закрывает drawer, показывает редактор
- Клик на overlay → закрывает drawer
- Keyboard: Escape закрывает drawer
- Backdrop: полупрозрачный, blur (если нужно)

**На планшетах (768px+):**
- Sidebar видима обычно (relative position, не drawer)
- Hamburger меню скрыто
- Layout: Sidebar (300px) | Editor (flex: 1)

### Part D: Reactivity

- Активная сцена (та, что открыта в редакторе) → подсвечена `--bg-accent`
- При переключении глав/сцен в редакторе → sidebar обновляется (highlight current scene)
- При переключении сцены из sidebar → редактор обновляется (не закрывается drawer на планшетах)

---

## Файлы для изменения

**Обязательно:**
1. [src/components/Sidebar.tsx](src/components/Sidebar.tsx) — рефакторинг для drawer + expandable sections
2. [src/app/page.tsx](src/app/page.tsx) — pass drawer state props в Sidebar
3. [src/components/Drawer.tsx](src/components/Drawer.tsx) — новый компонент (если нужен wrapper)

---

## Стоп-условие

✅ Books, Series, Characters, Ideas, Trash видимы как expandable sections  
✅ Chevron-down/right логика работает (раскрывается/свивается)  
✅ На мобилях Sidebar открывается как drawer с overlay  
✅ На мобилях overlay закрывает drawer при клике  
✅ На мобилях Escape закрывает drawer  
✅ Активная сцена подсвечена `--bg-accent`  
✅ Bottom sheet меню доступно для chapter/scene  
✅ На планшетах Sidebar видима обычно (не drawer)  
✅ E2E тест: drawer open/close на 375px, sidebar visible на 768px  
✅ Нет регрессий vs предыдущих спринтов  

