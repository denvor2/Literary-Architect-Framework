# Roadmap: Sprint 34-40

Этап: **Story Bible, World Building, Versioning** (7 спринтов, Q3-Q4 2026)

---

## Sprint 34 — Story Bible: Метаданные & архитектура Series/Book

**Definition of Done:**
- ✅ ADR-0016 принята (Story Bible architecture)
- ✅ Prisma schema (Story Bible поля для Series/Book)
- ✅ Domain Model (типы + Repository functions)
- ✅ API endpoints (PUT/GET /api/series/{id}, /api/book/{id})
- ✅ UI: Gear dialogs с 4 табами (Основное, Story Bible, Ограничения, Метаданные)
- ✅ Export: StoryBible.md generation

**Step Cards:** 6 шагов
1. ADR-0016 acceptance
2. Prisma schema migration
3. Domain Model + Repository
4. API endpoints
5. UI (Gear dialogs)
6. Export to Markdown

**Acceptance Criteria:**
- Series может иметь decisions, throughlineElements, seriesConstraints
- Book может иметь mainPlotlines, principle, escalation, themes, bookConstraints
- Book наследует audience/genre от Series если не override
- StoryBible.md генерируется при экспорте с правильной структурой

**Dependencies:** Sprint 33 (Sidebar иерархия)

---

## Sprint 35 — Локации, Артефакты, Граф связей

**Definition of Done:**
- ✅ ADR-0017: Locations, Artifacts, Relationships entities
- ✅ Prisma schema (Location, Artifact, CharacterRelationship)
- ✅ Domain Model + Repository
- ✅ API endpoints
- ✅ UI: Карточки локаций & артефактов (как Characters)
- ✅ UI: Relationship Graph (D3/Cytoscape visualization)
- ✅ Sidebar integration (новые секции)

**Step Cards:** 7 шагов
1. ADR-0017 acceptance
2. Prisma schema (Location, Artifact, CharacterRelationship)
3. Domain Model + Repository
4. API endpoints (/api/location, /api/artifact, /api/relationship)
5. UI: Location cards
6. UI: Artifact cards + Relationship Graph
7. Sidebar integration + live-verify

**Acceptance Criteria:**
- Locations и Artifacts имеют Series/Book level (как Characters)
- Graph показывает персонажей и их связи (friend/enemy/family/business)
- Orphan characters detector (упоминаются в тексте но не в графе)
- Export: Characters.md, Locations.md, Artifacts.md, RelationshipMap.md

**Dependencies:** Sprint 34

---

## Sprint 36 — Верхнее меню (File/Edit/View/Help)

**Definition of Done:**
- ✅ ADR-0022: Menu architecture (existing Step-05 Sprint-33)
- ✅ File menu: New Book, New Series, Export, Logout
- ✅ Edit menu: Undo, Redo, Cut/Copy/Paste, Delete, Select All
- ✅ View menu: Focus Mode, Theme (Light/Dark), Fullscreen
- ✅ Help menu: Keyboard Shortcuts, About dialogs
- ✅ Dialogs: KeyboardShortcutsDialog, AboutDialog

**Step Cards:** 5-6 шагов (переиспользовать Step-05 Sprint-33 как основу)
1. File menu implementation
2. Edit menu implementation
3. View menu implementation
4. Help & About dialogs
5. Live-verify all menus
6. Export integration (connect to Sprint-34/35 Export)

**Acceptance Criteria:**
- Все меню пункты функциональны
- Keyboard shortcuts работают (Ctrl+K, Ctrl+Z, etc)
- Theme toggle persist в localStorage
- Focus mode toggle работает
- File → Export использует экспортер из Sprint-34/35

**Dependencies:** Sprint 34-35 (для Export integrationsee)

---

## Sprint 37 — @mentions в редакторе + Экспорт/Импорт

**Definition of Done:**
- ✅ ADR-0023: @mention system (references to characters/locations/artifacts)
- ✅ Prisma schema (SceneReference entity)
- ✅ Domain Model + Repository
- ✅ API endpoints (/api/scene/{id}/references)
- ✅ UI: @mention autocomplete в редакторе
- ✅ Backend: parsing Scene.text → extract & save references
- ✅ Backlinks: где упоминается персонаж X
- ✅ Export: DOCX/PDF/Markdown с форматированием
- ✅ Import: из DOCX/Markdown обратно в Studio

**Step Cards:** 8-10 шагов
1. ADR-0023 acceptance
2. Prisma schema (SceneReference)
3. Domain Model + Repository
4. API endpoints
5. UI: @mention autocomplete component (React)
6. Reference parsing & extraction
7. Backlinks display (где используется персонаж)
8. Export to DOCX (with formatting)
9. Export to PDF
10. Import from Markdown/DOCX

**Acceptance Criteria:**
- @Character "Jordan" в тексте → clickable reference
- Scene.references автоматически парсятся
- Backlinks показывают все места где упоминается персонаж
- DOCX export сохраняет стили (bold, italic)
- PDF readable и красив
- Import восстанавливает структуру

