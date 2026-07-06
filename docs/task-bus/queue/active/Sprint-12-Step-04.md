id: Sprint-12-Step-04
name: "UI: подключить Co-author + расширить Editor контекстом книги"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- apps/studio/src/components/Sidebar.tsx, CharacterPanel.tsx
- apps/studio/src/ai/**, apps/studio/src/app/api/**
- apps/studio/src/app/page.tsx (book уже передаётся в EditorArea как
  проп с Sprint 11 Step 02 — новых пропов из page.tsx не требуется)

## Objective

### 1. Co-author — подключить реально (сейчас фиктивно использует Line Editor)

`book` (весь активный Book — id/title/chapters/characters/etc.) уже
доступен в EditorArea как проп с Sprint 11. Использовать его
НАПРЯМУЮ как `bookContext` — не пересобирать отдельно, `Book` уже
содержит всё нужное.

```typescript
const result = await aiBus.execute({
  operation: {
    type: "coauthor_draft",
    payload: {
      currentText: selectedScene.text, // вся сцена целиком, НЕ
                                         // getSelectedText() — Co-author
                                         // продолжает/пишет сцену
                                         // целиком, не реагирует на
                                         // выделенный фрагмент, как
                                         // Critic/Reader
      bookContext: book,
    },
  },
  context: {},
});
```

Вывод — по тому же паттерну, что уже есть у Editor (Original/
Improved preview, кнопки "Заменить текст"/"Оставить как есть") — в
отличие от Critic/Reader, Co-author производит Revision (новый/
продолженный текст сцены), не Review, поэтому кнопка замены здесь
уместна, применяет через уже существующий onChangeSceneText.

### 2. Editor — расширить вызов контекстом книги

Текущий handleImprove (или как называется handler для Editor) сейчас
вызывает `improve_text` только с `{ text }`. Добавить `bookContext:
book` в payload — тот же `book`, что и для Co-author. Остальная
логика (preview, кнопки, getSelectedText для выделенного фрагмента)
— БЕЗ ИЗМЕНЕНИЙ, это не меняет, ЧТО делает Editor, только даёт ему
контекст для согласованности (уже ограничено промптом на бэкенде).

### 3. Critic/Reader — НЕ трогать

Они вне таблицы контекстов "видит книгу целиком" — их вызовы
остаются как есть, без bookContext.

## Rules

- Не трогай Critic/Reader вызовы.
- Co-author использует selectedScene.text целиком, не
  getSelectedText().
- Editor продолжает использовать getSelectedText() с fallback на
  весь текст (существующее поведение) — просто добавляется
  bookContext параллельно, никакой другой логики не меняется.

## Validation

- npm run build / npm run lint / prettier --check — чисто.
- Живая проверка: нажать "Co-author" на сцене (пустой и непустой) —
  реальный черновик, отражающий персонажей/сюжет книги; принять
  через "Заменить текст" — сцена обновляется; нажать Editor — как
  раньше работает, плюс теперь учитывает контекст (можно проверить
  на персонаже с необычным именем, как в Step 02).
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
