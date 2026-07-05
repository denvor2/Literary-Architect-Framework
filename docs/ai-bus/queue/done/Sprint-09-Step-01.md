id: Sprint-09-Step-01
name: "Backend: /api/reader (discovery implementation)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/api/reader/route.ts (новый файл)

Forbidden paths:
- apps/studio/src/app/api/line-editor/route.ts
- apps/studio/src/app/api/critic/route.ts
- apps/studio/src/ai/**
- любой UI-код

## Objective

Sprint 09 — третий Expert, Reader. По образцу /api/line-editor
(discovery-реализация): та же форма ответа, что у Line Editor —
{ ok: true, result: string } — НЕ структура reviews[], как у Critic.
Это осознанное решение (согласовано с Product Owner): реакция
читателя — цельный текст, не список пунктов.

Request: { text: string } — произвольный фрагмент текста (та же
гранулярность, что у Critic).

Валидация: text отсутствует/не строка → { ok: false,
error: "No text provided." }, HTTP 400 — тот же паттерн.

Success response: { ok: true, result: string } — result это цельная
читательская реакция (не редактура, не структурированная критика).

Failure (runtime exception): { ok: false, error: string }, HTTP 500 —
тот же паттерн error instanceof Error ? error.message : "Unknown error".

Системный промпт — жёстко закодирован, инструктирует модель реагировать
КАК читатель (субъективные впечатления, эмоциональная реакция, что
зацепило/что смутило, ожидания от сюжета), НЕ как редактор и НЕ как
критик, дающий структурированную оценку по категориям. Явно отличай
тон промпта от line-editor (не про грамматику) и от critic (не про
категоризированный разбор по Plot/Style/etc — просто голос читателя).

Модель: claude-sonnet-5, зафиксирована, не параметризуется — тот же
принцип, что у Line Editor/Critic.

## Rules

- Discovery-реализация: минимально, без абстракций, как у line-editor
  и critic route.ts.
- Не трогай другие route.ts, ai/**, UI.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: curl -X POST /api/reader с реальным текстом сцены —
  приложи полный реальный ответ модели в ARP (реакция должна читаться
  как впечатление читателя, не как список правок).
- curl без text → 400 + { ok: false, error: "No text provided." }.
- Приложи содержимое route.ts целиком.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
