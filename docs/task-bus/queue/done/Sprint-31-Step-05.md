id: Sprint-31-Step-05
name: "Controller слой: useBillingController hook"
type: implementation

## Контекст

Step-04 завершил API endpoints. Теперь нужен React controller hook для управления 
состоянием биллинга на фронтенде:
- Загрузка текущего плана пользователя
- Управление диалогом выбора плана
- Инициирование процесса оплаты
- Обновление статуса в реальном времени

Этот hook будет использоваться в Step-06 (UI компоненты) и в Header (отображение 
текущего плана).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/billing/useBillingController.ts (новый файл)
- apps/studio/src/billing/index.ts (экспортировать hook и типы, если создан)

Forbidden paths (НИКЕГДА не трогать):
- apps/studio/src/repositories/** (не трогать)
- apps/studio/src/app/api/** (не трогать)
- apps/studio/src/workspace/** (не трогать за исключением интеграции с auth)
- apps/studio/src/components/** (это Step-06)

## Rules

1. **Типы (в начале или в отдельном types файле):**
   
   ```typescript
   import type { Plan, UserSubscription } from "@/generated/prisma/client";
   import { PlanTier } from "@/generated/prisma/client";
   
   type BillingState = {
     currentPlan: Plan | null;
     currentSubscription: UserSubscription | null;
     daysUntilExpiry: number | null;
     isExpired: boolean;
     isLoading: boolean;
     error: string | null;
   };
   
   type BillingActions = {
     loadCurrentPlan: () => Promise<void>;
     selectPlan: (planId: string) => Promise<void>;
     cancelSubscription: () => Promise<void>;
   };
   ```

2. **useBillingController hook:**
   
   ```typescript
   export function useBillingController(): BillingState & BillingActions {
     const [state, setState] = useState<BillingState>({
       currentPlan: null,
       currentSubscription: null,
       daysUntilExpiry: null,
       isExpired: false,
       isLoading: false,
       error: null,
     });
   
     // Загрузить текущий план при монтировании
     useEffect(() => {
       void loadCurrentPlan();
     }, []);
   
     // Загрузить текущий план пользователя
     const loadCurrentPlan = async () => {
       setState(prev => ({ ...prev, isLoading: true, error: null }));
       try {
         const res = await fetch('/api/billing/plan');
         if (!res.ok) throw new Error(await res.text());
         const data = await res.json();
         if (!data.ok) throw new Error(data.error);
         
         // Вычислить дни до истечения
         let daysUntilExpiry = null;
         let isExpired = false;
         if (data.subscription?.endDate) {
           const end = new Date(data.subscription.endDate);
           const now = new Date();
           daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
           isExpired = daysUntilExpiry <= 0;
         }
         
         setState(prev => ({
           ...prev,
           currentPlan: data.plan,
           currentSubscription: data.subscription,
           daysUntilExpiry,
           isExpired,
           isLoading: false,
         }));
       } catch (error) {
         setState(prev => ({
           ...prev,
           error: error instanceof Error ? error.message : "Failed to load plan",
           isLoading: false,
         }));
       }
     };
   
     // Выбрать и перейти на новый план (инициировать покупку)
     const selectPlan = async (planId: string) => {
       setState(prev => ({ ...prev, isLoading: true, error: null }));
       try {
         const res = await fetch('/api/billing/subscribe', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ planId }),
         });
         if (!res.ok) throw new Error(await res.text());
         const data = await res.json();
         if (!data.ok) throw new Error(data.error);
         
         // Инициирование платежа (Step-06 обработает Stripe Payment Element)
         return {
           subscription: data.subscription,
           stripePaymentIntent: data.stripePaymentIntent,
         };
       } catch (error) {
         const errorMsg = error instanceof Error ? error.message : "Failed to select plan";
         setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
         throw error;
       }
     };
   
     // Отменить подписку (downgrade на Free)
     const cancelSubscription = async () => {
       // TBD: реализация отмены подписки (если needed)
     };
   
     return {
       ...state,
       loadCurrentPlan,
       selectPlan,
       cancelSubscription,
     };
   }
   ```

3. **Интеграция с useAuthController:**
   
   useBillingController не зависит напрямую от useAuthController, но предполагает, 
   что пользователь залогинен (auth cookie установлена). При logout, состояние 
   биллинга должно быть очищено (это может быть сделано в useAuthController 
   или в компоненте, который использует оба hooks).

4. **Обработка ошибок:**
   
   - Все fetch вызовы обёрнуты в try-catch
   - Ошибки сохраняются в state.error для отображения в UI
   - При повторной попытке загрузки, error очищается

5. **Отсутствие прямого использования Stripe:**
   
   useBillingController возвращает stripePaymentIntent (clientSecret), но сам 
   не инициирует Stripe платёж. Step-06 (UI) будет использовать clientSecret 
   для вывода Payment Element.

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Никаких ошибок в billing/**

2. **`npx eslint src/billing/useBillingController.ts`**
   - Должен пройти без ошибок

3. **Ручное тестирование (e2e или в компоненте):**
   
   ```typescript
   // В компоненте
   const { currentPlan, isLoading, loadCurrentPlan } = useBillingController();
   
   useEffect(() => {
     loadCurrentPlan(); // должен загрузить план
   }, []);
   
   console.log('Current plan:', currentPlan);
   console.log('Is loading:', isLoading);
   ```

## Stop Condition

Не создавать Step-06 без проверки, что useBillingController корректно 
загружает и обновляет состояние.
