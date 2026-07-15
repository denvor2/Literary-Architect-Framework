id: Sprint-33-Step-06
name: "Помощники: отображение типовых запросов как pills рядом с именем режима"
type: implementation

## Контекст

Sprint 25 Step 03 добавила typicalRequests в AssistantSettings (ADR-0013):
- Stored в БД: `AssistantSettings.typicalRequests: string[]`
- Configurable в settings dialog через gear-icon
- Уже загружаются и показываются в preview внутри settings dialog

Но для обычного пользователя typicalRequests НЕ видны. Они только в админской части (settings).

Sprint 33 должна показывать these как pills (кнопки-подсказки) рядом/ниже имени режима 
в AssistantPanel — чтобы пользователь видел, какие "типовые запросы" предложены для каждого режима.

## Scope

### Allowed paths (ТОЛЬКО):

- apps/studio/src/components/AssistantPanel.tsx (добавить отображение typicalRequests как pills)

### Forbidden paths:

- apps/studio/src/app/api/assistant-settings/** (API уже done)
- apps/studio/prisma/** (schema уже done)
- Новые компоненты

## Objective

Добавить UI для отображения типовых запросов:

1. **Загрузка typicalRequests:**
   - Уже происходит через `getAssistantSettings()` в useEffect AssistantPanel
   - typicalRequests уже в `assistantSettings[mode].typicalRequests`

2. **Визуализация pills:**
   - Ниже имени режима (label) — добавить горизонтальный список pills
   - Каждый pill содержит текст одного typicalRequest
   - Стиль: серо-голубой фон, округлённый (border-radius), compact
   - Пример:
     ```
     ⚔️ Критик
     [Связность] [Достоверность] [Развитие] [Стиль]
     ```
     (для Critic это уже есть как CRITIC_SUBCATEGORIES)

     Для других режимов (coauthor/editor/reader):
     ```
     ✍️ Соавтор
     [Продолжи сцену] [Добавь диалог] [Разбей на параграфы]
     ```

3. **Интерактивность:**
   - Клик на pill → текст pills попадает в input поля чата
   - Input пополняется (не заменяется полностью)
   - Если input не пуст — текст добавляется с пробелом/точкой перед ним

4. **Условное отображение:**
   - Если typicalRequests пуста → pills не показываются (как и раньше)
   - Если типовые запросы есть → показать их

5. **Placement:**
   - На режимах выбора (иконки/карточки в левой части AssistantPanel)
   - Ниже названия режима, выше описания
   - Или: компактно рядом с названием (слева направо)
   - (PO может уточнить расположение)

## Rules

1. typicalRequests уже загружены в componentDidMount, не добавлять новые запросы
2. Клик на pill добавляет текст в `input` (текущее поле чата)
3. Если input уже содержит текст — добавить pill с пробелом-разделителем
4. Pills readonly — нельзя редактировать (редактирование только в settings)
5. Стиль pills должен отличаться от mode-selection карточек (не сливаться)

## Validation

Живая проверка в браузере:

1. **Загрузка:**
   - Выбрать режим "Соавтор" (или другой с типовыми запросами)
   - Под названием "Соавтор" видны pills с типовыми запросами (если были заданы в settings)

2. **Кликом на pill:**
   - Текст pill попадает в input чата
   - Если input был пуст → text равен pill text
   - Если input имел текст → pill text добавляется с разделителем

3. **Отправка запроса:**
   - Текст input (включая pill text) отправляется в AI как запрос

4. **Без типовых запросов:**
   - Если typicalRequests пуста → pills не показываются
   - Режим работает как раньше

5. **Настройка типовых запросов:**
   - В settings добавить новый typicalRequest
   - Refresh страницу → новый pill видна сразу

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншоты режимов с pills (Соавтор, Редактор, Критик, Читатель)
2. Скриншот клика на pill и добавления в input
3. Результат `npx tsc --noEmit`
4. Результат `npm run build`
5. Результат живой браузерной проверки (отображение, клик, отправка)

## Stop Condition

Не коммитить без подтверждения Product Owner.
