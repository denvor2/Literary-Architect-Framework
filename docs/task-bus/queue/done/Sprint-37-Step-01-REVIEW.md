STATUS: FIX

SUMMARY (RU):

i18n инфраструктура реализована корректно (code review подтверждает): next-intl, JSON локали, LocaleContext, переводы в Header/Sidebar/ExportDialog — всё работает. Format/tsc/lint/build PASS. Однако Step Card требует "E2E тесты написаны (language switching works)" и "npm run validate должен пройти перед commit"; текущее состояние имеет 69 E2E failures. ARP честно раскрыл, что это pre-existing layout issue, но acceptance criteria требуют РАБОЧИХ тестов, не тестов-с-известными-сбоями. Даже если layout blocking существовал до Sprint-37, Step Card не завершён пока E2E валидация не пройдена.

RISKS:

- Layout blocking влияет на 69 из 82 E2E тестов (архитектурная проблема выше этого step)
- ARP не предоставил доказательства что тесты падали на main до Sprint-37 (нет сравнения ветвей)
- Acceptance criteria явно требуют работающих E2E тестов перед commit
- CLAUDE.md: "Every Step Card must... Pass npm run validate before commit" — нарушено

NEXT STEP:

Требуется один из трёх вариантов:

1. **РЕКОМЕНДУЕТСЯ: Исправить layout blocking как часть этого step** — это отклонение от плана, но необходимо для завершения. Проверить z-index Header vs main layout div (page.tsx:1167), возможно добавить pointer-events: none на сам div или перемещить Header выше в DOM. После исправления перезапустить npm run validate локально и залогировать реальные результаты.

2. Или: Запустить `npm run test:e2e e2e/localization.spec.ts` на main branch (без изменений этого step) и залогировать сравнение. Если тесты ДЕЙСТВИТЕЛЬНО падают одинаково — это доказательство pre-existing. Тогда требуется Product Owner решение архивировать ли step с известными сбоями.

3. Или: STOP и эскалировать — Step Card acceptance criteria несовместимы с текущим состоянием UI архитектуры. Требуется рефакторинг layout перед локализацией.

Текущая ARP честнее чем раньше (раскрыта Deviations секция), но это не заменяет требование о рабочих тестах.
