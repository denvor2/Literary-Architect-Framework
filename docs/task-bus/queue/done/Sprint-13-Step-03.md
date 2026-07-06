id: Sprint-13-Step-03
name: "AI Bus (код): операции получают messages + переименование text/currentText в sceneText"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/ai/operations.ts
- apps/studio/src/ai/aiBus.ts

Forbidden paths:
- apps/studio/src/app/api/** (все четыре готовы, не трогай)
- любой UI-код (ожидаемо сломается по типам — это Step 04, опиши
  ошибки явно в ARP, как делалось для аналогичных ситуаций в
  Sprint 11/12/13)

## Objective

Привести AIOperation в соответствие с новой формой backend-запросов
(Sprint-13-Step-02): единое поле `sceneText` вместо разрозненных
`text`/`currentText`, плюс обязательное `messages` для всех
четырёх операций.

### operations.ts

```typescript
import type { Book, ChatMessage } from "@/domain/model";

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        bookContext?: Book;
        messages: ChatMessage[];
      };
    }
  | {
      type: "critic_review";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        messages: ChatMessage[];
      };
    }
  | {
      type: "reader_reaction";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        messages: ChatMessage[];
      };
    }
  | {
      type: "coauthor_draft";
      payload: {
        sceneText: string;
        bookContext: Book;
        messages: ChatMessage[];
      };
    };
```

(critic_review/reader_reaction — по-прежнему без bookContext,
согласно таблице контекстов — только добавляется messages и
переименование text → sceneText, ничего больше).

### aiBus.ts

Обновить все четыре ветки роутинга: тело запроса к каждому route.ts
теперь включает `sceneText`, `messages`, и `bookContext` (там, где
применимо — improve_text/coauthor_draft), с новыми именами полей.
Ответ (`{ ok: true, result: string }`) идёт в `resultText` так же,
как раньше — критично: **улучшение** обработки critic_review
(JSON.stringify(data.reviews)) не меняй, оно не связано с этим шагом.

Обновить exhaustiveness-check — по-прежнему четыре варианта, просто
payload изменился.

## Rules

- Не трогай ни один route.ts — все уже готовы (Step 02).
- Не трогай UI — ожидаемые ошибки компиляции в Forbidden paths,
  опиши явно.
- messages — обязательное поле во всех четырёх (не опциональное) —
  вызывающий код должен явно передавать хотя бы пустой массив.

## Validation

- npx tsc --noEmit — ожидаются ошибки ТОЛЬКО в Forbidden paths
  (EditorArea.tsx, использующий старые имена полей) — опиши их
  явно, Allowed paths должны компилироваться внутренне
  непротиворечиво.
- npm run lint на изменённых файлах — чисто.
- Живая проверка: aiBus.execute() для каждой из четырёх операций с
  реалистичным messages (2-3 реплики) доходит до соответствующего
  route.ts с правильными именами полей в теле запроса; ответ
  учитывает историю (как уже проверено на уровне route.ts в Step 02
  — здесь достаточно подтвердить, что aiBus.ts правильно
  прокидывает данные, не нужно заново доказывать, что backend
  "помнит" историю).
- grep -c "messages" operations.ts / aiBus.ts — оба > 0.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
