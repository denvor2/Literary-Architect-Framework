id: Sprint-08-Step-03
name: "UI: захват выделенного фрагмента + вызов Critic через AI Bus"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- apps/studio/src/ai/** (не трогай, Step 02 уже готов)
- apps/studio/src/app/api/** (не трогай)
- apps/studio/src/components/LineEditorPanel.tsx

## Objective

Это функциональный шаг без финальной вёрстки — просто заставить
Critic реально работать через реальный клик в UI. Красивая
responsive-панель — отдельный Step 04, не сейчас.

1. В EditorArea.tsx (или там, где сейчас режим "Критик" визуально
   существует поверх Line Editor, если такое есть) — найди текущий
   handler для режима "Критик" и замени его на реальный вызов:

```typescript
const result = await aiBus.execute({
  operation: {
    type: "critic_review",
    payload: { text: selectedText },
  },
  context: {},
});
const reviews = JSON.parse(result.response.text); // временно, см. TODO в aiBus.ts
```

2. Захват выделенного текста: добавь обработку выделения в текстовом
   поле сцены (window.getSelection() или selectionStart/selectionEnd
   у textarea — выбери подход, который проще интегрировать в
   существующую структуру компонента, опиши выбор в ARP). Если
   пользователь не выделил текст — используй текущее поведение как
   fallback (весь текст сцены), явно закомментируй это как временное
   решение до явного UX-решения по этому случаю.

3. Результат (массив reviews) пока просто вывести как есть — временный
   plain-список (можно без стилизации, <ul><li>), не тратя время на
   финальный дизайн панели. Это будет заменено в Step 04.

4. Обработка ошибок — тот же паттерн, что уже есть в компоненте
   (setStatus("error") или аналог).

## Rules

- Не трогай aiBus.ts, operations.ts, route.ts — они уже готовы.
- Минимально необходимая вёрстка — этот шаг про работоспособность,
  не про дизайн.
- Не убирай и не меняй существующее поведение Line Editor/Improve.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка в реальном браузере (не только curl): выдели
  фрагмент текста в сцене, нажми "Критик", получи реальные замечания
  от модели, отображённые в UI. Приложи скриншот или точное описание
  результата в ARP.
- Проверь случай без выделения (fallback на весь текст) — опиши
  поведение в ARP.
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
