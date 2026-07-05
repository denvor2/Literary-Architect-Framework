id: Sprint-09-Step-03
name: "UI: подключить Reader через AI Bus"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- apps/studio/src/ai/** (готово, не трогай)
- apps/studio/src/app/api/** (готово, не трогай)
- apps/studio/src/components/LineEditorPanel.tsx

## Objective

Режим "Reader" сейчас фиктивно использует Line Editor (как Critic
использовал до Sprint-08-Step-03). Заменить на реальный вызов.

Проще, чем было с Critic: ответ уже строка, не JSON — не нужен
JSON.parse.

```typescript
const result = await aiBus.execute({
  operation: {
    type: "reader_reaction",
    payload: { text: selectedText }, // переиспользуй getSelectedText,
                                       // уже реализованную для Critic
                                       // в Sprint-08-Step-03
  },
  context: {},
});
// result.response.text — уже готовая строка реакции читателя,
// выводить как есть, без парсинга
```

Вывод — простой текстовый блок (реакция читателя целиком, как есть),
БЕЗ кнопки "Заменить текст" (Reader производит Review, не Revision —
тот же принцип, что и у Critic). Можно временно без специальной
вёрстки — если понадобится responsive-панель по аналогии с Critic
(Sprint-08-Step-04), это будет отдельный Step-04 этого спринта,
не сейчас.

Fallback на весь текст сцены при пустом выделении — та же логика,
что уже есть для Critic.

## Rules

- Не трогай ai/**, api/**, LineEditorPanel.tsx.
- Не добавляй кнопку замены текста для Reader.
- Не трогай вывод Editor/Critic — только режим Reader.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка в браузере: выдели фрагмент, нажми "Reader",
  получи реальную реакцию модели на русском, отображённую как текст.
- Проверь fallback без выделения.
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
