id: Sprint-31-Step-06
name: "UI компоненты: выбор тарифа, оплата, отображение активного плана"
type: implementation

## Контекст

Step-05 завершил controller layer. Теперь нужны React UI компоненты для выбора тарифа,
оплаты и отображения активного плана в Header.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/components/PlanSelectionDialog.tsx (новый)
- apps/studio/src/components/PaymentForm.tsx (новый)
- apps/studio/src/components/CurrentPlanDisplay.tsx (новый)
- apps/studio/src/components/Header.tsx (обновить для отображения плана)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (не трогать)
- apps/studio/src/app/api/** (не трогать)
- apps/studio/src/workspace/** (не трогать)

## Rules

1. **PlanSelectionDialog.tsx**

Диалог для выбора плана с карточками (grid layout):
- Загружает список планов из GET /api/billing
- Отображает имя, цену, features каждого плана
- Current plan выделен специально (border, background color)
- При клике — инициирует платёж через selectPlan() hook

2. **PaymentForm.tsx**

Phase 1: placeholder форма оплаты (кнопка "Pay" с mock-обработкой).

```typescript
// Принимает clientSecret, planName, amount от parent
// Phase 2: будет использовать Stripe Payment Element
// Phase 1: просто mock-кнопка для тестирования flow
```

3. **CurrentPlanDisplay.tsx**

Компонент отображения текущего плана:
- Показывает имя плана (Free, Pro, Enterprise)
- Показывает дни до истечения (если есть)
- Показывает красный текст если истёк
- Кнопка Upgrade (если не enterprise)

4. **Header.tsx**

Обновить Header для:
- Добавить CurrentPlanDisplay рядом с user email
- Добавить state для PlanSelectionDialog (open/close)
- Интегрировать onUpgradeClick для открытия диалога

5. **Стиль**

- Использовать Tailwind или существующую UI library
- Следовать цветовой схеме приложения
- Планы в grid layout (3 колонны)
- Current plan с зелёной/синей border

## Validation

1. `npx tsc --noEmit` — никаких ошибок
2. `npm run build` — собирается без ошибок
3. Visual test: `npm run dev`
   - Header показывает текущий план
   - "Upgrade" открывает диалог
   - Диалог показывает список планов
   - Выбор плана инициирует платёж

## Stop Condition

Не создавать Step-07 без проверки отображения UI компонентов.
