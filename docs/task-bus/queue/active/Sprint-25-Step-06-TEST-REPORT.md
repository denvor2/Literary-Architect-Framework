# TEST-REPORT: Sprint-25-Step-06

Независимая функциональная перепроверка (роль `tester`) ARP по глобальному поиску в шапке
приложения (`apps/studio`). ARP заявляет 14/14 (Shape 2) и 21/21 (Shape 1, живой Playwright).
Ниже — результаты **собственной** перепроверки, с собственными фикстурами, собственным
scratch-сервером (порт 3418, не 3417 из ARP) и собственными дополнительными edge-кейсами.

## STATUS: PASS

## 1. Что проверялось и как

Прочитаны целиком: Step Card (`docs/task-bus/queue/active/Sprint-25-Step-06.md`) и ARP
(`...-ARP.md`), а также реальный код: `apps/studio/src/domain/search.ts`,
`apps/studio/src/components/Header.tsx`, изменения в `apps/studio/src/app/page.tsx`
(`handleSelectSearchMatch`, `handleSelectIdeaMatch`, `scrollElementIntoView`) и
`apps/studio/src/components/IdeasPanel.tsx` (`id={idea-block-${idea.id}}`).

## 2. Статическая валидация (перепрогнана самостоятельно из `apps/studio/`)

- `npx tsc --noEmit` — чисто (без вывода, код 0).
- `npx eslint src/domain/search.ts src/components/Header.tsx src/app/page.tsx
  src/components/IdeasPanel.tsx` — чисто.
- `npx prettier --check` по тем же файлам — `All matched files use Prettier code style!`.
- `npm run build` — успешная продакшен-сборка (`✓ Compiled successfully`, все страницы/роуты,
  включая `/api/workspace`, собраны).
- `git status --short` — затронуты ровно файлы из Allowed paths (`domain/search.ts` новый,
  `Header.tsx`, `page.tsx`, `IdeasPanel.tsx` изменены, перенос карточки `pending/ → active/`) —
  соответствует Scope карточки.

Совпадает с тем, что заявляет ARP — подтверждено самостоятельным прогоном, не на слово.

## 3. Shape 2 — чистая функция `searchWorkspace` (собственные фикстуры, НЕ фикстуры ARP)

Node-скрипт в scratchpad, тело `searchWorkspace`/`includesQuery`/`makeSnippet` скопировано
дословно из реального `domain/search.ts` (типы убраны). Фикстуры — свои: 3 книги («Пепел и
снег» активная, «Тайна старого маяка», «Пустая книга»), 2 главы (одна с двумя сценами и
дракон-сюжетом, вторая без сцен), 2 персонажа (один с пустыми description/notes — специально
для проверки отсутствия краша), 2 идеи.

Результат: **21/21 PASS** (мой собственный набор кейсов, отличный от 14 у ARP):

```
PASS: Scene.text match (sc-1-1 'Дракон пролетел...')
PASS: Chapter.title match ('Глава про дракона')
PASS: Chapter.subtitle match ('Начало долгого пути')
PASS: Book.title match (other book, not active)
PASS: Book.title match on the ACTIVE book too
PASS: Character.name match (case-insensitive)
PASS: Character.description match with snippet
PASS: Character.notes match
PASS: Idea.text match
PASS: Case-insensitive query (upper-case ДРАКОН)
PASS: mainTextOnly=true strictly narrows to Scene.text only (drops Chapter.title/Character.name/Idea matches on the SAME query)
PASS: mainTextOnly=false restores Chapter.title + Character.name + Idea matches
PASS: 1-char query returns EMPTY_RESULTS shape
PASS: Whitespace-only query (trim -> 0 chars) returns empty
PASS: Padded 2-char query ('  др  ') still matches after trim
PASS: Empty string query returns empty
PASS: Empty books[] input: no crash, books=[]
PASS: Active book with zero chapters/characters/ideas: only Book.title results possible, no crash
PASS: Character with empty description/notes matches by name only, snippet undefined
PASS: No-match query returns fully empty sections (not undefined/crash)
PASS: Snippet for a match deep in long text has leading ellipsis
=== TOTAL: 21 PASS, 0 FAIL (21 cases) ===
```

