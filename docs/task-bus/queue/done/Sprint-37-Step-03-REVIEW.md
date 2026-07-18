# Sprint-37-Step-02: Export Filenames with Timestamps — Обзор архитектора

**Дата:** 2026-07-18  
**Статус:** STOP  
**Архитектор:** Claude (Architect role)

---

## STATUS: STOP

---

## SUMMARY

Step Card имеет критические проблемы нумерации и документирования:

1. **Ошибка номера**: Sprint-37-Step-02 уже завершена (Complete UI Localization, архивирована в done/ коммит aa60646). Этот Step Card должен быть Sprint-37-Step-03.
2. **Недостоверное описание Отклонений**: ARP утверждает "Нет отклонений", но функция `generateFilename` уже была реализована в Sprint-36 (коммит 3d3680a, 16 июля), а Step Card требовал её реализовать.
3. **Неполная верификация E2E**: Тесты проверяют POST data API request, но не скачанные файлы. Requirement "downloaded file has timestamp" не может быть проверен без перехвата реального скачивания.
4. **Отсутствие scope**: Step Card не содержит `allowed_paths` и `forbidden_paths` (шаблон требует).

---

## FINDINGS

### 1. Конфликт нумерации (CRITICAL)

**Фактическое состояние:**
- `docs/task-bus/queue/done/Sprint-37-Step-02.md` — архивирована (Complete UI Localization)
- `docs/task-bus/queue/active/Sprint-37-Step-02_Export-Filenames-Timestamps.md` — в очереди review
- `docs/task-bus/queue/pending/Sprint-37-Step-03_Export-PDF.md` — следующая карточка

**Проблема:** Этот Step Card должен быть `Sprint-37-Step-03`, не Step-02. Текущая нумерация нарушает логику Task Bus v4 (уникальность идентификатора Step Card в спринте).

**Доказательство:**
```bash
$ git show aa60646 | head -15
# Архивировать Sprint-37-Step-02 в done/
# Step-02: Complete UI Localization (EN/RU)

$ ls docs/task-bus/queue/done/ | grep Sprint-37-Step-02
# Sprint-37-Step-02.md ← ЭТО УЖЕ СУЩЕСТВУЕТ И АРХИВИРОВАНО
```

### 2. Недостоверность раздела "Отклонения от Step Card"

**ARP пишет:**
```
Отклонения от Step Card
**Нет.** 
Все требования Step Card выполнены полностью:
- JSON экспорт ✅
- Markdown ZIP ✅
- DOCX ✅
```

**Реальность:**
- Функция `generateFilename` уже существовала в `page.tsx` строка 545 и `ExportDialog.tsx` строка 17
- Её добавил коммит 3d3680a (16 июля): "Export: Implement hybrid archive format with date-time filenames"
- Step Card требовал добавить эту функцию, но она оказалась уже готовой

**Доказательство:**
```bash
$ git log --oneline | grep -i timestamp
3d3680a Export: Implement hybrid archive format with date-time filenames

$ git show 3d3680a | head -40
# Date: Thu Jul 16 12:14:38 2026 +0300
# - Added generateFilename() function with Cyrillic support
# - All export formats now timestamp their downloads
```

**Что сделала ARP:**
- ARP честно обсуждает это в разделе "Примечания" (строки 195-198): "Функция уже существовала: `generateFilename` была реализована в Sprint-36"
- Но в разделе "Отклонения от Step Card" этого ничего нет!

**Вывод:** Отклонение есть, но оно скрыто. ARP нарушает проектное требование об честности деviations.

### 3. E2E тесты не полностью верифицируют требование

**Requirement Step Card:**
```
- [ ] E2E: click Export → downloaded file has timestamp
- [ ] E2E: timestamp format is YYYY-MM-DD_HH-mm-ss
- [ ] E2E: export twice → different timestamps
```

**Что делают E2E тесты** (`export-timestamps.spec.ts`):
- Перехватывают API `POST /api/export` request
- Проверяют POST data: `postData.filename` содержит timestamp
- НЕ проверяют скачанный файл

**Пример теста (строки 62-76):**
```typescript
const requestPromise = page.waitForRequest((request) =>
  request.url().includes("/api/export"),
);
await exportButton.click();
const request = await requestPromise;
const postData = request.postDataJSON();
exportFilename = postData.filename || "";
// ← Проверяем filename в request, не файл на диске!
```

**Проблема:** 
- Тест проверяет, что **client** отправляет правильный filename
- Не проверяет, что **server** скачивает файл с этим именем
- Плацеболо-верификация: может быть, API получит filename, но скачает что-то другое?

**Вывод:** E2E недостаточны для полной верификации requirement'а. Нужна либо mock-проверка скачивания (Playwright `download` event), либо реальный HTTP запрос к running server с проверкой `Content-Disposition` header.

### 4. Отсутствие поля scope в Step Card

**STEP_CARD_TEMPLATE.yml требует:**
```yaml
scope:
  allowed_paths:
    - "" 
  forbidden_paths:
    - ""
```

**Этот Step Card:** не содержит этого раздела вообще.

**Сравнение:** Sprint-36-Step-01 имеет правильное поле (начинается со строки 18).

**Вывод:** Step Card неправильно отформатирован.

---

## GIT STATUS ANALYSIS

**Изменённые файлы:**
```
M  docs/project/CRITICAL_FEATURES.md         ← added Sprint-37: 4 functions
?? apps/studio/e2e/export-timestamps.spec.ts ← NEW test file
```

**Файлы, НЕ изменённые (но Step Card требовал):**
```
apps/studio/src/components/ExportDialog.tsx   ← Step Card требовал, но уже был изменен в Sprint-36
apps/studio/src/app/page.tsx                  ← Step Card требовал, но уже был изменен в Sprint-36
```

**git diff —stat:** только CRITICAL_FEATURES.md (15 строк добавлено).

**Вывод:** Actual implementation соответствует тому, что ARP описывает: E2E тесты + CRITICAL_FEATURES обновлена. Но это НЕ соответствует Step Card (в котором говорится про реализацию функции).

---

## ARCHITECTURAL CONSISTENCY CHECK

Никаких нарушений ADRs не найдено. Функция `generateFilename` соответствует ADR-0012 (двой-режимный хранилище) — timestamp генерируется client-side, передаётся server'у через POST body.

---

## NEXT STEP

**Требуется остановка выполнения.** Это не `FIX` (не «поправить текущий Step Card»), а `STOP` («человек должен решить»):

1. **Перенумеровать** Sprint-37-Step-02_Export-Filenames-Timestamps.md → Sprint-37-Step-03
2. **Обновить Step Card** на основе фактического состояния:
   - Функция `generateFilename` уже существует → переформулировать objective ("Добавить E2E тесты для..." вместо "Реализовать функцию...")
   - Добавить раздел `scope` с `allowed_paths` и `forbidden_paths`
3. **Переделать E2E тесты** так, чтобы они проверяли скачиваемый файл (не только API request):
   - Использовать Playwright `page.on('download', ...)` или мокировать файловую систему
   - ИЛИ запустить реальный сервер и проверить `Content-Disposition` header
4. **Переделать ARP** с честным разделом "Отклонения" (указав, что функция была уже готовой)

Только после этого Step Card может быть переведена в очередь review как `Sprint-37-Step-03`.

---

**Примечание для следующей сессии:** Коммит aa60646 (архивирование Step-02) был создан с ошибкой — он архивировал одну Step-02, но эта новая Step-02 была создана после. Это создало коллизию. Нужна рёбра в процессе планирования Sprint — убедиться, что Step Card создаются с правильными номерами до начала реализации.