**Dependencies:** Sprint 34-36

---

## Sprint 38 — Дизайн & Адаптивность (Responsive + Polish)

**Definition of Done:**
- ✅ Mobile layout: Sidebar collapse, Editor responsive, Assistant Panel stack
- ✅ Tablet layout: optimized for 768-1024px
- ✅ Desktop: refined at 1200px+
- ✅ Dark mode: polished, all components correct
- ✅ Icons: lucide-react audit + replacements
- ✅ Performance: lazy loading, code splitting
- ✅ Accessibility: keyboard navigation, ARIA labels

**Step Cards:** 7-8 шагов
1. Responsive audit (mobile/tablet/desktop)
2. Sidebar: collapse toggle для мобильных
3. Editor: text scaling, responsive columns
4. Assistant Panel: stack vs side-by-side
5. Icons audit + lucide replacements
6. Dark mode polish
7. Performance: lazy loading
8. Accessibility: keyboard + ARIA

**Acceptance Criteria:**
- App works on iPhone (320-480px)
- App works on iPad (768-1024px)
- Desktop at 1200px+ looks refined
- All icons from lucide-react
- Dark mode readable on all devices
- Lighthouse score: 90+

**Dependencies:** All prior sprints (comprehensive polish pass)

---

## Sprint 39 — Таймлайн (Series + Book levels)

**Definition of Done:**
- ✅ ADR-0024: Timeline architecture (Series vs Book level)
- ✅ Prisma schema (TimelineEvent, Scene.dayNumber)
- ✅ Domain Model + Repository
- ✅ API endpoints (/api/timeline, /api/timeline/{id})
- ✅ UI: Series Timeline view (horizontal scale, events)
- ✅ UI: Book Timeline view (detailed, scenes with dayNumbers)
- ✅ Conflict detector: нарушения логики времени

**Step Cards:** 7 шагов
1. ADR-0024 acceptance
2. Prisma schema
3. Domain Model + Repository
4. API endpoints
5. UI: Series Timeline visualization
6. UI: Book Timeline + Scenes binding
7. Conflict detector & display

**Acceptance Criteria:**
- Series Timeline показывает события (день 1-N)
- Book Timeline показывает сцены с dayNumbers
- Конфликт: если сцена в гл.3 на день 5, а сцена в гл.1 на день 10 → ⚠️
- Можно редактировать dayNumber для сцены
- Export: Timeline.md включен

**Dependencies:** Sprint 34-38

---

## Sprint 40 — Версионирование (Snapshots & Diff)

**Definition of Done:**
- ✅ ADR-0025: Snapshot architecture (versioning & diff)
- ✅ Prisma schema (BookSnapshot, ChapterSnapshot, SceneSnapshot)
- ✅ Domain Model + Repository
- ✅ API endpoints (/api/snapshot, /api/snapshot/{id}/restore)
- ✅ UI: Snapshot manager (список версий, create)
- ✅ UI: Diff view (Side-by-side, Unified, Word-level)
- ✅ Restore & rollback functionality

**Step Cards:** 8 шагов
1. ADR-0025 acceptance
2. Prisma schema
3. Domain Model + Repository
4. API endpoints
5. UI: Snapshot manager
6. UI: Diff view (Side-by-side mode)
7. Restore & rollback
8. Live-verify (create snapshot → edit → diff → restore)

**Acceptance Criteria:**
- "Save version" кнопка в Header
- Можно создать именованный snapshot
- Diff показывает что изменилось между версиями
- Restore откатывает на выбранную версию
- Side-by-side view показывает оба текста с highlighting
- Export: Versions.md

**Dependencies:** All prior sprints (production-ready features)

---

## Сводная таблица: Сущности & Слои

| Сущность | Series | Book | Export |
|----------|--------|------|--------|
| Story Bible | ✅ S34 | ✅ S34 | StoryBible.md |
| Location | ✅ S35 | ✅ S35 | Locations.md |
| Artifact | ✅ S35 | ✅ S35 | Artifacts.md |
| Relationship | ✅ S35 | ✅ S35 | RelationshipMap.md |
| Timeline | ✅ S39 | ✅ S39 | Timeline.md |
| Reference (@mention) | — | ✅ S37 | in text |
| Snapshot | — | ✅ S40 | Versions.md |

---

## Dependencies & Critical Path

```
Sprint 34 (Story Bible)
  ↓
Sprint 35 (Locations/Artifacts/Graph) — can run in parallel with 36-37
Sprint 36 (Menu)
Sprint 37 (@mentions/Export) — depends on 34 for Export base
  ↓
Sprint 38 (Design & Responsive) — polish all above
  ↓
Sprint 39 (Timeline) — standalone, can be earlier
  ↓
Sprint 40 (Snapshots) — last, most polished
```

---

## Next Steps

1. ✅ Sprint 34 Step Cards ready (move to active/)
2. ⏳ Sprint 35 Step Cards (parallel with 34 execution)
3. ⏳ Финализировать Sprint 36-40 при начале соответствующих спринтов
