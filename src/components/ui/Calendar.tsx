import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';

export interface LeaveEntry {
  date: string;
  userName: string;
  leaveTypeName: string;
  color?: string;
}

export interface HolidayEntry {
  name: string;
  date: string | Date;
}

export interface CalendarProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  holidays?: HolidayEntry[];
  leaveEntries?: LeaveEntry[];
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const Calendar: React.FC<CalendarProps> = ({
  year,
  month,
  holidays = [],
  leaveEntries = [],
  onMonthChange,
  className,
}) => {
  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holidays) {
      const d = h.date instanceof Date ? h.date : new Date(h.date);
      map.set(toDateKey(d), h.name);
    }
    return map;
  }, [holidays]);

  const leaveMap = useMemo(() => {
    const map = new Map<string, LeaveEntry[]>();
    for (const entry of leaveEntries) {
      const key = entry.date; // expected format: YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [leaveEntries]);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const monthLabel = firstDay.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrev = () => {
    if (!onMonthChange) return;
    const prev = new Date(year, month - 1, 1);
    onMonthChange(prev.getFullYear(), prev.getMonth());
  };

  const handleNext = () => {
    if (!onMonthChange) return;
    const next = new Date(year, month + 1, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // fill trailing blanks to complete the grid
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <button
          onClick={handlePrev}
          className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Previous month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-800">{monthLabel}</h3>
        <button
          onClick={handleNext}
          className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Next month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[4rem] border-b border-r border-gray-50" />;
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const holidayName = holidayMap.get(dateKey);
          const isHoliday = !!holidayName;
          const entries = leaveMap.get(dateKey) || [];
          const today = new Date();
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[4rem] border-b border-r border-gray-50 p-1',
                isHoliday && 'bg-gray-50',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday && 'bg-brand-primary font-bold text-white',
                  !isToday && isHoliday && 'text-gray-400',
                  !isToday && !isHoliday && 'text-gray-700',
                )}
              >
                {day}
              </span>
              {holidayName && (
                <div
                  className="mt-0.5 truncate rounded bg-gray-200 px-1 py-0.5 text-[10px] font-medium text-gray-600"
                  title={holidayName}
                >
                  {holidayName}
                </div>
              )}
              <div className="mt-0.5 space-y-0.5">
                {entries.slice(0, 2).map((entry, i) => (
                  <div
                    key={i}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: entry.color || '#2C5F7C' }}
                    title={`${entry.userName} - ${entry.leaveTypeName}`}
                  >
                    {entry.userName.split(' ')[0]}
                  </div>
                ))}
                {entries.length > 2 && (
                  <div className="px-1 text-[10px] text-gray-400">
                    +{entries.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
