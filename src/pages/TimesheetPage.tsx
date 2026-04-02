import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import {
  useCreateTimesheet,
  useSubmitTimesheet,
  useCopyPreviousWeek,
  useAddTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from '../hooks/useTimesheets';
import { useProjects } from '../hooks/useProjects';
import { useHolidays } from '../hooks/useHolidays';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timesheetsService } from '../services/timesheets.service';
import { exportMonthly } from '../services/reports.service';
import { leaveService } from '../services/leave.service';
import { teamService } from '../services/team.service';
import { usersService } from '../services/users.service';
import {
  getWeekStart,
  getWeekEnd,
  nextWeek,
  prevWeek,
  formatDateRange,
  formatISO,
  getDayLabels,
} from '../utils/dateHelpers';
import { formatHours, parseHours } from '../utils/formatHours';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { TimeEntry, TimesheetStatus, Project, Holiday } from '../types';

/* ---------- constants ---------- */

const STATUS_VARIANT: Record<TimesheetStatus, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const DAY_KEYS = ['monHours', 'tueHours', 'wedHours', 'thuHours', 'friHours', 'satHours', 'sunHours'] as const;
const DAY_DESC_KEYS = ['monDesc', 'tueDesc', 'wedDesc', 'thuDesc', 'friDesc', 'satDesc', 'sunDesc'] as const;
const DAY_TIMEOFF_KEYS = ['monTimeOff', 'tueTimeOff', 'wedTimeOff', 'thuTimeOff', 'friTimeOff', 'satTimeOff', 'sunTimeOff'] as const;
type DayDescKey = (typeof DAY_DESC_KEYS)[number];
type DayTimeOffKey = (typeof DAY_TIMEOFF_KEYS)[number];
const STANDARD_HOURS = 8;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getHolidayFlags(weekStart: Date, holidays: Holiday[]): { isHoliday: boolean; name?: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const match = holidays.find((h) => {
      const hDate = typeof h.date === 'string' ? new Date(h.date) : h.date;
      return isSameDay(day, hDate);
    });
    return { isHoliday: !!match, name: match?.name };
  });
}

function getLeaveFlags(
  weekStart: Date,
  approvedLeave: { startDate: string; endDate: string; leaveType?: { name: string } }[],
): { isLeaveDay: boolean; leaveTypeName?: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = formatISO(day);
    const match = approvedLeave.find((lr) => {
      const start = lr.startDate.split('T')[0];
      const end = lr.endDate.split('T')[0];
      return dayStr >= start && dayStr <= end;
    });
    return { isLeaveDay: !!match, leaveTypeName: match?.leaveType?.name };
  });
}

/* ---------- main page ---------- */

