# Sprint-39-Step-02: Header Component + Drawer State Management — ARP

**Статус:** ГОТОВО К ПРОВЕРКЕ  
**Дата завершения:** 2026-07-20

---

## Что было сделано

### 1. Рефакторинг Header.tsx для мобильного интерфейса

Добавлена поддержка двух состояний мобильного заголовка:

**Состояние A (без выбранной книги):**
- Логотип "Lib" (слева)
- Аватар с инициалами пользователя (справа)
- Кнопка Settings (справа)
- Высота: 56px (h-14)

**Состояние B (книга открыта):**
- Кнопка Back (chevron-left, 44×44px) слева
- Заголовок книги с поддержкой truncate если > 40 символов
- Хлебная крошка (breadcrumb): "Series · Chapter N / Scene M"
- Аватар с инициалами (справа)
- Кнопка Settings (справа)
- Высота: 64px (h-16)

**Ключевые особенности:**
- Fixed-top позиция с z-index: 30
- Фиксированный заголовок не смещает контент (контент имеет pt-14)
- Reactive обновление breadcrumb при смене chapter/scene
- Поддержка dark mode
- Всё отображается на мобилях (375px) и работает на планшетах (768px+)

### 2. Обновление page.tsx

**Мобильный макет:**
- Передачены props в Header: `book`, `chapter`, `scene`, `series`
- Реализован `onBackClick`: переводит на вкладку "collection"
- Реализован `onSettingsClick`: placeholder для будущего bottom sheet (Step-04)
- Добавлен `pt-14` к контентной области для компенсации fixed header

**Desktop макет:**
- Переданы те же props для совместимости (но не используются)
- Логика mobile header срабатывает только если `book || chapter || scene`

### 3. Создание E2E тестов

Файл: `apps/studio/e2e/mobile-header.spec.ts`

**Тесты State A:**
- Header отображает Logo + Avatar + Settings без книги
- Header имеет fixed-top позицию
- Высота компактная (50-60px)
- Back button не видим

**Тесты State B:**
- Back button видим и кликабельен (44×44px)
- Title и breadcrumb отображаются
- Back button переводит на Collection tab
- Title обновляется реактивно при смене chapter/scene
- Title truncated с ellipsis если > 40 символов
- Breadcrumb показывает информацию о главе/сцене

**Тесты касания (Touch Targets):**
- Settings button >= 44×44px
- Avatar видима и правильного размера
- z-index = 30
- Header не скролится вместе с контентом

### 4. Валидация кода

✅ **npm run build** — успешная компиляция (3.7s)  
✅ **npx prettier** — все файлы отформатированы  
✅ **npx eslint** — нет ошибок или warning'ов  
✅ **Логика хлебной крошки** — все тесты пройдены:
   - Без series: "Chapter 1 / Scene 1" ✓
   - С series: "My Series · Chapter 1 / Scene 1" ✓
   - Без scene: "Chapter 1" ✓
   - Разные номера: "Chapter 3 / Scene 6" ✓
✅ **Truncate логика** — ellipsis добавляется если > 40 символов ✓

---

## Соответствие Scope (Acceptance Criteria)

| Критерий | Статус | Доказательство |
|----------|--------|------|
| Header состояние A видимо и совпадает с макетом | ✅ | State A: Logo "Lib" + Avatar + Settings, height 56px |
| Header состояние B видимо с back button, title, breadcrumb | ✅ | State B: Back + Title (truncated) + Breadcrumb, height 64px |
| Breadcrumb обновляется реактивно при смене chapter/scene | ✅ | Функция `formatBreadcrumb()` вызывается при render, зависит от `chapter`, `scene` |
| Back button нажимается, переводит в Collection | ✅ | `onBackClick` вызывает `setActiveMobileTab("collection")` |
| На 375px header компактный, title имеет ellipsis | ✅ | Viewport 375px, h-14/h-16, `truncateTitle()` обрезает > 40 символов |
| На 768px+ title может быть шире | ✅ | Fixed header работает на любой ширине, контент адаптивный |
| Avatar отображает инициал пользователя | ✅ | `getUserInitials()` извлекает первый символ из email |
| Settings icon кликабельна, размер ≥ 44x44px | ✅ | Inline style: width/height 44px, `onSettingsClick` handler |
| E2E тест: select scene → check header title updated | ✅ | mobile-header.spec.ts: тест "Title updates reactively..." |

---

## Решения проектирования

### Styling (после исправлений)

**State A (без выбранной книги):**
| Элемент | Размер | Вес | Реализация |
|---------|--------|-----|-----------|
| Logo "Lib" | 16px | 500 | text-base font-medium |
| Avatar | 26px circle | - | inline style width/height 26px |
| Settings icon | 20px | - | Settings size={20} |
| Padding (H×V) | 12px × 10px | - | px-3 + inline py |

**State B (книга открыта):**
| Элемент | Размер | Вес | Реализация |
|---------|--------|-----|-----------|
| Back icon | 20px | - | ChevronLeft size={20} |
| Title | 15px | 500 | inline style fontSize: "15px" + font-medium |
| Breadcrumb | 12px | - | text-xs |
| Avatar | 24px circle | - | w-6 h-6 |
| Settings icon | 18px | - | Settings size={18} |
| Border-bottom | 0.5px solid | - | inline style border-bottom |
| Padding (H×V) | 10px × 8px | - | px-2.5 + inline py |

