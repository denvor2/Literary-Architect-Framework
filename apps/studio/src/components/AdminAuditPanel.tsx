"use client";

import { useState, useEffect } from "react";
import { AuditFilters } from "@/components/AuditFilters";
import { AuditEventRow } from "@/components/AuditEventRow";
import { useLocaleContext } from "@/context/LocaleContext";
import type { Event } from "@/generated/prisma/client";

export type AdminAuditPanelProps = {
  className?: string;
};

export function AdminAuditPanel({ className }: AdminAuditPanelProps) {
  const { t } = useLocaleContext();
  const [startDate, setStartDate] = useState<Date>(
    () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
  );
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<
    Array<{ eventType: string; count: number }>
  >([]);

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
        setEvents(data.data || []);
      } catch (error) {
        console.error("Failed to fetch audit events:", error);
        setEvents([]);
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
        setStats(data.data || []);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats([]);
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
    <div className={`flex flex-col gap-4 p-4 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("audit.title")}</h2>
        <span className="text-xs text-zinc-500">
          {filteredEvents.length} {t("audit.events_label")}
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
            {t("audit.total_events")}
          </div>
          <div className="text-lg font-semibold">{filteredEvents.length}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("audit.event_types")}
          </div>
          <div className="text-lg font-semibold">{stats.length}</div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-sm text-zinc-500">
                {t("audit.loading")}
              </span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-sm text-zinc-500">
                {t("audit.no_events_found")}
              </span>
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
