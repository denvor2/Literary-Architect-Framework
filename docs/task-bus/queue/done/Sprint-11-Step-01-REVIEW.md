# REVIEW — Sprint-11-Step-01

## STATUS

OK, с одним санкционированным добавлением перед коммитом (не
FIX-цикл — это исправление МОЕЙ ошибки в Step Card, не вашей)

## Про коллизию selectBook

Подтверждаю: это мой недосмотр, не ваше самовольное решение — вы
выполнили ровно то, что было продиктовано, и правильно, что явно
флагировали эффект, а не разрешили его молча в любую сторону.

Причина глубже, чем просто "разная сигнатура под одним именем" — это
действительно два разных действия ("вернуться к обзору текущей
книги" vs "переключить активную книгу"), которым с самого начала
нужны разные имена, не перегрузка одного. Решение: оставить
`selectBook(bookId: string)` как есть (уже реализовано и проверено),
и восстановить утраченное поведение под новым именем прямо сейчас,
раз файл уже открыт — не откладывать до Step 02.

**Добавь перед коммитом:**

```typescript
// Restores the Sprint-10-Step-04 "return to book overview" behavior,
// lost when selectBook() was repurposed in Sprint-11-Step-01 to mean
// "switch active book" instead. Deliberately does not touch
// activeBookId — only clears the chapter/scene/character selection
// within the currently active book.
function deselectAll() {
  setWorkspace((previous) => ({
    ...previous,
    selectedChapterId: null,
    selectedSceneId: null,
    selectedCharacterId: null,
  }));
}
```

Экспортируй `deselectAll` из хука вместе с остальными. Не нужно
подключать её к UI сейчас (Sidebar/page.tsx — Forbidden paths этого
шага) — просто чтобы функция существовала и не потерялась, когда
Step 02 будет проектировать multi-book навигацию.

## Остальное — без замечаний

- `migrateIfNeeded`: `any` → `unknown` + касты — правильное,
  обоснованное отклонение, поведение идентично.
- Живая проверка миграции — 16/16, включая идемпотентность —
  отличная строгость для самого рискованного шага проекта.
- `NewBookDialog.tsx` type mismatch — верно оставлено на Step 02,
  анализ проблемы точный.
- Все мутационные функции переписаны консистентно по одной схеме.

## RISKS

Нет новых, помимо уже описанных и запланированных на Step 02.

## NEXT STEP

Добавь `deselectAll()`, перепроверь build/lint, затем:
Коммит: "Sprint 11 Step 01: multi-book domain model + storage migration"
Переместить Sprint-11-Step-01.md + ARP в done/.

Далее — Sprint-11-Step-02 (UI: список книг, переключатель,
подключение deselectAll к навигации "вернуться к книге",
исправление NewBookDialog.tsx). Architect добавит Step Card отдельно.
