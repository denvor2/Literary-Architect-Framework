# Step Card Template

```markdown
# Sprint-XX-Step-YY: [Feature Name]

## Objective
[Что делаем и почему]

## Acceptance Criteria
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] E2E тесты написаны и проходят
- [ ] Live verification пройдена
- [ ] CRITICAL_FEATURES.md обновлен

## Implementation

### Changed Files
- `file1.tsx`
- `file2.ts`

### Risk Areas
- ⚠️ Могут быть проблемы с X
- ⚠️ Могут быть проблемы с Y

## Testing

### E2E Test File
\`apps/studio/e2e/feature-name.spec.ts\`

### Test Cases
- [ ] Test case 1: описание
- [ ] Test case 2: описание

**Run:** \`npm run test:e2e e2e/feature-name.spec.ts\`

### Live Verification
1. Открыть http://localhost:3000
2. Сделать X
3. Проверить что Y работает
4. Перезагрузить (F5)
5. Проверить что Z сохранилось

## Critical Features Updated

Если эта Step Card добавляет критичный функционал:

- [ ] Добавить в docs/project/CRITICAL_FEATURES.md
- [ ] Добавить строку в таблицу
- [ ] Привязать к E2E тесту
- [ ] Отметить статус VERIFIED

Пример:
\`\`\`
| 10 | New Feature: X | e2e/feature.spec.ts | ✅ VERIFIED | описание |
\`\`\`

## Validation

- [ ] \`npm run build\` успешно
- [ ] \`npx tsc --noEmit\` 0 errors
- [ ] \`npx eslint src\` 0 errors
- [ ] \`npm run test:e2e\` все тесты passing
- [ ] Live verification пройдена
```

---

## 📋 Чек-лист перед commit

**Всегда перед тем как делать commit:**

```bash
# 1. Типизация
npx tsc --noEmit

# 2. Lint
npx eslint src

# 3. Форматирование  
npx prettier --check "src/**/*.{ts,tsx}"

# 4. Сборка
npm run build

# 5. E2E тесты (если писал новые)
npm run test:e2e

# 6. Live verify (если критичный функционал)
# Открыть браузер, проверить вручную
```

---

## 🎯 Для Step Card Authors

**Обязательно:**
1. Если функция видна пользователю → E2E тест обязателен
2. Если функция критична → добавить в CRITICAL_FEATURES.md
3. Перед commit → все тесты должны проходить
4. Если сломал старый тест → требует фиксирования в этой же Step Card

**Optional but recommended:**
5. Unit тесты для бизнес-логики
6. Скриншоты в ARP если UI изменился

---

## 🚀 Запуск всех проверок одной командой

```bash
npm run validate
```

(Должна быть скрипт в package.json который запускает все выше)
