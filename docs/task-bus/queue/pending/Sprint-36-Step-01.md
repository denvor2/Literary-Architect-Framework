id: Sprint-36-Step-01
name: "Section Counters: Add item counters to Sidebar headers"
type: feature

## Objective

Добавить видимые счетчики к заголовкам секций Sidebar, показывающие количество элементов в каждой секции (Книги, Серии, Главы, Персонажи, Идеи).

Примеры:
```
Книга (12)         — 12 книг всего
Серии (3)          — 3 серии всего
Главы (8)          — 8 глав в активной книге
Персонажи (15)     — 15 персонажей в активной книге
Идеи (24)          — 24 идеи в активной книге
```

## Scope

### Allowed paths:
- `apps/studio/src/components/Sidebar.tsx` — добавить счетчики к заголовкам секций
- `apps/studio/src/app/page.tsx` — передать counts как props в Sidebar

### Forbidden:
- Изменения domain model
- Изменения базы данных (schema.prisma)
- Новые расчеты (счетчики уже доступны из существующих данных)

## Validation Checklist

- [ ] Books counter отображает общее количество книг
- [ ] Series counter отображает общее количество серий
- [ ] Chapters counter отображает количество глав в активной книге
- [ ] Characters counter отображает количество персонажей в активной книге
- [ ] Ideas counter отображает количество идей в активной книге
- [ ] Trash badge отображается (обновить счетчик если был добавлен)
- [ ] Счетчики обновляются при добавлении/удалении элементов (real-time)
- [ ] Счетчики сохраняют состояние после refresh
- [ ] Design соответствует UI системе (никаких jarring цветов/шрифтов)
- [ ] Responsive: работает на мобильных/планшетах/десктопах
- [ ] tsc, eslint, prettier clean
- [ ] npm run build успешен

## Output

ARP в docs/task-bus/queue/active/:
1. Code diff (Sidebar.tsx, page.tsx)
2. Screenshots: все секции с счетчиками
3. Video: добавление элемента → счетчик обновляется
4. Validation checklist (✅/❌ для каждого пункта)

## Stop Condition

Все секции Sidebar имеют видимые счетчики, обновляются в real-time, design соответствует UI системе.

## Related

- Sidebar hierarchy от Sprint-29 (Series entity)
- UI design system из Sprint-34
- Live verification technique: `literary-studio-live-verify`