Дополнительно к кейсам ARP я проверил: строку только из пробелов, паддинг вокруг 2-символьного
запроса, книгу без глав/персонажей/идей как активную, персонажа с пустыми description/notes
(снова — без краша, сниппет `undefined`, а не пустая строка), и корректность многоточия
(`…`) в сниппете при совпадении в глубине длинного текста. Логика поиска подтверждена
независимо, расхождений с кодом не найдено.

## 4. Shape 1 — живой браузер (собственный scratch-сервер, собственные фикстуры)

**Безопасность БД (обязательное условие).** Сервер запускался с намеренно недоступным
`DATABASE_URL="postgresql://invalid:invalid@127.0.0.1:1/nonexistent"` на порту **3418**
(сознательно другой порт, чем 3417 у ARP — чтобы не унаследовать состояние ARP-сессии).
До и после всей проверки:

```
curl http://127.0.0.1:3418/api/workspace
{"ok":false,"error":"\nInvalid `prisma.user.findFirst()` invocation:\n\nCan't reach database server at 127.0.0.1:1"}
```

— подтверждено, что dual-mode (ADR-0012) откатился на localStorage-only, реальная локальная БД
Product Owner (`127.0.0.1:5432` в `apps/studio/.env`) не была задействована ни разу за всю
сессию. Порт `3000` (судя по всему — рабочий dev-сервер Product Owner) не трогался вообще.

**Собственный Playwright-скрипт** (`chromium.launch({channel:"chrome"})`, реальный Chrome),
собственные названия книг/глав/персонажа/идеи — намеренно другие, чем в фикстурах ARP («Сад
камней» / «Маяк на мысе Бурь», глава «Горькая полынь» и т.д.), плюс собственная конструкция для
изоляции `mainTextOnly` (запрос `"полын"`, совпадающий ОДНОВРЕМЕННО с `Chapter.title` «Горькая
полынь» И с `Scene.text` «Запах полыни…» — жёсткая проверка, что чекбокс режет по полю, а не
по случайности данных).

Результат: **33/33 PASS** (мои собственные 32 сценария + отдельный тест на Ctrl+K = 2, один из
них дублирует общий счётчик — см. вывод ниже и отдельный запуск шортката):

```
PASS: Запрос короче 2 символов не открывает список результатов
PASS: Раздел 'Главы и сцены' появился для запроса 'жаворонок'
PASS: Найден результат со сниппетом 'жаворонок'
PASS: Клик по результату сцены скроллит к scene-block (textarea в viewport)
PASS: Клик по результату закрывает выпадающий список
PASS: Результат для 'виноград' (внутри свёрнутой главы) найден в дропдауне
PASS: Свёрнутая глава автоматически разворачивается при клике по результату внутри неё
PASS: После разворота глава доскроллена в viewport
PASS: Результат 'Марта' найден для запроса 'садовница' (описание персонажа)
PASS: Клик по результату-персонажу переключает на CharacterPanel с 'Марта'
PASS: Результат для 'летопись' найден в разделе 'Идеи и заметки'
PASS: (обычный вид) Клик по результату-заметке скроллит к idea-block
PASS: Focus Mode включён: Sidebar скрыт
PASS: (Focus Mode) Результат 'летопись' всё ещё виден в дропдауне
PASS: Клик по результату-заметке при включённом Focus Mode автоматически выключает Focus Mode (Sidebar снова виден)
PASS: После выхода из Focus Mode скролл всё равно долистывает до заметки
PASS: Результат 'Маяк на мысе Бурь' найден в разделе 'Книги'
PASS: Клик по результату-книге переключает активную книгу
PASS: Чекбокс выключен (по умолчанию): видны И совпадение в Chapter.title, И в Scene.text
PASS: Чекбокс 'только основной текст' ВЫКЛЮЧЕН по умолчанию
PASS: Чекбокс включён: Chapter.title-совпадение ('Горькая полынь') скрыто
PASS: Чекбокс включён: Scene.text-совпадение ('...полыни...') всё ещё видно
PASS: После снятия чекбокса оба совпадения снова видны
PASS: Escape закрывает выпадающий список
PASS: Клик вне формы поиска закрывает выпадающий список
PASS: EDGE: очистка поля после непустого запроса закрывает список (не 'Ничего не найдено' на пустой строке)
PASS: EDGE: быстрый двойной клик по результату не бросает ошибку в консоли/скрипте
PASS: Кнопка 'RU' реально задизейблена (disabled атрибут)
PASS: Кнопка 'Войти' реально задизейблена (disabled атрибут)
PASS: Плейсхолдеры Файл/Правка/Вид не сломаны (видны)
PASS: Dark mode: Header виден
PASS: Dark mode: результаты поиска отображаются ('Главы и сцены' видна)
PASS: Dark mode: чекбокс 'только основной текст' виден
=== TOTAL: 33 PASS, 0 FAIL (33 cases) ===
```

