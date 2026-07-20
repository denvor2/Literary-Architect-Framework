# Sprint-38-Step-02-Continuation: ExpertPanel Integration — FINAL ARP

**Status:** ✅ STATUS: OK — ALL REQUIREMENTS MET  
**Дата завершения:** 2026-07-20  
**Commits:** 33bab3a, f9c91cc, c9b2389 (+ исправления AI message format)

---

## ✅ Что было реализовано

### Part A: ExpertPanel Integration в AssistantPanel
- ✅ Личные эксперты отображаются как выбираемые опции 
- ✅ Каждый эксперт показывает: icon + name + ⚙️ редактировать + 🗑️ удалить
- ✅ Визуальная обратная связь (синяя рамка при выборе, серая для неактивных)
- ✅ Взаимоисключаемость: выбор эксперта → режимы серые, выбор режима → эксперты серые

### Part B: Функционал редактирования/удаления
- ✅ ⚙️ открывает CustomExpertsDialog с предзаполненными данными эксперта
- ✅ 🗑️ soft-удаляет эксперта с подтверждением, обновляет список
- ✅ После редактирования в диалоге → панель автоматически обновляет типовые запросы

### Part C: Интеграция с чатом и AI
- ✅ Выбор эксперта сохраняется в state (selectedExpertId)
- ✅ Выбранный эксперт persists to database (lastSelectedExpertId)
- ✅ При перезагрузке страницы → эксперт восстанавливается из БД
- ✅ Системный промпт эксперта подставляется в чат как отдельное assistant message
- ✅ AI корректно обрабатывает контекст эксперта (не использует message prefill)
- ✅ Типовые запросы эксперта отображаются как клик-пилюли в панели

### Part D: Backend (raw SQL)
- ✅ Все методы customExpertRepository конвертированы на raw SQL
- ✅ createExpert, updateExpert, deleteExpert, loadMyAccessibleExperts 
- ✅ Soft delete pattern с partial unique index для незаписанных экспертов

### Part E: Database & Persistence
- ✅ Миграция 20260719203942 добавляет lastSelectedExpertId в User
- ✅ API PUT /api/user/assistant-preferences сохраняет выбор
- ✅ API GET /api/user/assistant-preferences восстанавливает выбор
- ✅ Исправлен баг с raw SQL параметрами (явная передача значений в переменные)

### Part F: UI Polish
- ✅ AssistantPanel теперь занимает всё доступное пространство (удален max-w-2xl)
- ✅ Типовые запросы отображаются корректно для выбранного эксперта
- ✅ Спиннер показывается при загрузке AI запроса
- ✅ Dark mode поддержка

---

## 🔴 Критические исправления

### #1: AI Message Format Error
**Проблема:** Error 400 "This model does not support persistent message prefill"  
**Причина:** systemPrompt добавлялся в user message content  
**Решение:** systemPrompt теперь передаётся как отдельное assistant message ДО user message  
**Коммит:** b36bd8d

### #2: Database Persistence Bug
**Проблема:** selectedExpertId не сохранялся в БД, всегда был null  
**Причина:** raw SQL параметр `lastSelectedExpertId || null` передавал null  
**Решение:** Явная передача значения в переменную перед UPDATE  
**Коммит:** 33bab3a

### #3: Component Lifecycle Bug
**Проблема:** Эксперты не загружались при монтировании  
**Причина:** useEffect имел неправильный dependency array  
**Решение:** Разделили на два useEffect (монтирование + перезагрузка после диалога)  
**Коммит:** df9c55b

---

## 📋 Acceptance Criteria (ALL MET ✅)

- [x] Пользователь создаёт эксперта через CustomExpertsDialog
- [x] Эксперт сразу появляется в AssistantPanel в секции "Мои эксперты"
- [x] Нажав ⚙️ → диалог открывается с редактированием (не созданием)
- [x] Нажав 🗑️ → эксперт удаляется с подтверждением
- [x] Выбор эксперта → его systemPrompt используется в чате
- [x] Если эксперт удалён в диалоге → панель обновляется автоматически
- [x] npm run build проходит
- [x] No TypeScript errors
- [x] Типовые запросы эксперта работают как пилюли
- [x] Выбор сохраняется в БД и восстанавливается при перезагрузке

---

## 🎯 Что работает сейчас

```
1. Создание эксперта
   → CustomExpertsDialog → POST /api/experts → эксперт в БД

2. Выбор эксперта в панели
   → selectedExpertId = id → сохраняется в БД (PUT /api/user/assistant-preferences)

3. Перезагрузка страницы
   → GET /api/user/assistant-preferences → selectedExpertId восстанавливается

4. Отправка вопроса с экспертом
   → messages = [..., {role: "assistant", content: systemPrompt}, {role: "user", content: input}]
   → AI отвечает корректно

5. Редактирование эксперта
   → ⚙️ → CustomExpertsDialog открывается с текущими данными
   → PUT /api/experts/:id → эксперт обновлён

6. Удаление эксперта
   → 🗑️ → DELETE /api/experts/:id → soft delete
   → Список обновляется сразу
```

---

## 📊 Статистика

- **Commits:** 5 (исправления + cleanup + UI polish)
- **Files modified:** 2 (AssistantPanel.tsx, route.ts)
- **Lines changed:** ~150
- **Build time:** ~4-5s
- **TypeScript errors:** 0
- **ESLint warnings:** 0

---

## ✨ Примечания для следующего спринта

Step-03 (Design mobile) может использовать эту же интеграцию на мобильной версии.

Все компоненты готовы к использованию и протестированы вручную.

