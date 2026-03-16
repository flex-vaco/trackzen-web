import React, { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Calendar, type LeaveEntry } from '../components/ui/Calendar';
import { useLeaveCalendar } from '../hooks/useLeaveCalendar';
import { useHolidays } from '../hooks/useHolidays';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { CalendarEntry, Holiday } from '../types';

/* ---------- helpers ---------- */

const LEAVE_TYPE_COLORS: Record<string, string> = {
  'Annual Leave': '#2C5F7C',
  'Sick Leave': '#E85D4A',
  'Personal Leave': '#F5A623',
  'Maternity Leave': '#8B5CF6',
  'Paternity Leave': '#3B82F6',
  'Unpaid Leave': '#6B7280',
  'Work From Home': '#10B981',
  'Compensatory Off': '#EC4899',
};

function getLeaveColor(typeName: string): string {
  return LEAVE_TYPE_COLORS[typeName] ?? '#2C5F7C';
}

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

/* ---------- Legend ---------- */

interface LegendProps {
  entries: CalendarEntry[];
}

function CalendarLegend({ entries }: LegendProps) {
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    entries.forEach((e) => types.add(e.leaveTypeName));
    return Array.from(types);
  }, [entries]);

  if (uniqueTypes.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {uniqueTypes.map((type) => (
        <div key={type} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: getLeaveColor(type) }}
          />
          <span className="text-xs text-gray-600">{type}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-gray-200" />
        <span className="text-xs text-gray-600">Holiday</span>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

export default function LeaveCalendarPage() {
  const { showToast } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [memberFilter, setMemberFilter] = useState('ALL');

  const { from, to } = useMemo(() => getMonthRange(year, month), [year, month]);

  // Data fetching
  const { data: calendarData, isLoading: calendarLoading, error: calendarError } = useLeaveCalendar(from, to);
  const { data: holidaysData, isLoading: holidaysLoading, error: holidaysError } = useHolidays(year);

  // Show errors via toast
  React.useEffect(() => {
    if (calendarError) showToast(getErrorMessage(calendarError), 'error');
    if (holidaysError) showToast(getErrorMessage(holidaysError), 'error');
  }, [calendarError, holidaysError, showToast]);

  // Derived data
  const calendarEntries: CalendarEntry[] = calendarData?.data ?? [];
  const holidays: Holiday[] = holidaysData?.data ?? [];

  // Unique team members for filter
  const teamMembers = useMemo(() => {
    const map = new Map<number, string>();
    calendarEntries.forEach((e) => map.set(e.userId, e.userName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [calendarEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (memberFilter === 'ALL') return calendarEntries;
    return calendarEntries.filter((e) => e.userId === parseInt(memberFilter, 10));
  }, [calendarEntries, memberFilter]);

  // Transform to Calendar component format
  const leaveEntries: LeaveEntry[] = useMemo(
    () =>
      filteredEntries.map((e) => ({
        date: e.date,
        userName: e.userName,
        leaveTypeName: e.leaveTypeName,
        color: getLeaveColor(e.leaveTypeName),
      })),
    [filteredEntries],
  );

  // Transform holidays to Date[]
  const holidayDates: Date[] = useMemo(
    () => holidays.map((h) => new Date(h.date)),
    [holidays],
  );

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const isLoading = calendarLoading || holidaysLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            View team leave schedule and holidays at a glance.
          </p>
        </div>

        {/* Team member filter */}
        {teamMembers.length > 0 && (
          <Select
            options={[
              { value: 'ALL', label: 'All Team Members' },
              ...teamMembers.map(([id, name]) => ({
                value: String(id),
                label: name,
              })),
            ]}
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-48"
          />
        )}
      </div>

      {/* Legend */}
      <CalendarLegend entries={calendarEntries} />

      {/* Calendar */}
      <Calendar
        year={year}
        month={month}
        holidays={holidayDates}
        leaveEntries={leaveEntries}
        onMonthChange={handleMonthChange}
      />

      {/* Summary */}
      {filteredEntries.length === 0 && (
        <div className="rounded-xl bg-white px-5 py-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">No approved leave entries for this month.</p>
        </div>
      )}
    </div>
  );
}
