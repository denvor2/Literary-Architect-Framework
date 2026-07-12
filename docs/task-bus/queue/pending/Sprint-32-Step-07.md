id: Sprint-32-Step-07
name: "Admin UI: просмотр логов с фильтром и поиском"
type: implementation

## Контекст

Steps 02-06 завершили backend логирования (Event таблица, repository, интеграция, API endpoints, автоматизация).
Теперь нужен простой Admin UI компонент для просмотра логов с фильтром и поиском.

Этот UI будет встроен в админскую панель (в Header или отдельной странице).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/components/AdminAuditPanel.tsx (новый компонент)
- apps/studio/src/components/AuditEventRow.tsx (новый компонент — строка лога)
- apps/studio/src/components/AuditFilters.tsx (новый компонент — фильтры)
- apps/studio/src/app/admin/audit/page.tsx (опционально — отдельная страница админки)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/app/api/audit/** (не трогать)
- apps/studio/src/repositories/** (только читать)
- Основной Header или другие UI компоненты (изолированный компонент)

## Rules

### 1. AdminAuditPanel.tsx (main component)

Главный компонент для просмотра логов с фильтром и таблицей.

```typescript
export type AdminAuditPanelProps = {
  className?: string;
};

export function AdminAuditPanel({ className }: AdminAuditPanelProps) {
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Array<{ eventType: string; count: number }>>([]);

  // Fetch events on filter change
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        if (selectedEventType) params.append("eventType", selectedEventType);
        if (userId) params.append("userId", userId);

        const response = await fetch(`/api/audit/events?${params}`);
        const data = await response.json();
        setEvents(data.data);
      } catch (error) {
        console.error("Failed to fetch audit events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [startDate, endDate, selectedEventType, userId]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        if (userId) params.append("userId", userId);

        const response = await fetch(`/api/audit/events/stats?${params}`);
        const data = await response.json();
        setStats(data.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [startDate, endDate, userId]);

  // Filter events by search text
  const filteredEvents = events.filter((event) => {
    if (!searchText) return true;
    const text = searchText.toLowerCase();
    return (
      event.eventType.toLowerCase().includes(text) ||
      event.userId.toLowerCase().includes(text) ||
      JSON.stringify(event.metadata).toLowerCase().includes(text)
    );
  });

  return (
    <div className={`flex flex-col gap-4 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Audit Logs</h2>
        <span className="text-xs text-zinc-500">
          {filteredEvents.length} events
        </span>
      </div>

      {/* Filters */}
      <AuditFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedEventType={selectedEventType}
        onEventTypeChange={setSelectedEventType}
        searchText={searchText}
        onSearchChange={setSearchText}
        userId={userId}
        onUserIdChange={setUserId}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Total Events
          </div>
          <div className="text-lg font-semibold">{filteredEvents.length}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Event Types
          </div>
          <div className="text-lg font-semibold">{stats.length}</div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-sm text-zinc-500">Loading...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-sm text-zinc-500">No events found</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredEvents.map((event) => (
                <AuditEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2. AuditFilters.tsx (filters component)

Компонент с фильтрами: дата, тип события, поиск, пользователь.

```typescript
export type AuditFiltersProps = {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  selectedEventType: string | null;
  onEventTypeChange: (type: string | null) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  userId: string | null;
  onUserIdChange: (id: string | null) => void;
};

export function AuditFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedEventType,
  onEventTypeChange,
  searchText,
  onSearchChange,
  userId,
  onUserIdChange,
}: AuditFiltersProps) {
  const eventTypes = [
    "login_success",
    "login_failure",
    "logout",
    "register_success",
    "book_created",
    "book_updated",
    "book_deleted",
    "chapter_created",
    "chapter_updated",
    "chapter_deleted",
    "scene_created",
    "scene_updated",
    "scene_deleted",
    "ai_request_line_editor",
    "ai_request_critic",
    "ai_request_reader",
    "ai_request_coauthor",
    "subscription_created",
    "subscription_updated",
    "subscription_expired",
    "subscription_cancelled",
    "payment_created",
    "payment_completed",
    "payment_failed",
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Date Range */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            From
          </label>
          <input
            type="datetime-local"
            value={startDate.toISOString().slice(0, 16)}
            onChange={(e) => onStartDateChange(new Date(e.target.value))}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            To
          </label>
          <input
            type="datetime-local"
            value={endDate.toISOString().slice(0, 16)}
            onChange={(e) => onEndDateChange(new Date(e.target.value))}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Event Type Filter */}
      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Event Type
        </label>
        <select
          value={selectedEventType || ""}
          onChange={(e) => onEventTypeChange(e.target.value || null)}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* User ID Filter */}
      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          User ID
        </label>
        <input
          type="text"
          value={userId || ""}
          onChange={(e) => onUserIdChange(e.target.value || null)}
          placeholder="Filter by user ID..."
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {/* Search */}
      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Search
        </label>
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in event type, user, metadata..."
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>
    </div>
  );
}
```

### 3. AuditEventRow.tsx (event row component)

Строка таблицы с деталями события.

```typescript
export type AuditEventRowProps = {
  event: Event;
};

export function AuditEventRow({ event }: AuditEventRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 text-xs font-medium text-zinc-500">
          {new Date(event.createdAt).toLocaleTimeString()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-xs font-medium">{event.eventType}</div>
          <div className="truncate text-xs text-zinc-500">{event.userId}</div>
        </div>
        <div className="text-xs text-zinc-400">
          {expanded ? "▼" : "▶"}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs">
            <div className="mb-1 font-medium">Event ID: {event.id}</div>
            <div className="mb-1 font-medium">User ID: {event.userId}</div>
            <div className="mb-1 font-medium">
              Created: {new Date(event.createdAt).toISOString()}
            </div>
            {event.metadata && (
              <div className="mb-1">
                <div className="font-medium">Metadata:</div>
                <pre className="overflow-auto rounded bg-black/10 p-1 text-xs dark:bg-white/10">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

## Integration Points

- AdminAuditPanel может быть встроен в отдельную страницу `/admin/audit` или в админскую панель Header
- Используется GET /api/audit/events (admin-only) и GET /api/audit/events/stats
- Компоненты используют zinc палитру (консистентны с существующим UI)

## Validation

1. **TypeScript:**
```bash
npx tsc --noEmit
```
- Никаких ошибок в компонентах

2. **ESLint:**
```bash
npx eslint src/components/Admin*
```

3. **Visual testing (npm run dev):**
- AdminAuditPanel отображается корректно
- Фильтры работают (дата, тип события, поиск, юзер)
- Таблица логов показывает события
- Расширение строки показывает полные детали
- Dark mode: все цвета имеют dark: пары
- Responsive: работает на мобильных (фильтры stacked, таблица scrollable)

## Stop Condition

Не коммитить без проверки, что:
- Фильтры работают и обновляют результаты в реальном времени
- Поиск фильтрует события по тексту
- Раскрытие строки показывает полные детали (включая metadata JSON)
- UI соответствует zinc design system проекта (no new colors)
