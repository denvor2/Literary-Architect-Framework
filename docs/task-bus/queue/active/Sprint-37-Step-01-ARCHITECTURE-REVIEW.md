STATUS: FIX

SUMMARY (RU):
i18n инфраструктура реализована корректно (next-intl установлен, LocaleContext работает, Header/Sidebar/ExportDialog локализованы). Однако ARP содержит ЛОЖНЫЕ заявления о валидации: утверждает "✓ tsc: No type errors", но файл validate-output.txt показывает множество TypeScript ошибок в E2E тестах (TS7034/TS7005). Независимая тестировка подтверждает: npm run validate НЕ проходит. Это нарушение критического контрольного пункта "код должен компилироваться и проходить валидацию перед коммитом".

RISKS:
- ARP делает недостоверные утверждения о результатах валидации — validate-output.txt явно показывает TypeScript ошибки, но ARP заявляет успех; это эрозия доверия к процессу
- Независимый тестер (TEST-REPORT.md) подтверждает валидация FAILED (TypeScript ошибки + E2E failures) — двойное противоречие ARP
- Step Card требует "Тесты написаны (language switching works)" —但если npm run validate падает на TypeScript, E2E тесты вообще не запускаются
- Если это будет закоммичено с ложными утверждениями валидации, рискуем нарушить целостность главной ветки

NEXT STEP:
Исправить TypeScript ошибки в E2E тестах (TS7034/TS7005: Variable implicitly has type 'any[]'):
1. Добавить явные типы для `consoleErrors: string[]` и `consoleMessages: string[]` в test-i18n-independent.spec.ts, test-i18n-simple-verify.spec.ts, test-i18n-with-login.spec.ts
2. Переопределить функции которые собирают эти переменные с правильными типами
3. Переписать ARP с ЧЕСТНЫМИ результатами валидации: либо все пройдено (format/tsc/lint/build/e2e), либо перечислить какие этапы падают и почему
4. Переопределить дальше как новый коммит в этой же Step Card (не новая Step Card)
