id: Sprint-30-Step-05
name: "Controller + UI: useAuthController, Header логин/выход, роль-защита компонентов"
type: implementation

## Контекст

Step-04 завершил API endpoints. Теперь нужно:
1. Создать useAuthController hook для управления состоянием auth на фронте
2. Обновить Header для отображения текущего пользователя и кнопки logout
3. Добавить Login/Register диалоги
4. Скрыть Admin-only UI для обычных User'ов
5. Обновить useWorkspaceController для получения текущего пользователя

## Scope

Allowed paths:
- apps/studio/src/hooks/useAuthController.ts (NEW, управление auth состоянием)
- apps/studio/src/components/Header.tsx (обновить для отображения пользователя и logout)
- apps/studio/src/components/LoginDialog.tsx (NEW, форма входа)
- apps/studio/src/components/RegisterDialog.tsx (NEW, форма регистрации)
- apps/studio/src/page.tsx (обновить для вызова useAuthController и передачи auth в компоненты)
- apps/studio/src/workspace/useWorkspaceController.ts (обновить для использования auth)

Forbidden paths (НИКОГДА не трогать):
- Repository или API endpoints (они завершены)
- Prisma schema (завершена в Step-02)

## Rules

1. **useAuthController.ts:**
   ```typescript
   type AuthState = {
     isLoggedIn: boolean,
     user?: { id: string, email: string, role: 'admin' | 'user', isBlocked: boolean },
     error?: string
   };
   
   export function useAuthController() {
     const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false });
     
     // На mount: вызвать GET /api/auth/me, получить текущего пользователя
     useEffect(() => {
       fetchCurrentUser().then(user => {
         setAuth({ isLoggedIn: true, user });
       }).catch(() => {
         setAuth({ isLoggedIn: false });
       });
     }, []);
     
     const login = async (email: string, password: string) => {
       // POST /api/auth/login, сохранить token
       // Обновить auth state
     };
     
     const register = async (email: string, password: string) => {
       // POST /api/auth/register
       // Автоматически залогиниться после регистрации
     };
     
     const logout = async () => {
       // POST /api/auth/logout, очистить auth state
     };
     
     return { auth, login, register, logout };
   }
   ```

2. **Header.tsx обновление:**
   - Добавить отображение email и роли пользователя (если isLoggedIn)
   - Добавить кнопку Logout (если isLoggedIn)
   - Если не логирован: кнопка Login / Register (открывают диалоги)
   - Скрыть меню (Файл/Правка/Вид) если не логирован (опционально)

3. **LoginDialog.tsx (NEW):**
   ```
   - Форма с полями: email, password
   - Кнопка "Войти", кнопка "Отмена"
   - На submit: вызвать useAuthController().login()
   - При успехе: закрыть диалог
   - При ошибке: показать error message
   ```

4. **RegisterDialog.tsx (NEW):**
   ```
   - Форма с полями: email, password, password confirmation
   - Валидация пароля (тот же набор правил как в API: >= 8 символов, буква+цифра)
   - CAPTCHA виджет (placeholder для фазы 1, можно просто <div>CAPTCHA token: ...</div>)
   - Кнопка "Зарегистрироваться", кнопка "Отмена"
   - На submit: вызвать useAuthController().register()
   - При успехе: автоматически залогиниться и закрыть диалог
   - При ошибке: показать error message
   ```

5. **page.tsx обновление:**
   ```typescript
   // На top level:
   const { auth, login, register, logout } = useAuthController();
   
   // Если не логирован: показать только LoginDialog/RegisterDialog
   if (!auth.isLoggedIn) {
     return <LoginRegisterScreen onLogin={login} onRegister={register} />;
   }
   
   // Если логирован: показать основное приложение, передать auth-контекст
   return (
     <>
       <Header currentUser={auth.user} onLogout={logout} ... />
       <MainApp ... />
     </>
   );
   ```

6. **useWorkspaceController.ts обновление:**
   - Получить currentUser через getCurrentUser() или useAuthController
   - Заменить getOrCreateDefaultUser() на использование currentUser
   - Все loadBooksForUser/saveBooksForUser вызовы используют currentUser.id

7. **Admin-only UI скрытие:**
   - Если auth.user?.role !== 'admin': скрыть любые Admin-функции
   - Пример: кнопка "Настройки помощников" только для админа (для phase 2)
   - Пример: страница "Управление пользователями" только для админа (для phase 2)

## Validation

Все команды из apps/studio/:

1. **`npm run dev`**
   - Приложение стартует без ошибок
   - При открытии: если нет auth => Login/Register экран
   - Login/Register формы отображаются корректно

2. **`npx tsc --noEmit`**
   - Никаких ошибок в новых компонентах и hooks

3. **Функциональная проверка (вручную в браузере):**
   - Открыть http://localhost:3000
   - Видеть Login/Register диалог
   - Зарегистрироваться: введите email/пароль => должна создать пользователя и залогинить
   - Видеть Header с email и кнопкой Logout
   - Нажать Logout => вернуться на Login/Register экран
   - Залогиниться: введите email/пароль существующего пользователя => должна загрузить его книги
   - Видеть основное приложение (EditorArea, Sidebar, AssistantPanel)

4. **tsc, eslint, prettier, build:**
   - `npx eslint src --fix` (если есть ошибки стиля)
   - `npx prettier --write src` (если нужно переформатировать)
   - `npm run build` (должна собраться без ошибок)

5. **`git status --short`** после завершения:
   ```
   A  apps/studio/src/hooks/useAuthController.ts
   A  apps/studio/src/components/LoginDialog.tsx
   A  apps/studio/src/components/RegisterDialog.tsx
   M  apps/studio/src/components/Header.tsx
   M  apps/studio/src/page.tsx
   M  apps/studio/src/workspace/useWorkspaceController.ts
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст useAuthController.ts
2. Ключевые изменения в Header.tsx
3. Полный текст LoginDialog.tsx
4. Полный текст RegisterDialog.tsx
5. Ключевые изменения в page.tsx
6. Результат `npx tsc --noEmit`
7. Скриншоты или описание функциональной проверки (логин, регистрация, logout)
8. Результат `npm run build`
9. Результат `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
