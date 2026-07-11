id: Sprint-29-Step-06
name: "UI + Live Verification: NewSeriesDialog, Sidebar series tree, SeriesEditDialog, page.tsx интеграция"
type: implementation

## Контекст

Step-05 завершила Workspace Controller. Step-06 строит UI для работы с Series и проводит
live-верификацию всей цепочки (Step-01 через Step-05):

- NewSeriesDialog: диалог создания новой series
- Sidebar расширяется: Series список с раскрывающимся деревом Books в каждой Series
- SeriesEditDialog: переименование/описание series
- page.tsx: интеграция контроллера в UI
- Drag-drop Book в Series (опциональное, зависит от Product Owner)

## Scope

Allowed paths:
- apps/studio/src/components/NewSeriesDialog.tsx (новый компонент)
- apps/studio/src/components/SeriesEditDialog.tsx (новый компонент)
- apps/studio/src/components/Sidebar.tsx (расширить series секцией)
- apps/studio/src/app/page.tsx (добавить вызовы новых методов контроллера)

Может также потребоваться:
- apps/studio/src/components/EditorArea.tsx (если требуется показывать текущую series)
- Tailwind новых стилей (normal, в scope)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/workspace/useWorkspaceController.ts (это был Step-05)
- apps/studio/src/domain/model.ts (это был Step-05)
- apps/studio/src/app/api/series/route.ts (это был Step-04)
- apps/studio/src/repositories/** (это был Step-03)
- apps/studio/prisma/schema.prisma (это был Step-02)

## Rules

1. **NewSeriesDialog компонент:**
   - Form с полями:
     - Title (string, обязательное, валидация: не пусто)
     - Description (textarea, опциональное)
   - Кнопки: Cancel, Create
   - Вызов onCreateSeries(title, description) при Create
   - Закрытие диалога после успешного создания
   - Обработка ошибок: показать error toast или inline сообщение

2. **SeriesEditDialog компонент:**
   - Похож на NewSeriesDialog, но:
   - Заголовок: "Редактировать серию" вместо "Создать серию"
   - Поля заполнены текущими значениями series
   - Кнопка: Save (не Create)
   - Вызов onUpdateSeries(seriesId, title, description)
   - Опциональная кнопка Delete с подтверждением

3. **Sidebar расширяется:**
   - Новая секция "Серии" (h3-заголовок, как "Книги", "Персонажи")
   - Кнопка "+" рядом с заголовком — открывает NewSeriesDialog
   - Список series, каждая series:
     - Название series как кликабельный элемент (может открыть SeriesEditDialog при двойном клике или gear-кнопке)
     - Раскрывающееся дерево: вложенные Books в этой series
     - Books, которые НЕ в series, отображаются отдельно (в своей "ungrouped" или просто после серий)
   - Drag-drop Book в Series (опциональное — решает Product Owner в этом step's живой проверке)

4. **page.tsx интеграция:**
   - Получить из контроллера методы: createSeries, updateSeries, deleteSeries, addBookToSeries, removeBookFromSeries
   - Передать их соответствующим компонентам (Sidebar, dialogs)
   - Обновить state при успешном создании/обновлении series
   - На ошибку: показать SyncWarningBanner или toast (уже есть механизм из Sprint-24)

5. **UI стиль:**
   - Согласованность с существующими диалогами (NewBookDialog как reference)
   - Иконки вместо эмодзи (как в Sprint-25 Step-05 ui-specialist pass)
   - Tailwind классы, darkMode поддержка

## Validation — ОБЯЗАТЕЛЬНО Live Verification

**Это критично:** не просто `npm run build`, а реальный `npm run dev` с браузером и взаимодействием.
Следуйте literary-studio-live-verify skill.

1. **`npm run dev` — запустить реальный dev-сервер на localhost:3000:**

2. **Скриншоты или Playwright-проверки (innerText/screenshot):**
   - Sidebar видна, есть секция "Серии"
   - Кнопка "+" рядом с "Серии" видна и кликабельна
   - Клик на "+" открывает NewSeriesDialog
   - Ввод названия серии и клик Create:
     * Диалог закрывается
     * Новая series появляется в Sidebar под "Серии"
   - Клик на series в Sidebar раскрывает дерево Books (если в серии есть книги)
   - Двойной клик (или gear) на series открывает SeriesEditDialog:
     * Поля заполнены текущими значениями
     * Редактирование названия и сохранение работает
     * Series обновляется в Sidebar
   - Drag-drop Book в Series (если реализовано):
     * Book перемещается под series в tree
     * При перезагрузке Book остаётся в series (persisted)
   - Удаление series (через SeriesEditDialog Delete или Sidebar context-menu):
     * Series исчезает из Sidebar
     * Books, которые были в ней, перемещаются обратно в ungrouped
   - Перезагрузка страницы (F5):
     * Все series и их books загружаются с БД
     * Структура совпадает с сохранённой

3. **Типизированные проверки (как в Sprint-24-Step-06 SyncWarningBanner):**
   - Нет JavaScript-ошибок в консоли браузера
   - Все async операции завершаются (no pending promises)
   - localStorage не используется для series (только БД)

4. **Команды из apps/studio/:**
   - `npx tsc --noEmit` — чисто (после всех изменений)
   - `npx eslint src/components/{NewSeriesDialog,SeriesEditDialog,Sidebar}.tsx src/app/page.tsx` — чисто
   - `npx prettier --check ...` — чисто

5. **`git status --short`:**
   ```
   M  apps/studio/src/app/page.tsx
   M  apps/studio/src/components/Sidebar.tsx
   ?? apps/studio/src/components/NewSeriesDialog.tsx
   ?? apps/studio/src/components/SeriesEditDialog.tsx
   [возможно] M  apps/studio/src/components/EditorArea.tsx (если потребовалось)
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:

1. **Полный текст компонентов:**
   - NewSeriesDialog.tsx (форма + логика)
   - SeriesEditDialog.tsx (форма + логика)
   - Дельта Sidebar.tsx (только новую "Серии" секцию)

2. **Screenshots или Playwright innerText-тесты:**
   - Sidebar с "Серии" и "+" кнопкой видна
   - NewSeriesDialog открывается и работает (создание, закрытие)
   - SeriesEditDialog работает (редактирование, сохранение)
   - Series в Sidebar отображается и раскрывается (если есть Books)
   - Перезагрузка страницы сохраняет series (через БД)
   - Скриншот финального состояния Sidebar с несколькими series и books

3. **Результаты tsc/eslint/prettier** — все чисто

4. **Результат `git status --short`**

5. **Краткое резюме:**
   - Какие компоненты добавлены
   - Какие компоненты обновлены
   - Работает ли drag-drop (если реализовано)
   - Все ошибки или unexpected findings во время live-проверки

## Stop Condition

Не коммитить без подтверждения Product Owner.

