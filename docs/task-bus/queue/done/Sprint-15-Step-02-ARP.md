id: Sprint-15-Step-02-ARP
name: "ARP: аудит и перевод оставшегося английского UI-текста"
type: arp

## Что сделано

Инвентаризация (grep по всем компонентам + `app/`) нашла оставшийся английский текст в 10
файлах — переведено всё, кроме сознательно исключённого (см. Step Card: `AssistantMode`-ключи,
`GENRES`/`LANGUAGES` данные, `category ?? "General"` enum-фолбэк, `"Literary Studio"`/
`"An AI-powered IDE for writers."` — оба зафиксированы в `HANDOVER.md`'s Preferred terminology,
сырые `err.message`).

Кратко по файлам:
- **`AssistantPanel.tsx`** — лейблы ролей ("Co-author"→"Соавтор", "Editor"→"Редактор",
  "Critic"→"Критик", "Reader"→"Читатель") + их описания; "No issues found."→"Замечаний не
  найдено."; "Create your first book to talk to an assistant."→"Создайте первую книгу, чтобы
  поговорить с помощником."; "Assistant unavailable. Try again."→"Помощник недоступен.
  Попробуйте ещё раз." (оба места).
- **`EditorArea.tsx`** — все placeholder'ы, "Exit Focus"→"Выйти из фокуса", счётчик
  "Words:/Characters:"→"Слов:/Символов:", "No scenes yet"/"No chapters yet"→"Пока нет
  сцен"/"Пока нет глав", "New Scene"→"Новая сцена", "Chapters"→"Главы".
- **`NewBookDialog.tsx`** — заголовок, все лейблы формы, "Cancel"→"Отмена", "Create
  Book"→"Создать книгу". `GENRES`/`LANGUAGES` — не тронуты (см. исключения).
- **`CharacterPanel.tsx`** — "Select a character"→"Выберите персонажа", "Untitled
  Character"→"Безымянный персонаж", лейблы (Name/Photo URL/Description/Notes), placeholder'ы.
  Уже русские строки ("Удалить персонажа" и т.п.) не тронуты.
- **`Sidebar.tsx`** — все заголовки разделов, кнопки "+ New X", пустые состояния ("No X yet"),
  фолбэки "Untitled Book"/"Untitled Character"→"Без названия"/"Без имени".
- **`Header.tsx`** — "Untitled Book"→"Без названия". "Literary Studio" не тронут (название
  продукта).
- **`DeveloperTools.tsx`**, **`LineEditorPanel.tsx`**, **`TestConnectionButton.tsx`** —
  dev-only инструменты за раскрывающейся панелью, но всё ещё видимый пользователю текст,
  переведены для полной консистентности (низкий риск, низкая цена).
- **`app/layout.tsx`** — только `<html lang="en">`→`lang="ru"` (интерфейс теперь по умолчанию
  на русском — прежнее значение было буквально некорректным для accessibility/screen-readers).
  `title`/`description` (metadata) не тронуты.

## Соответствие Scope

Изменены ровно 10 файлов из Allowed paths (`git status --short` подтверждает). Логика нигде не
менялась — только текстовые литералы.

## Validation

- **`npx tsc --noEmit`**, **`npx eslint`**, **`npx prettier --check`** — чисто (после
  `--write` для `LineEditorPanel.tsx`).
- **`npm run build`** — успешно.
- **Живая проверка** — `npm run dev` (тот же процесс, что уже открыт для Product Owner на
  `localhost:3000`, подхватил изменения через hot reload) + `curl` реального отрендеренного
  HTML: `lang="ru"` подтверждён; ни одна строка из инвентаризации Step Card (`Create your first
  book`, `Untitled Book`, `No books/chapters/characters yet`, `New Book/Chapter/Scene/
  Character`, `Book Title`, `Enter a title`, `Premise / Idea`, `Developer Tools`, `Test Claude
  Connection`, `Line Edit`, placeholder'ы CharacterPanel/EditorArea и т.д.) не найдена в
  выводе; тексты пустого состояния ("Пока нет книг", "Создайте первую книгу...") реально
  отрендерились по-русски. Остальные переведённые строки (лейблы ролей, кнопки формы книги,
  плейсхолдеры сцены/главы/персонажа) появляются только при созданной книге/сцене/персонаже —
  не воспроизводимо через `curl` без реального взаимодействия с `localStorage`, подтверждены
  прямым чтением файла после правки (нет браузерной автоматизации в этой среде — постоянное,
  задокументированное ограничение).

## Отклонения от Step Card

Нет.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner.
