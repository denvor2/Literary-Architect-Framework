id: Sprint-26-Step-02
name: "Срочный баг-фикс: ошибка сохранения типового запроса в AssistantSettingsDialog"
type: bug

## Контекст

При редактировании помощника и попытке добавить типовой запрос (typical request) в
AssistantSettingsDialog выдаётся ошибка сохранения. Функциональность должна работать
без ошибок.

## Проблема

Product Owner сообщил об ошибке при редактировании помощника:
- Открывается диалог настроек (gear кнопка на режиме помощника)
- В поле "дополнение к промпту" вводится текст
- При добавлении типового запроса выдаёт ошибку сохранения

## Scope

Allowed paths:
- apps/studio/src/components/AssistantPanel.tsx (AssistantSettingsDialog)
- apps/studio/src/repositories/assistantSettingsRepository.ts (если ошибка в репозитории)
- apps/studio/src/app/api/assistant-settings/ (если ошибка в API)

Forbidden paths:
- Никакой новой функциональности, только фиксим существующую

## Rules

- Воспроизвести ошибку
- Найти источник (фронт или API)
- Зафиксировать, чтобы сохранение работало без ошибок
- Типовые запросы должны сохраняться корректно

## Validation

- npx tsc --noEmit - чисто
- npx eslint src - чисто
- npm run build - чисто
- Живая проверка (npm run dev):
  1. Открыть AssistantSettingsDialog через gear кнопку
  2. Ввести дополнение к промпту
  3. Добавить типовой запрос
  4. Проверить, что сохраняется без ошибок
  5. Перезагрузить страницу — типовой запрос сохранился

## Output

ARP файлом в docs/task-bus/queue/active/ с описанием найденной проблемы и фикса.

## Stop Condition

Не коммитить без подтверждения Product Owner.
