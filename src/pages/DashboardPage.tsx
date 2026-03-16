import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useTimesheets } from '../hooks/useTimesheets';
import { useApprovalStats } from '../hooks/useApprovals';
import { useOwnBalances } from '../hooks/useLeaveBalances';
import { useLeaveApprovalStats } from '../hooks/useLeaveApprovals';
import { useLeaveRequests } from '../hooks/useLeave';
import { notificationsService } from '../services/notifications.service';
import type { Timesheet, LeaveRequest, LeaveBalance, Notification, ApprovalStats } from '../types';

/* ---------- helpers ---------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatWeekRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function statusToBadgeVariant(status: string) {
  const map: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending' | 'cancelled'> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
  };
  return map[status] ?? 'draft';
}

/* ---------- component ---------- */

export default function DashboardPage() {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  // Data fetching
  const { data: tsData, isLoading: tsLoading } = useTimesheets(1, 10);
  const { data: approvalStatsData, isLoading: approvalStatsLoading } = useApprovalStats();
  const { data: balancesData, isLoading: balancesLoading } = useOwnBalances();
  const { data: leaveApprovalStatsData, isLoading: leaveApprovalStatsLoading } = useLeaveApprovalStats();
  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests({ status: 'PENDING' });
  const { data: notificationsData, isLoading: notifsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list({ limit: 10 }),
  });

  const isLoading =
    tsLoading || approvalStatsLoading || balancesLoading || leaveApprovalStatsLoading || leaveLoading || notifsLoading;

  // Derived data
  const timesheets: Timesheet[] = tsData?.data ?? [];
  const approvalStats: ApprovalStats | null = approvalStatsData?.data ?? null;
  const balances: LeaveBalance[] = balancesData?.data ?? [];
  const leaveApprovalStats = leaveApprovalStatsData?.data ?? null;
  const pendingLeaves: LeaveRequest[] = leaveData?.data ?? [];
  const notifications: Notification[] = notificationsData?.data ?? [];

  const recentTimesheets = timesheets.slice(0, 5);
  const ownPendingLeaves = pendingLeaves.slice(0, 5);

  // Stats computations
  const { weekHours, monthHours, billablePct } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let wh = 0;
    let mh = 0;
    let totalBillable = 0;
    let totalAll = 0;

    timesheets.forEach((ts) => {
      const wsDate = new Date(ts.weekStartDate);
      if (wsDate >= startOfWeek) wh += ts.totalHours;
      if (wsDate >= startOfMonth) {
        mh += ts.totalHours;
        totalBillable += ts.billableHours;
        totalAll += ts.totalHours;
      }
    });

    const pct = totalAll > 0 ? Math.round((totalBillable / totalAll) * 100) : 0;
    return { weekHours: wh, monthHours: mh, billablePct: pct };
  }, [timesheets]);

  const totalLeaveRemaining = useMemo(() => {
    return balances.reduce(
      (sum, b) => sum + (b.allocatedDays + b.carriedOver - b.usedDays - b.pendingDays),
      0,
    );
  }, [balances]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here is what is happening with your work today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          variant="primary"
          title="This Week Hours"
          value={weekHours.toFixed(1)}
          subtitle="hours logged"
        />
        <StatCard
          variant="secondary"
          title="This Month Hours"
          value={monthHours.toFixed(1)}
          subtitle="hours logged"
        />
        <StatCard
          variant="success"
          title="Billable %"
          value={`${billablePct}%`}
          subtitle="this month"
        />
        {isManagerOrAdmin && (
          <StatCard
            variant="neutral"
            title="Pending TS Approvals"
            value={approvalStats?.pendingCount ?? 0}
            subtitle="timesheets"
          />
        )}
        <StatCard
          variant="neutral"
          title="Leave Remaining"
          value={`${totalLeaveRemaining}`}
          subtitle="days total"
        />
        {isManagerOrAdmin && (
          <StatCard
            variant="neutral"
            title="Pending Leave Approvals"
            value={leaveApprovalStats?.pendingCount ?? 0}
            subtitle="requests"
          />
        )}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            to="/timesheet"
            title="New Timesheet"
            description="Log your hours for a new week"
            iconPath="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <QuickActionCard
            to="/leave"
            title="Apply for Leave"
            description="Submit a new leave request"
            iconPath="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
          {isManagerOrAdmin && (
            <QuickActionCard
              to="/reports"
              title="Export Report"
              description="Generate team reports and exports"
              iconPath="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          )}
          {isAdmin && (
            <QuickActionCard
              to="/admin"
              title="Settings"
              description="Manage organization settings"
              iconPath="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
            />
          )}
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left two-thirds */}
        <div className="space-y-8 lg:col-span-2">
          {/* Recent Timesheets */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Timesheets</h2>
              <Link to="/timesheet" className="text-sm font-medium text-brand-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {recentTimesheets.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  No timesheets yet. Create your first one!
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentTimesheets.map((ts) => (
                    <li key={ts.id}>
                      <Link
                        to={`/timesheet?week=${ts.weekStartDate}`}
                        className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatWeekRange(ts.weekStartDate, ts.weekEndDate)}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-gray-500">
                            {ts.totalHours.toFixed(1)} hrs &middot; {ts.billableHours.toFixed(1)} billable
                          </p>
                        </div>
                        <Badge variant={statusToBadgeVariant(ts.status)}>
                          {ts.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Pending Leave Requests */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
              <Link to="/leave" className="text-sm font-medium text-brand-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {ownPendingLeaves.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  No pending leave requests.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {ownPendingLeaves.map((lr) => (
                    <li
                      key={lr.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lr.leaveType?.name ?? 'Leave'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatWeekRange(lr.startDate, lr.endDate)} &middot;{' '}
                          <span className="font-mono">{lr.businessDays}</span>{' '}
                          {lr.businessDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <Badge variant={statusToBadgeVariant(lr.status)}>
                        {lr.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Right panel — Notifications */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {notifications.some((n) => !n.read) && (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                You are all caught up!
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    {/* Read / unread dot */}
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.read ? 'bg-gray-200' : 'bg-brand-primary'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          n.read ? 'text-gray-500' : 'font-medium text-gray-900'
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- sub-component ---------- */

interface QuickActionCardProps {
  to: string;
  title: string;
  description: string;
  iconPath: string;
}

function QuickActionCard({ to, title, description, iconPath }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