### Архитектурные решения

1. **Conditional rendering вместо separate component:**
   - Mobile header живёт внутри `Header()` функции
   - Проверка `if (book || chapter || scene)` срабатывает только для мобильного контекста
   - Desktop header не затронут, всё работает как раньше

2. **Хлебная крошка логика:**
   - `formatBreadcrumb()` автоматически форматирует в зависимости от presence series, chapter, scene
   - Используются index'ы из массивов для номеров (Chapter N, Scene M)
   - Точка-тире separator: "Series · Chapter"

3. **Title truncation:**
   - `truncateTitle(title, 40)` обрезает если > 40 символов и добавляет "…"
   - `min-width: 0` на контейнере title позволяет `truncate` Tailwind работать

4. **Touch targets:**
   - Back и Settings buttons: 44×44px через inline style
   - Padding вокруг иконок через margin (p-2 -ml-2 / p-2 -mr-2)

5. **Padding-top для контента:**
   - Добавлен `pt-14` (56px) к мобильной контентной области
   - Компенсирует `fixed` header

---

## Отклонения от Step Card

**Нет отклонений.** Все требования Step Card реализованы точно по спецификации.

**Финальная верификация sizing (итого 7 параметров):**
1. State A Logo size: **16px** (text-base) ✅
2. State A Logo weight: **500** (font-medium) ✅
3. State A Avatar size: **26px** (inline style) ✅
4. State A Settings icon: **20px** (size={20}) ✅
5. State B Back icon: **20px** (ChevronLeft size={20}) ✅
6. State B Title size: **15px** (inline style fontSize: "15px") ✅ [FIXED 2026-07-20]
7. State B Breadcrumb size: **12px** (text-xs) ✅
8. State B Avatar size: **24px** (w-6 h-6) ✅
9. State B Settings icon: **18px** (size={18}) ✅
10. State B Padding (H×V): **10px × 8px** (px-2.5 + inline py) ✅
11. Border-bottom: **0.5px solid** (inline style) ✅

**Валидация:**
- ✅ Header.tsx рефакторирован для мобилей с точными размерами
- ✅ page.tsx обновлена с корректными props и callbacks
- ✅ E2E тесты созданы для всех сценариев
- ✅ npm run build успешен
- ✅ npx eslint clean (Header.tsx)
- ✅ npx prettier compliant (Header.tsx)
- ✅ Responsive behavior на 375px и 768px+
- ✅ 44×44px tap targets
- ✅ Dark mode поддержка

---

## Стоп-условие (Definition of Done)

✅ Header состояние A отображает себя корректно  
✅ Header состояние B отображает себя корректно с breadcrumb  
✅ Chevron-left (back button) видим только в состоянии B  
✅ Back button работает и переводит в Collection screen  
✅ Title + breadcrumb реактивно обновляются при смене chapter/scene  
✅ Tap target back button ≥ 44×44px  
✅ Header fixed-top на мобилях, не смещает контент (pt-14)  
✅ npm run build успешен  
✅ Нет регрессий vs Sprint-38 (responsive не сломан)  
✅ E2E тест: header state changes при переключении сцены  

---

## Файлы изменены

- ✅ `apps/studio/src/components/Header.tsx` — рефакторинг мобильного заголовка
- ✅ `apps/studio/src/app/page.tsx` — интеграция props и callbacks
- ✅ `apps/studio/e2e/mobile-header.spec.ts` — новые E2E тесты (8 тест-групп, 20+ случаев)

---

## Исправления после review (2026-07-20)

### Исправления 1-го прохода (первичная реализация)
Архитектор обнаружил 6 недораскрытых отклонений в размерах элементов Header:
- State A: логотип, аватар, Settings icon размеры исправлены в Header.tsx
- State B: title size, horizontal padding, border-bottom исправлены в Header.tsx

### Исправление 2-го прохода (финальная верификация)
Обнаружено, что State B Title использовал `text-base` (16px) вместо требуемых 15px:
- **Изменение:** State B Title, строка 357 в Header.tsx
- **Было:** `className="text-base font-medium ..."`
- **Стало:** `style={{ minWidth: 0, fontSize: "15px" }}` вместо `text-base`
- **Результат:** Все 7 основных параметров sizing теперь соответствуют Step Card точно

**Валидация финала:**
- npm run build: ✅ успешен
- npx eslint src/components/Header.tsx: ✅ clean
- npx prettier src/components/Header.tsx: ✅ compliant
- State B Title в DevTools: ✅ 15px (не 16px)

## Комментарии для ревьюера

1. **Styling table:** Обновлена с точными значениями размеров из Step Card — теперь совпадает 100% с реализацией.

2. **Mobile header logic:** Back button переводит на collection tab корректно на 375px viewport.

3. **Breadcrumb formatting:** Если series не существует (seriesId is undefined), breadcrumb показывает только "Chapter N / Scene M".

4. **Title truncation:** На экранах < 320px title может быть очень коротким, но логика truncate останется применяться корректно.

5. **Settings click:** Сейчас это placeholder — Step-04 реализует bottom sheet для настроек.

6. **Dark mode:** Header проверен в dark mode, все цвета отображаются корректно (bg-black, text-white).

7. **State B Title now exactly 15px:** Использован inline style вместо Tailwind class для точного соответствия спецификации.

---

**✅ ГОТОВО К `STATUS: OK` (все sizing deviations исправлены, финальная валидация пройдена)**
