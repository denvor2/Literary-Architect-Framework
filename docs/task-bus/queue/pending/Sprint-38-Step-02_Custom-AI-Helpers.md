# Sprint-38-Step-02: Пользовательские AI помощники

## Objective
Позволить пользователям создавать свои собственные AI помощников с кастомными промптами и сохранять их для повторного использования. Помощники хранятся в БД и доступны в ExpertPanel.

## Why Now
- Писатели часто нуждаются в специализированных помощниках для своих жанров
- Это differentiator vs базовых 4 системных помощников (Соавтор, Редактор, Критик, Читатель)
- Интеграция со статистикой Step-01: каждый помощник может иметь свои счетчики использования
- Требуется для тарифной системы (Premium имеет unlimited custom assistants)

## Acceptance Criteria
- [ ] User может создать новое помощника: имя + системный промпт
- [ ] User может просмотреть список своих помощников
- [ ] User может редактировать имя/промпт существующего помощника
- [ ] User может удалить свого помощника
- [ ] Помощники сохраняются в БД (таблица CustomAssistant)
- [ ] Помощники отображаются в ExpertPanel наряду с системными (4 системных + N кастомных)
- [ ] При использовании кастомного помощника — его промпт подставляется в AI запрос
- [ ] Тариф Premium позволяет unlimited; остальные — в зависимости от плана
- [ ] E2E тесты: создать/редактировать/удалить/использовать помощника

## Implementation

### Backend: Prisma Schema
```prisma
model CustomAssistant {
  id        String   @id @default(cuid())
  userId    String   @db.VarChar(255)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String   @db.VarChar(255)           // "Фэнтези-редактор"
  systemPrompt String @db.Text               // Полный промпт для этого помощника
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt()
  
  @@unique([userId, name])
  @@index([userId])
}
```

### API Endpoints
- **GET /api/assistants** — list all custom assistants for current user
  ```json
  { assistants: [{ id, name, systemPrompt, createdAt }] }
  ```
- **POST /api/assistants** — create new custom assistant
  ```json
  { name: "...", systemPrompt: "..." }
  // Returns: { id, name, systemPrompt, createdAt }
  ```
- **PUT /api/assistants/:id** — update name/prompt
  ```json
  { name: "...", systemPrompt: "..." }
  // Returns updated assistant
  ```
- **DELETE /api/assistants/:id** — delete custom assistant
  ```json
  { success: true }
  ```

### Repository Layer
- `apps/studio/src/repositories/assistantRepository.ts`
  - `loadCustomAssistants(userId: string): Promise<CustomAssistant[]>`
  - `createCustomAssistant(userId, name, systemPrompt): Promise<CustomAssistant>`
  - `updateCustomAssistant(id, name, systemPrompt): Promise<CustomAssistant>`
  - `deleteCustomAssistant(id): Promise<void>`

### UI: Custom Assistants Manager
- **New Component:** `CustomAssistantsDialog.tsx`
  - Modal с табами: "Список" | "Создать"
  - Список: таблица с name, created date, actions (edit/delete)
  - Создать: форма с name + systemPrompt textarea
  - Dark mode + responsive

- **Integration in ExpertPanel:**
  - Load custom assistants при монтировании
  - Show в dropdown: [System assistants (4)] + [Custom assistants (N)]
  - При выборе custom → использовать его systemPrompt в AI запросе

- **Settings Menu Option:**
  - Добавить кнопку "Мои помощники" в Sidebar или Header
  - Открывает CustomAssistantsDialog

### Files to Modify
- `prisma/schema.prisma` — добавить CustomAssistant модель
- `apps/studio/src/repositories/assistantRepository.ts` — CRUD функции (новый файл)
- `apps/studio/src/app/api/assistants/route.ts` — GET, POST endpoints (новый файл)
- `apps/studio/src/app/api/assistants/[id]/route.ts` — PUT, DELETE endpoints (новый файл)
- `apps/studio/src/hooks/useWorkspaceController.ts` — добавить `customAssistants` в state
- `apps/studio/src/components/ExpertPanel.tsx` — интеграция кастомных помощников
- `apps/studio/src/components/CustomAssistantsDialog.tsx` — новый UI (может быть в папке dialogs/)

## Testing
- [ ] E2E: create custom assistant (name + prompt)
- [ ] E2E: list shows created assistant
- [ ] E2E: edit assistant name/prompt
- [ ] E2E: delete assistant (confirm dialog)
- [ ] E2E: use custom assistant in chat (verify prompt is used)
- [ ] E2E: switch between system and custom assistants
- [ ] E2E: custom assistants persist after page reload
- [ ] E2E: tariff limits enforced (Premium unlimited, others have limit)
- [ ] npm run validate passes

## Notes
- Валидация: имя помощника — 1-50 символов, промпт — 10-5000 символов
- Дублирование имен запрещено (уникальный индекс на [userId, name])
- При удалении пользователя — все его помощники удаляются (Cascade)
- System assistants (4 базовых) жестко закодированы, кастомные загружаются из БД
- Для Step-03 (Design): возможна иконка "⚙️" для каждого помощника в списке
