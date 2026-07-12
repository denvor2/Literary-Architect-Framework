"use client";

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
