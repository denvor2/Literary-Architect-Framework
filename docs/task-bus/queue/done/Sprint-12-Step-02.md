id: Sprint-12-Step-02
name: "/api/line-editor: добавить полный Book как контекст (для Editor)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/api/line-editor/route.ts

Forbidden paths:
- apps/studio/src/app/api/coauthor/route.ts (уже готов, не трогай)
- apps/studio/src/app/api/critic/route.ts, reader/route.ts
- apps/studio/src/ai/**
- любой UI-код

## Objective

Это изменение уже ратифицированного контракта (ADR-0004) — делаем
осознанно, зафиксируем пересмотром ADR-0004 в Step 05. По таблице
контекстов: Editor должен видеть книгу целиком, как и Co-author —
но его ЗАДАЧА не меняется (полировка грамматики/стиля переданного
текста, не переписывание сюжета) — контекст нужен для согласованности
(имена персонажей, ранее установленные факты), не для того, чтобы
Editor начал сочинять.

### Request — расширить, сохранив обратную совместимость

```typescript
{
  text: string;           // как и раньше — обязателен, не может
                           // быть пустым (в отличие от Co-author)
  bookContext?: {         // НОВОЕ, необязательное поле
    title: string;
    genre: string;
    language: string;
    premise: string;
    shortAnnotation: string;
    fullAnnotation: string;
    tags: string[];
    chapters: Array<{
      title: string;
      subtitle: string;
      scenes: Array<{ title: string; text: string }>;
    }>;
    characters: Array<{
      name: string;
      description: string;
      notes: string;
    }>;
  };
}
```

Существующая валидация text (обязателен, не пустой) — БЕЗ ИЗМЕНЕНИЙ.
bookContext — необязателен, чтобы не сломать теоретическую
обратную совместимость (хотя после Step 04, UI будет присылать его
всегда).

### Промпт — дополнить, не переписывать полностью

Если bookContext присутствует — включить его в сообщение модели с
явной инструкцией: используй контекст ТОЛЬКО для согласованности
(имена персонажей, ранее установленные факты сюжета), НЕ переписывай
и не расширяй текст за пределы того, что прислано в text — задача
остаётся полировкой грамматики/ясности/стиля переданного фрагмента,
Editor не становится Co-author. Если bookContext отсутствует —
поведение идентично текущему (промпт без контекста).

Response — БЕЗ ИЗМЕНЕНИЙ: { ok: true, result: string } |
{ ok: false, error: string }.

## Rules

- Существующая валидация text — не трогать.
- bookContext строго необязателен по типу.
- Не превращай Editor в генеративного — явно ограничь применение
  контекста в промпте (согласованность, не сочинительство).

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: (а) запрос БЕЗ bookContext — поведение идентично
  текущему (регрессия, тот же тест, что уже проходил в Sprint 04/08);
  (б) запрос С bookContext, содержащим персонажа с необычным именем —
  убедиться, что Editor не искажает уже использованное в тексте имя
  персонажа (простейшая проверка, что контекст реально влияет на
  согласованность); (в) убедиться, что Editor не расширяет текст
  далеко за пределы присланного text, несмотря на полный bookContext
  перед ним (не начинает сочинять новые сцены).
- Приложи реальные ответы в ARP.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
