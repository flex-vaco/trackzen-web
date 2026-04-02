import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import {
  useApprovals,
  useApprovalStats,
  useApproveTimesheet,
  useRejectTimesheet,
} from '../hooks/useApprovals';
import { useHolidays } from '../hooks/useHolidays';
import { leaveCalendarService } from '../services/leaveCalendar.service';
import { formatHours } from '../utils/formatHours';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { Timesheet, ApprovalStats, Holiday } from '../types';

/* ---------- helpers ---------- */

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

function statusToBadgeVariant(status: string) {
  const map: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };
  return map[status] ?? 'draft';
}

function formatWeekRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDayFlags(
  weekStart: Date,
  holidays: Holiday[],
  leaveEntries: { userId: number; leaveTypeName: string; date: string }[],
  employeeUserId: number,
): { isHoliday: boolean; holidayName?: string; isLeaveDay: boolean; leaveTypeName?: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = toLocalISO(day);

    const holiday = holidays.find((h) => {
      const hd = new Date(h.date);
      return toLocalISO(hd) === dayStr;
    });

    const leave = leaveEntries.find((e) => e.userId === employeeUserId && e.date === dayStr);

    return {
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      isLeaveDay: !!leave,
      leaveTypeName: leave?.leaveTypeName,
    };
  });
}

/* ---------- ApprovalStatBar ---------- */

interface ApprovalStatBarProps {
  stats: ApprovalStats | null;
}

function ApprovalStatBar({ stats }: ApprovalStatBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        variant="primary"
        title="Pending Approvals"
        value={stats?.pendingCount ?? 0}
        subtitle="awaiting review"
      />
      <StatCard
        variant="success"
        title="Approved This Week"
        value={stats?.approvedThisWeek ?? 0}
        subtitle="timesheets"
      />
      <StatCard
        variant="secondary"
        title="Team Hours"
        value={formatHours(stats?.teamHours ?? 0)}
        subtitle="this week"
      />
      <StatCard
        variant="neutral"
        title="Team Members"
        value={stats?.teamMembers ?? 0}
        subtitle="active"
      />
    </div>
  );
}

/* ---------- PendingBanner ---------- */

function PendingBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
      <svg
        className="h-5 w-5 shrink-0 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm font-medium text-amber-800">
        You have {count} timesheet{count !== 1 ? 's' : ''} awaiting approval
      </p>
    </div>
  );
}

/* ---------- TimesheetApprovalCard ---------- */

interface ApprovalCardProps {
  timesheet: Timesheet;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  approving: boolean;
}

