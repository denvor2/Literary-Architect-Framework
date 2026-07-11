# ARP: Sprint-26-Step-01

**Статус:** Завершено (awaiting Product Owner confirmation / STATUS: OK)

**Дата:** 2026-07-11

---

## Что сделано

Скрыта кнопка "Фокус" / "Выйти из фокуса" из пользовательского интерфейса. Функциональность Focus Mode (логика `isFocusMode`, `onToggleFocusMode` callback, стилевой класс `mx-auto max-w-3xl` при активном режиме) полностью сохранена в коде для возможного восстановления в будущем.

### Конкретные изменения

**Файл:** `apps/studio/src/components/EditorArea.tsx`

1. **Строки 332–337 (удалено):** Кнопка-переключатель Focus Mode:
   ```tsx
   <button
     onClick={onToggleFocusMode}
     className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
   >
     {isFocusMode ? "Выйти из фокуса" : "Фокус"}
   </button>
   ```

2. **Строка 192 (добавлено):** Комментарий для подавления ESLint-предупреждения о неиспользуемом `onToggleFocusMode`:
   ```tsx
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   ```

### Что осталось неизменным

- **Пропс `isFocusMode`:** всё ещё передаётся в компонент из `page.tsx`
- **Callback `onToggleFocusMode`:** всё ещё определён в сигнатуре функции (с ESLint-подавлением)
- **Логика Focus Mode:** строка 325 сохраняет условное добавление класса `mx-auto max-w-3xl` при `isFocusMode === true`
- **Кнопка "Свернуть/Развернуть":** остаётся на месте (теперь это единственная кнопка в хедере реквизитов)

---

## Соответствие Scope

✓ **Allowed path:** `apps/studio/src/components/EditorArea.tsx` — только этот файл изменён.

✓ **Forbidden path compliance:** Логика Focus Mode НЕ удалена, только кнопка (UI).

✓ **Кнопка "Свернуть/Развернуть"** остаётся на месте.

`git status --short` показывает:
```
M apps/studio/src/components/EditorArea.tsx
```

---

## Validation

### 1. TypeScript (`npx tsc --noEmit`)
```
✓ Passed (no output = no errors)
```

### 2. ESLint (`npx eslint src/components/EditorArea.tsx`)
```
✓ Passed (no output = no warnings or errors)
```
Комментарий `// eslint-disable-next-line @typescript-eslint/no-unused-vars` успешно подавил ожидаемое предупреждение о неиспользованном `onToggleFocusMode`.

### 3. Prettier (`npx prettier --check src/components/EditorArea.tsx`)
```
✓ All matched files use Prettier code style!
```

### 4. Build (`npm run build`)
```
✓ Compiled successfully in 2.3s
✓ Finished TypeScript in 3.8s
✓ Generating static pages using 13 workers (12/12) in 684ms
```

### 5. Live-verify

Dev-сервер запущен и доступен на `http://localhost:3000/`. Проверка исходного кода компонента подтверждает:

- **Кнопка "Фокус" отсутствует:** В строках 332–340 осталась только одна кнопка (Collapse/Expand).
- **Текст "Фокус" и "Выйти из фокуса" удалены:** не содержатся в отрендеренном JSX.
- **Требизиты книги сохранены:** раздел "Реквизиты книги" в хедере остаётся на месте (строка 329–330).
- **Логика Focus Mode сохранена:** Условие на строке 325 (`isFocusMode ? "mx-auto max-w-3xl" : ""`) остаётся, готово к использованию при восстановлении функции.

---

## Отклонения от Step Card

**Нет.** Реализация точно следует требованиям Step Card Sprint-26-Step-01.

---

## Stop Condition

**Не коммитить без подтверждения Product Owner.** Текущее состояние:

- ✓ Код написан и протестирован
- ✓ Все validations пройдены
- ✓ ARP написан
- ⏳ **Ожидание `STATUS: OK` от Product Owner перед commit**

Файл `docs/task-bus/queue/active/Sprint-26-Step-01.md` был перемещён из `pending/` в `active/` в начале работы.
