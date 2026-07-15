id: Sprint-40-Step-01
name: "Admin Panel shell: /admin маршрут, layout, роль-защита, placeholder разделы"
type: implementation

## Контекст

Sprint-30 (ADR-0015) завершил систему многопользовательской аутентификации с ролями 
(admin/user). Sprint-32 завершил логирование и audit систему. Sprint-31 (billing) 
заморожена до Sprint-45.

Нужна админ-панель для управления системой. Sprint-40-Step-01 создаёт SHELL — 
только структура, layout и роль-защита. Реальный функционал (user management, 
billing control, database inspection) отложен до Sprint 45+.

## Scope

Allowed paths (ТОЛЬКО эти пути можно создавать/менять):
- apps/studio/src/app/admin/layout.tsx (NEW)
- apps/studio/src/app/admin/page.tsx (NEW)
- apps/studio/src/app/admin/users/page.tsx (NEW, placeholder)
- apps/studio/src/app/admin/logs/page.tsx (NEW, placeholder)
- apps/studio/src/app/admin/billing/page.tsx (NEW, placeholder)
- apps/studio/src/app/admin/database/page.tsx (NEW, placeholder)
- apps/studio/src/middleware.ts (MODIFY — добавить защиту /admin/*)
- apps/studio/src/components/Header.tsx (MODIFY — добавить кнопку Admin для админов)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (repository layer — read-only)
- apps/studio/src/app/api/** (API endpoints — read-only)
- apps/studio/src/domain/** (domain model — read-only)
- Реальная реализация User CRUD, Payment processing, Database inspection
- Удаление AdminAuditPanel.tsx или AdminAuditPanel компонента

## Rules

1. **Защита маршрута на уровне middleware:**
   - Проверять все запросы к /admin/*
   - Если не аутентифицирован: 401 Unauthorized
   - Если аутентифицирован, но role !== 'admin': 403 Forbidden
   - Если роль 'admin': NextResponse.next()

2. **Защита на уровне компонента (дополнительная):**
   - В /admin/layout.tsx или /admin/page.tsx проверять currentUser.role === 'admin'
   - Если не admin: показать "Access Denied" или redirect на /

3. **Header.tsx — добавить кнопку Admin:**
   - Видима только если currentUser?.role === 'admin'
   - Кнопка/ссылка на /admin
   - Расположение: рядом с логаутом в правом углу Header
   - Текст: "Admin" или "Админ-панель"

4. **Layout структура (/admin/layout.tsx):**
   - Header с логотипом или backlink
   - Боковая навигация (Sidebar или горизонтальные tabs):
     * Users
     * Logs (использовать существующий AdminAuditPanel)
     * Billing
     * Database
   - Основная area справа для outlet
   - Dark theme, соответствовать дизайну приложения

5. **Главная страница (/admin/page.tsx):**
   - Приветствие: "Администраторская панель Literary Studio"
   - Быстрые сводки (метрики-placeholders):
     * Total Users (Coming soon)
     * Active Sessions (Coming soon)
     * Recent Logs (Coming soon)
     * System Status: OK
   - Ссылки на каждый раздел

6. **Разделы:**
   - /admin/users/page.tsx: "User Management" + "Coming in Sprint 45+"
   - /admin/logs/page.tsx: Встроить существующий AdminAuditPanel (полный функционал для audit logs)
   - /admin/billing/page.tsx: "Billing & Payments" + "Coming in Sprint 45+"
   - /admin/database/page.tsx: "Database Inspector" + "Coming in Sprint 45+"

7. **Структура и интеграция:**
   - Создать новую структуру /admin/* с layout и навигацией
   - Переместить/встроить AdminAuditPanel в /admin/logs/page.tsx
   - Placeholder страницы для Users, Billing, Database
   - Middleware защита для всех /admin/* маршрутов
   - Кнопка Admin в Header для админов

8. **TypeScript:**
   - Use 'use client' в компонентах с hooks
   - Типы из useAuthController
   - Используй existing patterns

## Validation

Все команды из apps/studio/:

1. **npx tsc --noEmit**
   - Никаких ошибок типов

2. **npx eslint src**
   - Никаких linting ошибок

3. **npx prettier --check "src/**/*.{ts,tsx}"**
   - Форматирование OK

4. **npm run build**
   - Production build успешно

5. **Функциональная проверка (браузер):**
   - Войти как обычный пользователь (role='user')
   - Попытка /admin => 403 Forbidden или Access Denied
   - Выйти, войти как админ
   - /admin => успешно загружается
   - Header показывает кнопку "Admin" только для админов
   - Все 4 раздела доступны в навигации
   - Клик на каждый раздел => соответствующий URL и placeholder текст

6. **git status --short:**
   ```
   A  apps/studio/src/app/admin/layout.tsx
   A  apps/studio/src/app/admin/page.tsx
   A  apps/studio/src/app/admin/users/page.tsx
   A  apps/studio/src/app/admin/logs/page.tsx
   A  apps/studio/src/app/admin/billing/page.tsx
   A  apps/studio/src/app/admin/database/page.tsx
   M  apps/studio/src/middleware.ts
   M  apps/studio/src/components/Header.tsx
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:

1. Содержимое всех новых файлов (полный текст)
2. Изменения в middleware.ts и Header.tsx (выделить новый код)
3. Результаты валидационных команд (tsc, eslint, prettier, build)
4. Описание браузерной проверки (скриншоты или текст)
5. Результат git status --short

## Решение Product Owner

✅ **Вариант A принят:** Встроить существующий AdminAuditPanel в /admin/logs/page.tsx.
Сохраняем работающий функционал, интегрируем в новую структуру Admin Panel shell.

## Stop Condition

Структура /admin создана, всё типизировано, валидировано, браузерно протестировано.
Middleware защита включена. AdminAuditPanel встроен в /admin/logs.
Готово к коммиту и архивированию в done/.
