id: Add-Roadmap-And-Final-Vision-Notes-ARP
name: "ARP: Roadmap-документ (переименован) + 4 новых раздела в vision-документе"
type: arp

## Что сделано

- **`docs/vision/SPRINT_ROADMAP.md`** — новый файл, содержимое дословно по Step Card (таблица
  спринтов 13-42), **без** добавленных пояснений — по прямому указанию из
  `docs/task-bus/queue/active/REVIEW.md` ("Roadmap conflict"), см. ниже.
- **`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`** — добавлены 4 раздела в конец, дословно по
  Step Card: 16 (Anti-AI детекция), 17 (Сохранение авторского стиля), 18 (Контекст для серий
  книг), 19 (Версионирование правок). Ничего существующее не изменено.

## Конфликт имени файла и его разрешение (важно для истории)

Step Card просил создать `docs/vision/ROADMAP.md`. При проверке до реализации обнаружил, что
`docs/vision/roadmap.md` (нижний регистр) уже существует — это живой, активно используемый
документ Sprint 03 (укрупнённые фазы MVP → Persistence & Orchestration → Platform), на который
ссылаются `README.md`, `PROJECT_CHARTER.md`, `docs/project/BACKLOG.md`, `ADR-0003`,
`docs/vision/ideas.md`. На Windows (файловая система нечувствительна к регистру) `ROADMAP.md` и
`roadmap.md` — физически один и тот же файл; создание "нового" файла с таким именем либо
перезаписало бы старый, либо создало бы неоднозначное case-only состояние в git.

Не стал предполагать намерение — остановился и вынес вопрос Product Owner'у напрямую (см. диалог
в чате). Ответ: дать новому файлу другое имя, старый `roadmap.md` не трогать. Product Owner
(в роли Architect) параллельно тоже разрешил этот же конфликт письменно в
`docs/task-bus/queue/active/REVIEW.md` — оба решения совпали: **`docs/vision/SPRINT_ROADMAP.md`**,
содержимое — дословно по Step Card, `roadmap.md` не тронут ни содержимо, ни ссылками на него.

Из этого REVIEW.md также взято явное указание "дословно, без изменений" — мой первый черновик
`SPRINT_ROADMAP.md` содержал добавленный от себя раздел, поясняющий отношение к старому
`roadmap.md`; убран, чтобы строго соответствовать этому указанию. Пояснение оставлено здесь, в
ARP, а не в самом vision-документе.

## Соответствие Scope

- Изменённые/созданные файлы: `docs/vision/SPRINT_ROADMAP.md` (создан, вместо `ROADMAP.md` —
  см. выше), `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` (добавление в конец).
- Оба — в пределах Allowed paths карточки (`docs/vision/ROADMAP.md` / `BOOK_LEVEL_ASSISTANTS_VISION.md`),
  с единственной поправкой имени файла, согласованной отдельно.
- Ничего существующее не изменено (в `BOOK_LEVEL_ASSISTANTS_VISION.md` — только добавление в
  конец; `roadmap.md` не тронут вовсе).

## Validation

- `grep -c "Anti-AI детекция|авторского стиля" docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` → 2
  совпадения суммарно (по одному на каждую фразу, оба искомых раздела присутствуют).
- `ls docs/vision/SPRINT_ROADMAP.md` → существует.
- `git status --short` — только `SPRINT_ROADMAP.md` (новый) и `BOOK_LEVEL_ASSISTANTS_VISION.md`
  (изменён) из содержательных файлов; остальное — сама очередь задач.

## Отклонения от Step Card

Одно, явно согласованное заранее (см. выше): имя файла `docs/vision/ROADMAP.md` →
`docs/vision/SPRINT_ROADMAP.md`. Содержимое обоих файлов — без отклонений, дословно.

## Stop Condition

Не закоммичено — жду `STATUS: OK` от Architect.
