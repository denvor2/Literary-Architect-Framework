id: Sprint-35-Menu-Step-01
name: "File меню: Новая книга, Серия, Экспорт, Выход"
type: implementation

## Objective

Реализовать **File** меню с пунктами:

```
📁 Файл
├── ➕ Новая книга          → onNewBook()
├── ➕ Новая серия          → onCreateSeries()
├── ─────────────────
├── 💾 Сохранить            → saveWorkspace() (auto-save)
├── 💾 Сохранить как        → SaveAsDialog (manual save)
├── 📂 Открыть              → OpenDialog (из архива экспорта)
├── 📥 Импорт               → ImportDialog (FB2, DOCX)
├── ─────────────────
├── 📤 Экспорт              → ExportDialog (defer to Sprint-36)
├── ─────────────────
└── 🚪 Выход                → logout()
```

## Scope

### Allowed paths:
- apps/studio/src/components/Header.tsx (добавить меню dropdown)
- apps/studio/src/app/page.tsx (pass callbacks)

### Forbidden:
- Export логика (отдельный step)
- API changes

## Implementation

**Header.tsx:**
- Добавить меню dropdown
- "Файл" кнопка → toggle menu
- Клик на пункт → execute callback

**Callbacks из page.tsx:**
- `onNewBook` — создаёт книгу
- `onCreateSeries` — создаёт серию
- `onSave` — saveWorkspace() (уже автосохраняется, но юзер может вызвать вручную)
- `onSaveAs` — открыть SaveAsDialog (новый)
- `onOpen` — открыть OpenDialog (новый)
- `onImport` — открыть ImportDialog (новый)
- `onExport` — placeholder (defer to Sprint-36)
- `onLogout` — logout из useAuthController

**Dialogs (новые компоненты):**
- SaveAsDialog: input название, button "Сохранить" → save snapshot
- OpenDialog: выбрать файл .zip экспорта → load project
- ImportDialog: выбрать FB2 или DOCX → parse → create Book

## Validation

1. Меню открывается/закрывается
2. "Новая книга" → создаёт новую книгу в Sidebar
3. "Новая серия" → открывает диалог создания серии
4. "Сохранить" → вызывает save (может быть no-op if auto-save)
5. "Сохранить как" → открывает SaveAsDialog
6. "Открыть" → открывает OpenDialog (выбрать .zip)
7. "Импорт" → открывает ImportDialog (FB2/DOCX)
8. "Выход" → logout, редирект на login

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншоты File меню
2. Скриншоты SaveAsDialog, OpenDialog, ImportDialog
3. Скриншот создания книги через Импорт (FB2/DOCX)
4. Результат build

## Notes

- SaveAs/Open/Import диалоги — placeholder (реальная логика в Sprint-36 Export)
- Импорт FB2/DOCX требует parser (может быть defer или базовый placeholder)

## Stop Condition

File меню готово с всеми пунктами (диалоги могут быть stub, кроме функциональности).