Отдельным прогоном — шорткат Ctrl+K (заявлен в ARP как реализованный, п.4 Output-требования):

```
PASS: До Ctrl+K поле поиска не в фокусе
PASS: Ctrl+K переводит фокус на поле поиска
=== TOTAL: 2 PASS, 0 FAIL ===
```

### Что проверено сверх набора кейсов ARP (собственные edge-кейсы тестера)

- Строка только из пробелов и запрос, обрезающийся до <2 символов после `trim()` — список не
  открывается (Shape 2 и Shape 1 согласованно).
- Быстрая очистка поля после непустого запроса — список закрывается, а не показывает «Ничего не
  найдено» на пустой строке (проверял отдельно от Escape/клика вне формы).
- Быстрый двойной клик по одному и тому же результату — не бросает исключение и не оставляет
  список в противоречивом состоянии.
- **Тёмная тема** — не переключением на новый `browser.newContext()` (это дало бы пустой
  localStorage и ложный fail — я сначала так и сделал, поймал и исправил на `page.emulateMedia`
  в той же сессии с реальными данными), а на той же странице с уже созданными книгой/главами/
  персонажем/идеей: Header, дропдаун результатов и чекбокс отображаются корректно в dark mode.
- Реально задизейблены (`disabled`-атрибут, не только визуально) кнопки RU/«Войти» — проверено
  через `isDisabled()`, а не только `isVisible()`.
- Персонаж с пустыми `description`/`notes` — совпадение только по имени, без краша сниппета
  (Shape 2).

### Гонка рендера (развилки 9, 12 карточки) и одинарный `requestAnimationFrame`

Оба живых сценария, ради которых карточка требовала аккуратности с рендер-гонкой —
(а) клик по результату внутри свёрнутой главы (разворот + скролл) и (б) клик по
результату-заметке при включённом Focus Mode (выключение Focus Mode + скролл в Sidebar,
который до этого не существовал в DOM) — сработали надёжно с тем единственным
`requestAnimationFrame`, что реализован в коде (`page.tsx`, `handleSelectSearchMatch`/
`handleSelectIdeaMatch`). Двойной `rAF` не потребовался и в моей независимой проверке —
согласуется с тем, что заявляет ARP.

## 5. Очистка после себя

- Scratch-сервер на порту 3418 остановлен (`taskkill`), порт подтверждён свободным
  (`netstat` — пусто, `curl` — connection refused/timeout).
- `/api/workspace` был недоступен (невалидный `DATABASE_URL`) на протяжении всей сессии — до и
  после проверки возвращал одну и ту же ошибку `Can't reach database server at 127.0.0.1:1`,
  то есть реальная локальная БД Product Owner физически не могла быть задета этой сессией.
  Порт 3000 (вероятный dev-сервер Product Owner) не запускался/не останавливался/не
  опрашивался вообще.
- `git status --short` после всей проверки — не изменился относительно состояния до начала
  работы (только файлы из Allowed paths карточки + чужой `Sprint-25-Step-06-REVIEW.md`,
  очевидно от параллельной работы `architect-reviewer`, не от этой сессии).
- Никакие файлы Step Card/ARP/исходники не редактировались; коммитов не делалось.

## 6. Вывод

Все заявленные в ARP механики независимо переиграны на свежем сервере с собственными
фикстурами, отличными от executor-ских, включая намеренно жёсткий кейс пересечения
`mainTextOnly` (один и тот же запрос одновременно бьёт по `Chapter.title` и `Scene.text`) и
дополнительные edge-кейсы, которых не было в Validation-разделе карточки (пробельный запрос,
быстрая очистка поля, двойной клик, тёмная тема на реальных данных, фактическая
задизейбленность плейсхолдеров). Расхождений между кодом, ARP и живым поведением не найдено.

**STATUS: PASS**
