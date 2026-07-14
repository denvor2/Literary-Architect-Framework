id: Sprint-34-Step-05
name: "UI: Gear dialog с табами для Series & Book Story Bible"
type: implementation

## Контекст

API endpoints готовы (Step 04). Теперь нужен UI для редактирования Story Bible — два диалога (Series/Book) с 4 табами каждый.

Дизайн см. [UI mockup](https://claude.ai/code/artifact/2aa713b6-801e-4c85-be7a-d59c78256fc4)

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/src/components/SeriesSettingsDialog.tsx (новый)
- apps/studio/src/components/BookSettingsDialog.tsx (новый)
- apps/studio/src/app/page.tsx (добавить callbacks + state)
- apps/studio/src/components/Header.tsx (добавить кнопку Gear)

### Forbidden paths:
- Новые компоненты помимо DialogBox'ов (использовать встроенные элементы)
- API логика (уже done в Step 04)

## Objective

### 1. SeriesSettingsDialog.tsx

```typescript
interface SeriesSettingsDialogProps {
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Series) => Promise<void>;
}

export function SeriesSettingsDialog({ series, isOpen, onClose, onSave }: ...) {
  // 4 Tabs:
  // - Tab 1: Основное (title, description, audience, genre, status)
  // - Tab 2: Story Bible (decisions, throughlineElements)
  // - Tab 3: Ограничения (seriesConstraints)
  // - Tab 4: Метаданные (wordCount, dates, author, notes)
  
  // State: activeTab = "basic" | "bible" | "constraints" | "meta"
  // State: formData = Partial<Series> (for editing)
  
  // onSave → PUT /api/series/{id} → update workspace state
}
```

### 2. BookSettingsDialog.tsx

```typescript
interface BookSettingsDialogProps {
  book: Book | null;
  series: Series | null;  // для наследования
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Book) => Promise<void>;
}

export function BookSettingsDialog({ book, series, isOpen, onClose, onSave }: ...) {
  // 4 Tabs:
  // - Tab 1: Основное (title, workingTitle, description, audience, genre, status, counts)
  // - Tab 2: Story Bible (mainPlotlines, principle, escalation, themes)
  // - Tab 3: Ограничения (bookConstraints)
  // - Tab 4: Метаданные (dates, ISBN, notes)
  
  // Наследование: если Book.targetAudience пусто → показать "наследовать из Series" 
  //             если Book.genre пусто → показать "наследовать из Series"
  
  // onSave → PUT /api/book/{id} → update workspace state
}
```

### 3. Integration в page.tsx

```typescript
// State:
const [openSeriesSettings, setOpenSeriesSettings] = useState(false);
const [openBookSettings, setOpenBookSettings] = useState(false);

// Callbacks:
const handleSaveSeriesStoryBible = async (data: Series) => {
  await fetch(`/api/series/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // Обновить workspace state
  setOpenSeriesSettings(false);
};

const handleSaveBookStoryBible = async (data: Book) => {
  await fetch(`/api/book/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // Обновить workspace state
  setOpenBookSettings(false);
};
```

### 4. Header (добавить кнопку Gear)

```typescript
// В Header рядом с Book/Series title:
<button onClick={() => setOpenSeriesSettings(true)}>⚙️</button>
<button onClick={() => setOpenBookSettings(true)}>⚙️</button>
```

### 5. UI Components (встроенные элементы)

- **Input fields**: текст для title, description, etc
- **Textarea**: для decisions, principle, escalation, notes
- **Select**: для audience, status
- **Chips/Tags**: для genre[], themes[], constraints[], etc
  - Клик × удаляет элемент
  - Button "+ добавить" → input field → Enter добавляет
- **Tabs**: простой onClick переключатель (CSS классы)

## Validation

Живая проверка в браузере:

1. **Открыть Series Gear:**
   - Gear icon рядом с Series title
   - Dialog открывается
   - 4 таба видны

2. **Tab переключение:**
   - Клик на "Story Bible" → содержимое меняется
   - Клик на "Ограничения" → constraints показываются

3. **Редактирование:**
   - Заполнить decisions → текст сохраняется в локальном state
   - Добавить throughlineElement (+ кнопка) → чип появляется
   - Удалить чип (× кнопка) → исчезает

4. **Сохранение:**
   - Нажать "Сохранить"
   - API call к /api/series/{id}
   - Dialog закрывается
   - Данные остаются после refresh (persisted в БД)

5. **Book Settings:**
   - Все то же для Book dialog
   - Наследование: если Book.targetAudience пусто → показать "из Series"
   - После edit → сохранить → данные в БД

6. **Ошибки:**
   - Если API вернул 400 → показать error message
   - Если API вернул 403 → show "Не авторизован"

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншоты всех 4 табов Series dialog
2. Скриншоты всех 4 табов Book dialog
3. Скриншоты интерактивности (добавление/удаление chips)
4. Скриншоты после Save (данные persisted)
5. Результат `npx tsc --noEmit`
6. Результат `npm run build`
7. Результат живой браузерной проверки (все сценарии выше)

## Stop Condition

Не коммитить без подтверждения Product Owner.
