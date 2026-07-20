# Sprint-39-Step-06: Assistants Screen (Mobile Layout)

**Статус:** PENDING  
**Приоритет:** 🟡 СРЕДНИЙ  
**Зависит от:** Sprint-39-Step-05 (Editor Toolbar)

---

## Требование

Адаптировать экран Помощников (AssistantPanel.tsx) для мобильной версии: компактный список собственных экспертов, быстрые команды, textarea для свободного ввода, статистика.

---

## Что нужно сделать

### Part A: Assistants Screen Layout (AssistantPanel.tsx)

**Структура:**
1. Header (ссылка на Step-02)
2. **Section: Мои эксперты**
   - Карточка активного эксперта (bg-accent, clickable menu via `...`)
   - Button: "+ Добавить эксперта"
3. **Section: Работающая зона активного эксперта**
   - Icon emoji + название эксперта
   - Grid быстрых команд (например, "проверь факты", "предложи вариант") — adaptive grid на мобилях (1 column если узко, 2 если можно)
   - Textarea: "Что слушать в этой сцене? (опционально)"
4. **Footer:**
   - Stats: Слов / Знаков / Без пробелов
   - Tab-bar: Коллекция / Редактор / Помощники (active)

### Part B: Expert Card

**Активный эксперт:**
- Background: `--bg-accent`
- Text: `--text-accent`
- Layout:
  - Emoji (16px) + Name (14px/500)
  - Right: Menu icon (`...`) → открывает ActionsSheet (Edit/Delete)
- Padding: 10px 12px
- Border-radius: 8px
- Margin-bottom: 10px

### Part C: Quick Commands Grid

**Кнопки команд:**
- Adaptive: 1 column на 375px, 2 columns на 480px+
- Padding: 12px per button
- Border: 0.5px solid `--border`
- Border-radius: 8px
- Font-size: 13px
- Min-height: 44px
- Background: `--surface-2` or `--fill-secondary`

**Примеры команд:**
- 🔍 Проверь факты
- 💡 Предложи вариант
- ✂️ Сократи текст
- 📖 Расширь описание

### Part D: Textarea & Button

**Textarea:**
- Width: 100%
- Min-height: 64px
- Padding: 10px
- Border: 0.5px solid `--border`
- Border-radius: 8px
- Placeholder: "Что слушать в этой сцене? (опционально)"
- Font: `--font-sans`, 14px

**Button:**
- Width: 100%
- Padding: 12px
- Margin-top: 10px
- Background: `--fill-secondary` or primary color
- Border-radius: 8px
- Font-size: 15px / 500 weight
- Text: "Применить"

### Part E: No Experts State

Если у пользователя нет собственных экспертов:
- Placeholder text: "Эксперты помогают редактировать. Создайте своего специалиста в Помощниках."
- Button: "+ Создать эксперта"
- Icon: sparkles (accent color)

---

## Файлы для изменения

**Обновить:**
1. [src/components/AssistantPanel.tsx](src/components/AssistantPanel.tsx) — Mobile layout refactor

---

## Стоп-условие

✅ Мои эксперты список видим компактно  
✅ Карточка активного эксперта подсвечена accent color  
✅ Quick commands отображаются в адаптивной сетке  
✅ Textarea полностью видима и editable  
✅ Button "Применить" работает  
✅ No experts state показывает placeholder  
✅ Stats footer видима внизу  
✅ Tab-bar переключает между табами  