export default function TimesheetPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [timesheetId, setTimesheetId] = useState<number | undefined>(() => {
    const id = searchParams.get('id');
    return id ? parseInt(id) : undefined;
  });

  // Add-entry modal state
  const [addEntryDayIndex, setAddEntryDayIndex] = useState<number | null>(null);
  const [addEntryProjectId, setAddEntryProjectId] = useState<number | undefined>();
  const [addEntryDesc, setAddEntryDesc] = useState('');
  const [addEntryHours, setAddEntryHours] = useState(String(STANDARD_HOURS));
  const [addEntryTimeOff, setAddEntryTimeOff] = useState('0');
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);

  // Download monthly state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadUserId, setDownloadUserId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: teamMembersRaw } = useQuery({
    queryKey: ['download-team-members', user?.role],
    queryFn: () => user?.role === 'ADMIN' ? usersService.list() : teamService.getMyReports(),
    enabled: isManagerOrAdmin,
  });
  const teamMembers: { id: number; name: string }[] = teamMembersRaw?.data ?? [];

  const createTimesheet = useCreateTimesheet();
  const submitTimesheet = useSubmitTimesheet();
  const copyPrevWeek = useCopyPreviousWeek();
  const addEntryMut = useAddTimeEntry(timesheetId ?? 0);
  const updateEntryMut = useUpdateTimeEntry(timesheetId ?? 0);
  const deleteEntryMut = useDeleteTimeEntry(timesheetId ?? 0);

  const { data: projectsData } = useProjects();
  const { data: holidaysData } = useHolidays(currentWeekStart.getFullYear());
  const projects: Project[] = projectsData?.data ?? [];
  const holidays: Holiday[] = holidaysData?.data ?? [];

  const weekEnd = getWeekEnd(currentWeekStart);
  const dayLabels = getDayLabels(currentWeekStart);
  const holidayFlags = useMemo(() => getHolidayFlags(currentWeekStart, holidays), [currentWeekStart, holidays]);

  const weekStartISO = formatISO(currentWeekStart);
  const weekEndISO = formatISO(weekEnd);
  const { data: approvedLeaveData } = useQuery({
    queryKey: ['my-approved-leave', weekStartISO, weekEndISO],
    queryFn: () => leaveService.list({ status: 'APPROVED', limit: 100 }),
    select: (res: Record<string, unknown>) =>
      (res?.data ?? []) as { startDate: string; endDate: string; leaveType?: { name: string } }[],
  });
  const leaveFlags = useMemo(
    () =>
      approvedLeaveData
        ? getLeaveFlags(currentWeekStart, approvedLeaveData)
        : Array.from({ length: 7 }, () => ({ isLeaveDay: false as const })),
    [currentWeekStart, approvedLeaveData],
  );

  const { data: timesheet, isLoading } = useQuery({
    queryKey: ['timesheets', timesheetId],
    queryFn: () => timesheetsService.getById(timesheetId!),
    enabled: !!timesheetId,
    select: (res: Record<string, unknown>) => res.data as Record<string, unknown>,
  });

  const loadWeek = useCallback(async () => {
    const weekStartStr = formatISO(currentWeekStart);
    try {
      const existing = await timesheetsService.list({ page: 1, limit: 50 });
      const list = (existing?.data ?? []) as Array<{ id: number; weekStartDate: string }>;
      const found = list.find((t) => t.weekStartDate.startsWith(weekStartStr));
      if (found) {
        setTimesheetId(found.id);
        setSearchParams({ id: String(found.id) });
      } else {
        setTimesheetId(undefined);
        setSearchParams({});
      }
    } catch {
      setTimesheetId(undefined);
      setSearchParams({});
    }
  }, [currentWeekStart, setSearchParams]);

  useEffect(() => {
    if (!searchParams.get('id')) loadWeek();
  }, [currentWeekStart]); // eslint-disable-line

  // When timesheet loaded by ID, sync week navigator
  useEffect(() => {
    if (timesheet) {
      const tsWeekStart = getWeekStart(new Date(timesheet.weekStartDate as string));
      if (!isSameDay(tsWeekStart, currentWeekStart)) {
        setCurrentWeekStart(tsWeekStart);
      }
    }
  }, [timesheet?.id]); // eslint-disable-line

  const handleDownloadMonthlyClick = () => {
    if (isManagerOrAdmin) {
      setDownloadUserId(String(user?.userId ?? ''));
      setDownloadModalOpen(true);
    } else {
      doDownloadMonthly(user?.userId);
    }
  };

  const doDownloadMonthly = async (targetUserId?: number) => {
    setIsExporting(true);
    try {
      const yr = currentWeekStart.getFullYear();
      const mo = currentWeekStart.getMonth() + 1;
      await exportMonthly(targetUserId ?? user!.userId, yr, mo);
      showToast('Monthly timesheet downloaded', 'success');
      setDownloadModalOpen(false);
    } catch {
      showToast('Failed to download monthly timesheet', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const tsStatus = (timesheet?.status as TimesheetStatus) ?? 'DRAFT';
  const canEdit = !timesheet || tsStatus === 'DRAFT' || tsStatus === 'REJECTED';
  const entries = ((timesheet?.timeEntries as TimeEntry[]) ?? []);
  const totalHours = (timesheet?.totalHours as number) ?? 0;
  const billableHours = (timesheet?.billableHours as number) ?? 0;

  const totalTimeOff = useMemo(
    () => entries.reduce(
      (sum, e) => sum + DAY_TIMEOFF_KEYS.reduce((s, k) => s + ((e[k] as number | undefined) ?? 0), 0),
      0,
    ),
    [entries],
  );

  // Group entries by day
  const entriesByDay = useMemo(
    () => DAY_KEYS.map((key, i) => {
      const timeOffKey = DAY_TIMEOFF_KEYS[i];
      return entries.filter((e) => (e[key] as number) > 0 || ((e[timeOffKey] as number | undefined) ?? 0) > 0);
    }),
    [entries],
  );

  const dayTotals = useMemo(
    () => DAY_KEYS.map((key, i) => entriesByDay[i].reduce((sum, e) => sum + (e[key] as number), 0)),
    [entriesByDay],
  );

  const totalOvertime = useMemo(
    () => dayTotals.reduce((sum, h) => sum + Math.max(0, h - STANDARD_HOURS), 0),
    [dayTotals],
  );
  const totalRegularTime = Math.max(0, totalHours - totalOvertime);

  /* ---- Handlers ---- */

  const handleCreateForWeek = async () => {
    try {
      const res = await createTimesheet.mutateAsync({ weekStartDate: formatISO(currentWeekStart) });
      const newId = res?.data?.id;
      if (newId) {
        setTimesheetId(newId);
        setSearchParams({ id: String(newId) });
      }
      showToast('Timesheet created', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleCopyPrevWeek = async () => {
    try {
      const res = await copyPrevWeek.mutateAsync({ weekStartDate: formatISO(currentWeekStart) });
      const newId = res?.data?.id;
      if (newId) {
        setTimesheetId(newId);
        setSearchParams({ id: String(newId) });
      }
      showToast('Previous week copied', 'success');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setConfirmOverwriteOpen(true);
      } else {
        showToast(getErrorMessage(err), 'error');
      }
    }
  };

  const handleConfirmOverwrite = async () => {
    setConfirmOverwriteOpen(false);
    try {
      const res = await copyPrevWeek.mutateAsync({ weekStartDate: formatISO(currentWeekStart), force: true });
      const newId = res?.data?.id;
      if (newId) {
        setTimesheetId(newId);
        setSearchParams({ id: String(newId) });
      }
      showToast('Previous week copied (overwritten)', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleSubmit = async () => {
    if (!timesheetId) return;
    if (entries.length === 0) {
      showToast('Cannot submit an empty timesheet. Add at least one entry.', 'error');
      return;
    }
    if (totalHours === 0 && totalTimeOff === 0) {
      showToast('Cannot submit a timesheet with zero hours.', 'error');
      return;
    }
    try {
      await submitTimesheet.mutateAsync(timesheetId);
      showToast('Timesheet submitted for approval', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const closeAddEntry = () => {
    setAddEntryDayIndex(null);
    setAddEntryProjectId(undefined);
    setAddEntryDesc('');
    setAddEntryHours(String(STANDARD_HOURS));
    setAddEntryTimeOff('0');
  };

  const handleAddDayEntry = async () => {
    if (!timesheetId || addEntryDayIndex === null || !addEntryProjectId) return;
    const dayKey = DAY_KEYS[addEntryDayIndex];
    const dayDescKey = DAY_DESC_KEYS[addEntryDayIndex];
    const dayTimeOffKey = DAY_TIMEOFF_KEYS[addEntryDayIndex];
    const hours = parseHours(addEntryHours);
    const timeOff = parseInt(addEntryTimeOff, 10) || 0;

    const existingEntry = entries.find((e) => e.projectId === addEntryProjectId);
    try {
      if (existingEntry) {
        await updateEntryMut.mutateAsync({
          entryId: existingEntry.id,
          dto: {
            [dayKey]: hours,
            [dayTimeOffKey]: timeOff,
            ...(addEntryDesc ? { [dayDescKey]: addEntryDesc } : {}),
          },
        });
      } else {
        await addEntryMut.mutateAsync({
          projectId: addEntryProjectId,
          billable: true,
          [dayDescKey]: addEntryDesc || undefined,
          [dayKey]: hours,
          [dayTimeOffKey]: timeOff,
        });
      }
      closeAddEntry();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteDayEntry = async (entry: TimeEntry, dayIndex: number) => {
    const dayKey = DAY_KEYS[dayIndex];
    const otherDaysHaveHours = DAY_KEYS.some((k, i) => i !== dayIndex && (entry[k] as number) > 0);
    try {
      if (otherDaysHaveHours) {
        await updateEntryMut.mutateAsync({ entryId: entry.id, dto: { [dayKey]: 0 } });
      } else {
        deleteEntryMut.mutate(entry.id);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleHoursChange = async (entry: TimeEntry, day: (typeof DAY_KEYS)[number], value: string) => {
    const hours = parseHours(value);
    try {
      await updateEntryMut.mutateAsync({ entryId: entry.id, dto: { [day]: hours } });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDescriptionChange = async (entry: TimeEntry, dayDescKey: DayDescKey, value: string) => {
    try {
      await updateEntryMut.mutateAsync({ entryId: entry.id, dto: { [dayDescKey]: value } });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleTimeOffChange = async (entry: TimeEntry, dayTimeOffKey: DayTimeOffKey, value: string) => {
    const hours = Math.min(8, Math.max(0, parseHours(value)));
    try {
      await updateEntryMut.mutateAsync({ entryId: entry.id, dto: { [dayTimeOffKey]: hours } });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleToggleBillable = async (entry: TimeEntry, checked: boolean) => {
    try {
      await updateEntryMut.mutateAsync({ entryId: entry.id, dto: { billable: checked } });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Week Navigator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentWeekStart(prevWeek(currentWeekStart)); setTimesheetId(undefined); setSearchParams({}); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Previous week"
          >
            &#8249;
          </button>
          <span className="font-mono text-sm font-medium text-gray-700 min-w-[200px] text-center">
            Week of {formatDateRange(currentWeekStart, weekEnd)}
          </span>
          <button
            onClick={() => { setCurrentWeekStart(nextWeek(currentWeekStart)); setTimesheetId(undefined); setSearchParams({}); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Next week"
          >
            &#8250;
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {timesheet && <Badge variant={STATUS_VARIANT[tsStatus]}>{tsStatus.charAt(0) + tsStatus.slice(1).toLowerCase()}</Badge>}
          <Button variant="ghost" size="sm" onClick={handleDownloadMonthlyClick} loading={isExporting}>
            Download Monthly
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyPrevWeek} disabled={!canEdit || copyPrevWeek.isPending}>
            Copy Previous Week
          </Button>
          {canEdit && timesheetId && (
            <Button size="sm" onClick={handleSubmit} loading={submitTimesheet.isPending}>
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      {timesheet && (
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dk rounded-xl p-5 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Total Hours</p>
              <p className="text-2xl font-bold font-mono mt-1">{formatHours(totalHours)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Billable</p>
              <p className="text-2xl font-bold font-mono mt-1">{formatHours(billableHours)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Non-Billable</p>
              <p className="text-2xl font-bold font-mono mt-1">{formatHours(totalHours - billableHours)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Status</p>
              <p className="text-sm font-medium mt-2 capitalize">{tsStatus.toLowerCase()}</p>
            </div>
          </div>
          {(timesheet.rejectedReason as string) && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-white/60">Rejection reason:</p>
              <p className="text-sm text-white/80 mt-0.5">{timesheet.rejectedReason as string}</p>
            </div>
          )}
        </div>
      )}

      {/* Timesheet Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner size="lg" />
        </div>
      ) : !timesheetId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 font-medium">No timesheet for this week</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">{formatDateRange(currentWeekStart, weekEnd)}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleCreateForWeek} loading={createTimesheet.isPending}>Create Timesheet</Button>
            <Button variant="outline-primary" onClick={handleCopyPrevWeek} loading={copyPrevWeek.isPending}>Copy Previous Week</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 w-24 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-3 py-3 w-28 font-semibold text-gray-500 text-xs uppercase tracking-wide">Day</th>
                  <th className="text-left px-3 py-3 w-52 font-semibold text-gray-500 text-xs uppercase tracking-wide">Project / Activity</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Task</th>
                  <th className="text-center px-2 py-3 w-14 font-semibold text-gray-500 text-xs uppercase tracking-wide">Bill?</th>
                  <th className="text-center px-2 py-3 w-20 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time</th>
                  <th className="text-center px-2 py-3 w-20 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time-off</th>
                  <th className="text-center px-2 py-3 w-20 font-semibold text-gray-500 text-xs uppercase tracking-wide">O/T</th>
                  <th className="text-center px-2 py-3 w-20 font-semibold text-gray-500 text-xs uppercase tracking-wide">Total</th>
                  {canEdit && <th className="w-16" />}
                </tr>
              </thead>
              <tbody>
                {dayLabels.flatMap((dayLabel, dayIndex) => {
                  const dayKey = DAY_KEYS[dayIndex];
                  const isWeekend = dayIndex >= 5;
                  const holiday = holidayFlags[dayIndex];
                  const leaveDay = leaveFlags[dayIndex];
                  const dayEnts = entriesByDay[dayIndex];
                  const dayTotal = dayTotals[dayIndex];
                  const dayOT = Math.max(0, dayTotal - STANDARD_HOURS);

                  const rowBgClass = leaveDay?.isLeaveDay
                    ? 'bg-green-50'
                    : holiday?.isHoliday
                      ? 'bg-amber-50'
                      : isWeekend
                        ? 'bg-yellow-50/60'
                        : '';

                  // Empty day row
                  if (dayEnts.length === 0) {
                    return [(
                      <tr key={`day-${dayIndex}-empty`} className={`border-b border-gray-100 ${rowBgClass}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-400">{dayLabel.date}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-sm font-medium ${holiday?.isHoliday ? 'text-amber-600' : isWeekend ? 'text-amber-600' : leaveDay?.isLeaveDay ? 'text-green-700' : 'text-gray-700'}`}>
                            {dayLabel.label}
                          </span>
                          {holiday?.isHoliday && (
                            <div className="text-xs text-amber-500 font-normal mt-0.5">{holiday.name}</div>
                          )}
                          {leaveDay?.isLeaveDay && (
                            <div className="text-xs text-green-600 font-normal mt-0.5">{leaveDay.leaveTypeName}</div>
                          )}
                        </td>
                        <td className="px-3 py-3" colSpan={2}>
                          {canEdit && !isWeekend && !holiday?.isHoliday && !leaveDay?.isLeaveDay ? (
                            <button
                              onClick={() => setAddEntryDayIndex(dayIndex)}
                              className="text-brand-primary/40 hover:text-brand-primary text-xs font-medium transition-colors"
                            >
                              + Add entry
                            </button>
                          ) : (
                            <span className={`text-xs italic ${isWeekend ? 'text-amber-400/80' : holiday?.isHoliday ? 'text-amber-500/60' : leaveDay?.isLeaveDay ? 'text-green-600/70' : 'text-gray-300'}`}>
                              {isWeekend ? 'Weekend' : holiday?.isHoliday ? holiday.name : leaveDay?.isLeaveDay ? leaveDay.leaveTypeName : '\u2014'}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3" />
                        <td className="px-2 py-3 text-center font-mono text-xs text-gray-300">0</td>
                        <td className="px-2 py-3 text-center font-mono text-xs text-gray-300">0</td>
                        <td className="px-2 py-3 text-center font-mono text-xs text-gray-300">0</td>
                        <td className="px-2 py-3 text-center font-mono text-xs text-gray-300">0</td>
                        {canEdit && <td />}
                      </tr>
                    )];
                  }

                  // Day has entries
                  return dayEnts.map((entry, rowIdx) => {
                    const isFirst = rowIdx === 0;
                    const isLast = rowIdx === dayEnts.length - 1;
                    const dayDescKey = DAY_DESC_KEYS[dayIndex];
                    const dayTimeOffKey = DAY_TIMEOFF_KEYS[dayIndex];
                    const entryTimeOff = (entry[dayTimeOffKey] as number | undefined) ?? 0;
                    const isLeave = (entry.project?.name ?? '').toLowerCase().includes('leave') || entryTimeOff > 0;
                    const entryRowBg = isLeave ? 'bg-green-50/60' : rowBgClass;

                    return (
                      <DayEntryRow
                        key={`day-${dayIndex}-entry-${entry.id}`}
                        entry={entry}
                        dayKey={dayKey}
                        dayDescKey={dayDescKey}
                        dayTimeOffKey={dayTimeOffKey}
                        dayLabel={dayLabel}
                        showDateDay={isFirst}
                        isLastInDay={isLast}
                        dayTotal={dayTotal}
                        dayOT={dayOT}
                        rowBgClass={entryRowBg}
                        canEdit={canEdit}
                        holiday={holiday}
                        leaveDay={leaveDay}
                        isWeekend={isWeekend}
                        isLeave={isLeave}
                        onAddEntry={() => setAddEntryDayIndex(dayIndex)}
                        onHoursChange={handleHoursChange}
                        onDescriptionChange={(e, v) => handleDescriptionChange(e, dayDescKey, v)}
                        onTimeOffChange={(e, v) => handleTimeOffChange(e, dayTimeOffKey, v)}
                        onBillableChange={handleToggleBillable}
                        onDelete={() => handleDeleteDayEntry(entry, dayIndex)}
                      />
                    );
                  });
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Working Hours
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-mono text-sm font-bold text-gray-800">{formatHours(totalRegularTime)}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-mono text-xs text-gray-400">&mdash;</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`font-mono text-sm font-bold ${totalOvertime > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {formatHours(totalOvertime)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-mono text-sm font-bold text-brand-primary">{formatHours(totalHours)}</span>
                  </td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal
        isOpen={addEntryDayIndex !== null}
        onClose={closeAddEntry}
        title={
          addEntryDayIndex !== null
            ? `Add Entry \u2014 ${dayLabels[addEntryDayIndex]?.label}, ${dayLabels[addEntryDayIndex]?.date}`
            : 'Add Entry'
        }
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Project *"
            value={addEntryProjectId ?? ''}
            onChange={(e) => setAddEntryProjectId(Number(e.target.value))}
            options={[
              { value: '', label: 'Select a project...' },
              ...projects
                .filter((p) => p.status === 'ACTIVE' || p.status === 'active')
                .map((p) => ({ value: String(p.id), label: `${p.code} \u2014 ${p.name}` })),
            ]}
          />
          <Input
            label="Task"
            value={addEntryDesc}
            onChange={(e) => setAddEntryDesc(e.target.value)}
            placeholder="e.g., Sprint planning, Code review..."
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Work Hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={addEntryHours}
                onChange={(e) => setAddEntryHours(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Time-off"
                value={addEntryTimeOff}
                onChange={(e) => {
                  setAddEntryTimeOff(e.target.value);
                  if (e.target.value === '8') setAddEntryHours('0');
                }}
                options={[
                  { value: '0', label: '0 h \u2014 None' },
                  { value: '4', label: '4 h \u2014 Half day' },
                  { value: '8', label: '8 h \u2014 Full day' },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeAddEntry}>Cancel</Button>
            <Button
              onClick={handleAddDayEntry}
              disabled={!addEntryProjectId}
              loading={addEntryMut.isPending || updateEntryMut.isPending}
            >
              Add Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Download Monthly Modal */}
      <Modal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        title="Download Monthly Timesheet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Download timesheet for{' '}
            <span className="font-medium text-gray-700">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </p>
          <Select
            label="Employee"
            value={downloadUserId}
            onChange={(e) => setDownloadUserId(e.target.value)}
            options={[
              { value: String(user?.userId ?? ''), label: `${user?.name ?? 'Me'} (Myself)` },
              ...teamMembers
                .filter((m) => m.id !== user?.userId)
                .map((m) => ({ value: String(m.id), label: m.name })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDownloadModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => doDownloadMonthly(downloadUserId ? parseInt(downloadUserId) : undefined)}
              loading={isExporting}
            >
              Download Excel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Overwrite Modal */}
      <Modal
        isOpen={confirmOverwriteOpen}
        onClose={() => setConfirmOverwriteOpen(false)}
        title="Overwrite existing timesheet?"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          A draft timesheet already exists for this week. Copying will replace all its
          current entries with the rows from your previous week.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOverwriteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmOverwrite} loading={copyPrevWeek.isPending}>
            Yes, overwrite
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- DayEntryRow ---------- */

function DayEntryRow({
  entry,
  dayKey,
  dayDescKey,
  dayTimeOffKey,
  dayLabel,
  showDateDay,
  isLastInDay,
  dayTotal,
  dayOT,
  rowBgClass,
  canEdit,
  holiday,
  leaveDay,
  isWeekend,
  isLeave,
  onAddEntry,
  onHoursChange,
  onDescriptionChange,
  onTimeOffChange,
  onBillableChange,
  onDelete,
}: {
  entry: TimeEntry;
  dayKey: (typeof DAY_KEYS)[number];
  dayDescKey: DayDescKey;
  dayTimeOffKey: DayTimeOffKey;
  dayLabel: { label: string; date: string };
  showDateDay: boolean;
  isLastInDay: boolean;
  dayTotal: number;
  dayOT: number;
  rowBgClass: string;
  canEdit: boolean;
  holiday: { isHoliday: boolean; name?: string };
  leaveDay: { isLeaveDay: boolean; leaveTypeName?: string };
  isWeekend: boolean;
  isLeave: boolean;
  onAddEntry: () => void;
  onHoursChange: (entry: TimeEntry, day: (typeof DAY_KEYS)[number], value: string) => Promise<void>;
  onDescriptionChange: (entry: TimeEntry, value: string) => Promise<void>;
  onTimeOffChange: (entry: TimeEntry, value: string) => Promise<void>;
  onBillableChange: (entry: TimeEntry, checked: boolean) => Promise<void>;
  onDelete: () => void;
}) {
  const currentHours = entry[dayKey] as number;
  const currentDesc = ((entry[dayDescKey] as string | undefined) ?? '');
  const currentTimeOff = ((entry[dayTimeOffKey] as number | undefined) ?? 0);

  const [localHours, setLocalHours] = useState(currentHours > 0 ? String(currentHours) : '');
  const [localDesc, setLocalDesc] = useState(currentDesc);
  const [localTimeOff, setLocalTimeOff] = useState(currentTimeOff > 0 ? String(currentTimeOff) : '');

  useEffect(() => { setLocalHours(currentHours > 0 ? String(currentHours) : ''); }, [currentHours]);
  useEffect(() => { setLocalDesc(currentDesc); }, [currentDesc]);
  useEffect(() => { setLocalTimeOff(currentTimeOff > 0 ? String(currentTimeOff) : ''); }, [currentTimeOff]);

  const entryHours = parseFloat(localHours || '0') || 0;
  const entryTimeOff = parseFloat(localTimeOff || '0') || 0;
  const entryOT = isLastInDay ? dayOT : 0;
  const entryTotal = isLastInDay ? dayTotal : entryHours;

  const dayLabelColor = holiday?.isHoliday ? 'text-amber-600' : isWeekend ? 'text-amber-600' : leaveDay?.isLeaveDay ? 'text-green-700' : 'text-gray-700';
  const projectColor = isLeave ? 'text-green-700' : 'text-gray-800';
  const codeColor = isLeave ? 'text-green-600/70' : 'text-gray-400';

  return (
    <tr className={`border-b border-gray-100 ${rowBgClass} hover:brightness-[0.985] transition-all`}>
      {/* Date */}
      <td className="px-4 py-2.5">
        {showDateDay && <span className="font-mono text-xs text-gray-400">{dayLabel.date}</span>}
      </td>

      {/* Day */}
      <td className="px-3 py-2.5">
        {showDateDay && (
          <div>
            <span className={`text-sm font-medium ${dayLabelColor}`}>{dayLabel.label}</span>
            {holiday?.isHoliday && (
              <div className="text-xs text-amber-500 mt-0.5">{holiday.name}</div>
            )}
            {leaveDay?.isLeaveDay && (
              <div className="text-xs text-green-600 mt-0.5">{leaveDay.leaveTypeName}</div>
            )}
          </div>
        )}
      </td>

      {/* Project / Activity */}
      <td className="px-3 py-2.5">
        <p className={`text-sm font-medium leading-tight ${projectColor}`}>
          {entry.project?.name ?? '\u2014'}
        </p>
        <p className={`text-xs font-mono mt-0.5 ${codeColor}`}>
          {entry.project?.code}
        </p>
      </td>

      {/* Task */}
      <td className="px-3 py-2.5">
        <textarea
          readOnly={!canEdit}
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
          onBlur={() => {
            if (localDesc !== currentDesc) {
              onDescriptionChange(entry, localDesc);
            }
          }}
          placeholder="Enter task details..."
          rows={1}
          className={`w-full text-xs resize-none border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-primary/30 rounded p-1 ${
            isLeave ? 'text-green-700/80 placeholder:text-green-500/40' : 'text-gray-600 placeholder:text-gray-300'
          } ${!canEdit ? 'cursor-default' : ''}`}
        />
      </td>

      {/* Billable */}
      <td className="px-2 py-2.5 text-center">
        <Toggle
          checked={entry.billable}
          disabled={!canEdit}
          onChange={(checked) => onBillableChange(entry, checked)}
        />
      </td>

      {/* Time */}
      <td className="px-2 py-2.5 text-center">
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          readOnly={!canEdit}
          value={localHours}
          onChange={(e) => setLocalHours(e.target.value)}
          onBlur={(e) => onHoursChange(entry, dayKey, e.target.value)}
          placeholder="0"
          className={`w-16 text-center font-mono text-sm border rounded px-1 py-1.5 focus:outline-none focus:border-brand-primary transition-colors ${
            entryHours > 0
              ? 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary font-semibold'
              : 'border-gray-200 text-gray-400'
          } ${!canEdit ? 'bg-gray-50 cursor-default' : ''}`}
        />
      </td>

      {/* Time-off */}
      <td className="px-2 py-2.5 text-center">
        <input
          type="number"
          min="0"
          max="8"
          step="0.5"
          readOnly={!canEdit}
          value={localTimeOff}
          onChange={(e) => setLocalTimeOff(e.target.value)}
          onBlur={(e) => onTimeOffChange(entry, e.target.value)}
          placeholder="0"
          className={`w-16 text-center font-mono text-sm border rounded px-1 py-1.5 focus:outline-none focus:border-brand-primary transition-colors ${
            entryTimeOff > 0
              ? 'border-amber-400/40 bg-amber-50 text-amber-600 font-semibold'
              : 'border-gray-200 text-gray-400'
          } ${!canEdit ? 'bg-gray-50 cursor-default' : ''}`}
        />
      </td>

      {/* Overtime */}
      <td className="px-2 py-2.5 text-center">
        {isLastInDay && entryOT > 0 ? (
          <span className="font-mono text-sm font-semibold text-amber-600">{formatHours(entryOT)}</span>
        ) : (
          <span className="font-mono text-xs text-gray-300">0</span>
        )}
      </td>

      {/* Total */}
      <td className="px-2 py-2.5 text-center">
        <span className={`font-mono text-sm font-semibold ${
          isLeave ? 'text-green-700' : isLastInDay && dayTotal > 0 ? 'text-gray-800' : 'text-gray-500'
        }`}>
          {formatHours(entryTotal)}
        </span>
      </td>

      {/* Actions */}
      {canEdit && (
        <td className="px-2 py-2.5">
          <div className="flex items-center justify-center gap-1.5">
            {isLastInDay && !isWeekend && !holiday?.isHoliday && (
              <button
                onClick={onAddEntry}
                title="Add another entry for this day"
                className="text-brand-primary/30 hover:text-brand-primary text-base leading-none transition-colors"
              >
                +
              </button>
            )}
            <button
              onClick={onDelete}
              title="Remove this entry"
              className="text-gray-300 hover:text-red-500 text-sm transition-colors"
            >
              &#10005;
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
