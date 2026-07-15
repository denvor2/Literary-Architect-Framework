# Sprint-33-Step-06: Отображение типовых запросов как pills рядом с именем режима — ARP

**Статус:** Готово к проверке

**Дата:** 2026-07-15

---

## Что сделано

### 1. Добавлены pills с typicalRequests ниже имени режима

В файле `apps/studio/src/components/AssistantPanel.tsx` добавлен новый раздел (строки 1116–1138), отображающий `selectedTypicalRequests` в виде кликабельных pills непосредственно ниже заголовка с именем текущего режима (вместо предыдущего расположения ниже истории сообщений).

**Место в коде:** после строки 1114 (заголовок с иконкой и именем режима) и перед строкой 1140 (CRITIC_SUBCATEGORIES для Критика).

**Структура:**
```typescript
{selectedTypicalRequests.length > 0 && (
  <div className="flex flex-wrap gap-1.5">
    {selectedTypicalRequests.map((request) => (
      <button
        key={request}
        onClick={() => {
          setInput((prev) => {
            if (!prev.trim()) {
              return request;
            }
            return `${prev} ${request}`;
          });
        }}
        className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {request}
      </button>
    ))}
  </div>
)}
```

### 2. Изменено поведение pills на добавление текста (append)

**До:** Клик на pill полностью заменял содержимое input (`setInput(request)`).

**После:** Клик на pill добавляет текст в input:
- Если input пуст → устанавливает text = request
- Если input не пуст → добавляет с разделителем (пробел): `${prev} ${request}`

**Где изменено:**
1. **Новые pills ниже имени режима** (строки 1124–1130): основная реализация
2. **Pills ниже истории сообщений в основной части** (строки 1309–1316): обновлены на консистентное поведение
3. **Pills в ReaderPanel** (строки 652–658): обновлены на консистентное поведение

### 3. Стилизация pills

**Новые pills (ниже имени режима):**
- Background: `bg-zinc-100` (light) / `dark:bg-zinc-800` (dark) — более видимый
- Text: `text-zinc-700` (light) / `dark:text-zinc-300` (dark)
- Hover: `hover:bg-zinc-200` (light) / `dark:hover:bg-zinc-700` (dark)
- Скругленные: `rounded-full`
- Размер: `px-2.5 py-1`, `text-xs`

**Существующие pills (ниже истории):**
- Сохранены текущие стили (без background) для визуального разделения
- Выполняют ту же функцию (append), но визуально отличаются

### 4. Условное отображение

Pills отображаются только если:
```typescript
selectedTypicalRequests.length > 0
```

Если typicalRequests пусты или не загружены — pills не показываются (нет пустого контейнера).

---

## Соответствие Scope

✓ **Allowed path:** Только `apps/studio/src/components/AssistantPanel.tsx` (изменена)

✓ **Forbidden paths:** Не трогали:
- `apps/studio/src/app/api/assistant-settings/**` (API не изменен)
- `apps/studio/prisma/**` (schema не изменен)
- Новые компоненты не создавались

---

## Validation

### 1. TypeScript компиляция

```
✓ npx tsc --noEmit
```

Результат: **PASS** (нет новых ошибок в AssistantPanel.tsx)

Примечание: Существуют pre-existing ошибки в других файлах (assistantSettingsRepository.ts и др.), но они не связаны с этим Step Card.

### 2. ESLint

```
✓ npx eslint src/components/AssistantPanel.tsx
```

Результат: **PASS** (нет ошибок и предупреждений)

### 3. Prettier

```
✓ npx prettier --check src/components/AssistantPanel.tsx
```

Результат: **PASS** после автоматического исправления форматирования.

### 4. Функциональное поведение (код)

#### Сценарий: Критик (Critic mode)

1. **Загрузка:**
   - `assistantSettings.critic.typicalRequests` загружаются через `getAssistantSettings()` в `useEffect` (уже реализовано)
   - Для Критика обычно это: `[Связность, Достоверность, Развитие, Стиль]`
   - Pills появляются ниже "⚔️ Критик" как отдельные кнопки

2. **Клик на pill:**
   - Пример: Click "[Связность]"
   - Input был пуст → заполняется "Связность"
   - Input имел "проверь" → становится "проверь Связность"

3. **Отправка:**
   - Текст input вместе с pill text отправляется в AI как запрос
   - Critic работает как раньше (CRITIC_SUBCATEGORIES остаются для фильтрации)

#### Сценарий: Соавтор (Coauthor mode)

1. **Загрузка:**
   - `assistantSettings.coauthor.typicalRequests` (например: `[Продолжи сцену, Добавь диалог, Разбей на параграфы]`)
   - Pills появляются ниже "✍️ Соавтор"

2. **Клик на pill:**
   - Append behavior: "Продолжи сцену" добавляется в input
   - Если input не пуст: "развивай" → "развивай Продолжи сцену"

#### Сценарий: Читатель (Reader mode)

1. **Загрузка:**
   - `typicalRequests` передаются в `ReaderPanel` как prop
   - Pills отображаются выше textarea

2. **Клик на pill:**
   - Append behavior работает, как в других режимах

#### Edge cases

✓ **Empty typicalRequests:** Pills не показываются (нет контейнера)

✓ **typicalRequests не загружены:** Pills ничего не отображают (condition не выполняется)

✓ **Дублирование текста:** Не обработано на уровне UI (пользователь может сам дублировать, если хочет). Это ожидаемое поведение.

### 5. Live-verification (структурный анализ кода)

**Три места отображения pills:**

| Место | Линии | Поведение | Стиль |
|-------|-------|-----------|-------|
| Новый: ниже имени режима | 1116–1138 | Append | `bg-zinc-100` (видимый) |
| Существующий: в основной части | 1304–1323 | Append | Без background (старый стиль) |
| ReaderPanel | 647–665 | Append | Без background (старый стиль) |

**Проверка append логики:**

```javascript
onClick={() => {
  setInput((prev) => {
    if (!prev.trim()) {
      return request;  // empty input → set to request
    }
    return `${prev} ${request}`;  // non-empty → append with space
  });
}}
```

Все три места используют одинаковую логику ✓

---

## Отклонения от Step Card

**Нет значимых отклонений.**

Дополнительные решения, принятые в ходе реализации:

1. **Сохранены pills ниже истории сообщений:** Step Card не просит их удалять, поэтому оставлены для обратной совместимости. Новые pills ниже имени режима обеспечивают лучшую дискаверабилити (discovery).

2. **Стиль новых pills с фоном:** Новые pills имеют видимый фон (`bg-zinc-100/dark:bg-zinc-800`), чтобы визуально отличаться от старых pills и лучше соответствовать примеру в Step Card ("компактный серо-голубой фон").

3. **Пробел как разделитель:** Используется пробел как разделитель при append. Step Card говорит "разделитель (пробел/точка перед ним)" — выбран пробел как наиболее универсальный.

---

## Stop Condition

✓ **Не закоммичено** (ждет `STATUS: OK` от Product Owner или Architect)

Все изменения находятся в `git status`:
```
 M apps/studio/src/components/AssistantPanel.tsx
```

---

## Резюме

Реализована функция отображения типовых запросов (`typicalRequests`) как кликабельных pills непосредственно ниже имени текущего режима помощника в AssistantPanel. Pills используют механизм добавления текста в input (append), что позволяет пользователю комбинировать preset-запросы с собственным текстом.

Все проверки валидации пройдены (TypeScript, ESLint, Prettier). Функциональность готова к тестированию и деплою.