function TimesheetApprovalCard({ timesheet, onApprove, onReject, approving }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const entries = timesheet.timeEntries ?? [];

  const weekStart = new Date(timesheet.weekStartDate);
  const weekEnd = new Date(timesheet.weekEndDate);
  const weekStartISO = toLocalISO(weekStart);
  const weekEndISO = toLocalISO(weekEnd);
  const year = weekStart.getFullYear();

  const { data: holidaysData } = useHolidays(year);
  const holidays: Holiday[] = holidaysData?.data ?? [];

  const { data: leaveCalendarData } = useQuery({
    queryKey: ['leave-calendar', weekStartISO, weekEndISO],
    queryFn: () => leaveCalendarService.getCalendar(weekStartISO, weekEndISO),
    select: (res: Record<string, unknown>) =>
      (res?.data ?? []) as { userId: number; leaveTypeName: string; date: string }[],
  });

  const dayFlags = useMemo(
    () => buildDayFlags(weekStart, holidays, leaveCalendarData ?? [], timesheet.userId),
    [weekStart, holidays, leaveCalendarData, timesheet.userId],
  );

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <Avatar name={timesheet.user?.name ?? 'Unknown'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {timesheet.user?.name ?? 'Unknown'}
          </p>
          <p className="truncate text-xs text-gray-400">{timesheet.user?.email ?? ''}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500">
              {formatWeekRange(timesheet.weekStartDate, timesheet.weekEndDate)}
            </span>
            <span className="font-mono text-xs font-semibold text-gray-900">
              {formatHours(timesheet.totalHours)} hrs
            </span>
            <span className="font-mono text-xs text-brand-primary">
              {formatHours(timesheet.billableHours)} billable
            </span>
          </div>
        </div>
        <Badge variant={statusToBadgeVariant(timesheet.status)}>{timesheet.status}</Badge>
      </div>

      {/* Expandable entries breakdown */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          <span>{expanded ? 'Hide' : 'View'} time entries ({entries.length})</span>
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {expanded && entries.length > 0 && (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                    Project
                  </th>
                  {DAY_KEYS.map((day, i) => {
                    const flag = dayFlags[i];
                    const headerColor = flag?.isHoliday
                      ? 'text-amber-600'
                      : flag?.isLeaveDay
                        ? 'text-green-700'
                        : 'text-gray-500';
                    return (
                      <th
                        key={day}
                        className={`px-2 py-2 text-center text-xs font-semibold uppercase ${headerColor}`}
                      >
                        {DAY_LABELS[day]}
                        {flag?.isHoliday && (
                          <div className="text-[10px] font-normal normal-case text-amber-500 leading-tight">
                            {flag.holidayName}
                          </div>
                        )}
                        {flag?.isLeaveDay && (
                          <div className="text-[10px] font-normal normal-case text-green-600 leading-tight">
                            {flag.leaveTypeName}
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const rowTotal = DAY_KEYS.reduce(
                    (sum, day) =>
                      sum + ((entry[`${day}Hours` as keyof typeof entry] as number) ?? 0),
                    0,
                  );
                  return (
                    <tr key={entry.id} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {entry.project?.name ?? 'Unknown'}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">
                          {entry.project?.code ?? ''}
                        </span>
                        {entry.billable && (
                          <span className="ml-2 text-[10px] font-medium text-brand-primary">
                            BILLABLE
                          </span>
                        )}
                      </td>
                      {DAY_KEYS.map((day, i) => {
                        const hours = (entry[`${day}Hours` as keyof typeof entry] as number) || 0;
                        const flag = dayFlags[i];
                        return (
                          <td
                            key={day}
                            className={`px-2 py-2 text-center font-mono text-xs ${
                              flag?.isHoliday
                                ? 'bg-amber-50 text-amber-500'
                                : flag?.isLeaveDay
                                  ? 'bg-green-50 text-green-600'
                                  : 'text-gray-700'
                            }`}
                          >
                            {hours > 0
                              ? hours
                              : flag?.isHoliday
                                ? flag.holidayName ?? 'Holiday'
                                : flag?.isLeaveDay
                                  ? flag.leaveTypeName ?? 'Leave'
                                  : '-'}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900">
                        {formatHours(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {expanded && entries.length === 0 && (
          <p className="px-5 py-4 text-center text-xs text-gray-400">No time entries recorded.</p>
        )}
      </div>

      {/* Action buttons */}
      {timesheet.status === 'SUBMITTED' && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onReject(timesheet.id)}
          >
            Reject
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => onApprove(timesheet.id)}
            loading={approving}
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- main page ---------- */

export default function ApprovalsPage() {
  const { showToast } = useToast();

  // Data fetching
  const { data: approvalsData, isLoading: approvalsLoading } = useApprovals(1, 100);
  const { data: statsData, isLoading: statsLoading } = useApprovalStats();

  // Mutations
  const approveTimesheet = useApproveTimesheet();
  const rejectTimesheet = useRejectTimesheet();

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Derived data
  const timesheets: Timesheet[] = approvalsData?.data ?? [];
  const stats: ApprovalStats | null = statsData?.data ?? null;
  const pendingCount = stats?.pendingCount ?? 0;

  const isLoading = approvalsLoading || statsLoading;

  // Handlers
  const handleApprove = useCallback(
    async (id: number) => {
      setApprovingId(id);
      try {
        await approveTimesheet.mutateAsync(id);
        showToast('Timesheet approved', 'success');
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        setApprovingId(null);
      }
    },
    [approveTimesheet, showToast],
  );

  const openRejectModal = useCallback((id: number) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectTargetId) return;
    try {
      await rejectTimesheet.mutateAsync({
        timesheetId: rejectTargetId,
        reason: rejectReason.trim() || 'No reason provided',
      });
      showToast('Timesheet rejected', 'success');
      setRejectModalOpen(false);
      setRejectTargetId(null);
      setRejectReason('');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }, [rejectTargetId, rejectReason, rejectTimesheet, showToast]);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timesheet Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve team timesheets.
        </p>
      </div>

      {/* Stat cards */}
      <ApprovalStatBar stats={stats} />

      {/* Pending banner */}
      <PendingBanner count={pendingCount} />

      {/* Approval cards */}
      <div className="space-y-4">
        {timesheets.length === 0 ? (
          <div className="rounded-xl bg-white px-5 py-16 text-center shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-500">No timesheets to review right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {timesheets.map((ts) => (
              <TimesheetApprovalCard
                key={ts.id}
                timesheet={ts}
                onApprove={handleApprove}
                onReject={openRejectModal}
                approving={approvingId === ts.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Timesheet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this timesheet. The employee will be notified and
            can edit and resubmit.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="Enter rejection reason..."
            autoFocus
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              loading={rejectTimesheet.isPending}
            >
              Reject Timesheet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
