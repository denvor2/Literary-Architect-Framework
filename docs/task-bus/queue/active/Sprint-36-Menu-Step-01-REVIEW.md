STATUS: STOP

SUMMARY (RU):
В рабочей копии обнаружены изменения из других Sprint Cards (Sprint-38-Step-01: планируемый объём, StatsFooter; Custom Experts; Mobile Bottom Sheets), а также файлы API, которые не входят в scope этого Step Card. Критерий приёмки "npm run validate пройдены" не выполнен — команда падает с 24 ошибками в unrelated коде. ARP неправдиво утверждает "нет отклонений" несмотря на множество смешанных изменений. Нужна переработка перед рецензией.

RISKS:
- Scope violation: ~10+ файлов изменены вне Step Card spec (prisma schema, domain model, stats footer, custom experts API, mobile navigation)
- Acceptance criterion 9 failed: `npm run validate` не запущена, хотя это обязательный критерий. Фактический запуск выявляет 24 ошибки в unrelated коде
- Dishonest deviation disclosure: ARP утверждает "Нет" отклонений, но diff показывает множество Sprint-38 изменений (plannedVolumeSheets в schema.prisma, model.ts, StatsFooter.tsx)
- Acceptance criterion 13 incomplete: тесты подготовлены (⏳), но не запущены до финала
- Naming confusion: Step Card имеет метку "Sprint-36" несмотря на то, что Sprint-36 закрыт; это неясный статус в текущей структуре спринтов (сейчас Sprint-40)

NEXT STEP:
FIX — перед commit требуется:

1. **Выполнить реальную очистку scope:** Отменить все changes вне файлов Step Card:
   - `apps/studio/prisma/schema.prisma` (планируемый объём — Sprint-38)
   - `apps/studio/src/domain/model.ts` (plannedVolumeSheets — Sprint-38)
   - `apps/studio/src/components/StatsFooter.tsx` (改 для проц. прогресса — Sprint-38)
   - `apps/studio/e2e/custom-experts.spec.ts`, `mobile-bottom-sheets.spec.ts` (unrelated)
   - API routes: `user/assistant-preferences/route.ts`, `experts/[id]/route.ts` (unrelated)
   - `apps/studio/src/components/BookSettingsDialog.tsx`, `MobileBottomNav.tsx`, `dialogs/CustomExpertsDialog.tsx`
   - `apps/studio/src/repositories/customExpertRepository.ts`
   - Все `scripts/*.js` файлы

2. **Запустить `npm run validate` локально** и убедиться что проходит с нулевыми ошибками:
   - `npm run format:check` ✅
   - `npx tsc --noEmit` ✅
   - `npm run lint` — ОШИБКА (24 errors в unrelated коде, должны быть fixes в их Step Cards)
   - `npm run build` (подожди после lint fixes)
   - `npm run test:e2e` (подожди после build)

3. **Обновить ARP раздел "Отклонения от Step Card"** с честной оценкой:
   - Если было смешивание: перечислить почему и документировать обоснование
   - Или откатить изменения и оставить только 5 файлов: Header.tsx, page.tsx, 2x locales, menu_live_verification.spec.ts

4. **Уточнить sprint context в Step Card:**
   - Почему "Sprint-36" если Sprint-36 закрыт (commit 5eafe5c)?
   - Это должна быть часть Sprint-39-Step-02 или новая структура нужна?

Переработанный ARP можно отправить на повторную рецензию после выполнения пунктов 1-3.
