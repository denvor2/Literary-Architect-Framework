id: Sprint-24-Step-03
name: "Repository-слой: CRUD через Prisma для доменных сущностей"
type: implementation

## Контекст

По ADR-0012 (Sprint-24-Step-01): single-user локальная модель (нет реальной аутентификации),
"грубый" контракт (весь books[] целиком, не гранулярный REST по сущностям), глобально
уникальные id уже обеспечены Sprint-24-Step-02. Этот шаг — чисто серверный слой поверх
существующего Prisma client (apps/studio/src/lib/db.ts), без HTTP и без UI.

## Scope

Allowed paths:
- apps/studio/src/repositories/** (новая директория/файлы)

Forbidden paths:
- apps/studio/src/app/api/** (Sprint-24-Step-04 создаёт тонкую HTTP-обёртку над этим слоем,
  не сейчас)
- apps/studio/src/workspace/**, apps/studio/src/storage/** (подключение — Step 05-06)
- apps/studio/src/domain/** (используются существующие типы Book/Chapter/... как есть)
- любой UI-код

## Objective

Реализовать серверный repository-слой (использует import { prisma } from "@/lib/db" —
существующий singleton, не создавать второй Prisma client), экспортирующий минимум три
публичные функции, от которых зависит Sprint-24-Step-04:

1. getOrCreateDefaultUser(): Promise<User> — согласно ADR-0012: находит существующего
   пользователя (например, первого по createdAt) или создаёт нового, если таблица User
   пуста. Точная стратегия — как зафиксировано в принятом ADR-0012, реализовать буквально
   по нему (не изобретать заново в этом шаге).

2. loadBooksForUser(userId: string): Promise<Book[]> — читает все Book пользователя вместе
   со связанными Chapter/Scene/Character/Idea/AssistantThread/ChatMessage и собирает их
   обратно в форму Book из domain/model.ts, включая assistantThreads, сгруппированные по
   role (Prisma-модель AssistantThread хранит role как плоское поле на каждой строке —
   domain-форма группирует по нему в объект { coauthor: [...], editor: [...], critic: [...],
   reader: [...] }).

3. saveBooksForUser(userId: string, books: readonly Book[]): Promise<void> — принимает
   полное дерево books[] (та же "грубая" семантика, что и сегодняшний saveWorkspace()) и
   приводит состояние БД в соответствие: upsert каждой сущности по её id (глобально
   уникальны, см. Step 02), удаление строк, которых больше нет в переданном дереве.
   Выполнить в одной Prisma-транзакции (prisma.$transaction), чтобы частичная запись не
   оставляла БД в противоречивом состоянии.

Отображение полей, которые не совпадают 1:1:
- Domain ChatMessage — { role, content }, без id/createdAt/threadId. Prisma ChatMessage
  требует id/threadId/createdAt. При записи — дать Prisma сгенерировать id/createdAt по
  умолчанию; при чтении — обратно в domain-форму попадают только role и content, остальное
  отбрасывается (domain-слой никогда не оперирует message.id).
- AssistantThread.persona — Prisma String? (null при отсутствии) против domain persona?:
  string (undefined при отсутствии) — явно маппить null <-> undefined в обе стороны.

Внутреннюю организацию файлов (один workspaceRepository.ts или разбивка по сущностям
bookRepository.ts/chapterRepository.ts/... как в черновике дорожной карты) выбрать
самостоятельно — деталь реализации, важен только публичный контракт из трёх функций выше,
которым будет пользоваться Step 04.

## Rules

- Не создавать HTTP-маршруты — этот слой не знает про Request/Response, только про
  Prisma/domain-типы.
- Использовать существующий @/lib/db singleton, не открывать отдельное соединение.
- Discovery-реализация — без generic ORM-абстракций сверх того, что даёт сам Prisma
  (тот же принцип, что у остальных discovery-шагов проекта, например Sprint-08-Step-01).

## Validation

- npx tsc --noEmit, npm run lint, npx prettier --check на apps/studio/src/repositories/** —
  чисто. npm run build может падать из-за того, что этот слой ещё нигде не используется —
  описать явно в ARP, если так (прецедент — Sprint-13-Step-01).
- Живая проверка ПРОТИВ РЕАЛЬНОЙ БД (docker compose up postgres, как в Sprint 23): временный
  вызов (например, через npx tsx одноразовый скрипт в scratchpad, не оставлять в финальном
  diff) — создать пользователя, сохранить книгу с 2 главами по 2 сцены в каждой и
  непустыми assistantThreads/messages, прочитать обратно через loadBooksForUser, сверить
  результат совпадает 1:1 с тем, что было записано. Отдельно сохранить вторую книгу и
  убедиться, что глобально уникальные id из Step 02 не конфликтуют между книгами.
- psql \dt / prisma studio — подтвердить, что строки реально появились в таблицах (тот же
  приём живой проверки, что в Sprint 23 Step 03). Приложить реальный вывод в ARP, не мок.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
