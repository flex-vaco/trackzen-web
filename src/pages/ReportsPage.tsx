import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useReports } from '../hooks/useReports';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import { exportReport, exportMonthly, type ReportFilters } from '../services/reports.service';
import { teamService } from '../services/team.service';
import { formatHours } from '../utils/formatHours';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { Project, FullUser } from '../types';

/* ---------- helpers ---------- */

function statusToBadgeVariant(status: string) {
  const map: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };
  return map[status] ?? 'draft';
}


function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

function getDefaultDateTo(): string {
  return new Date().toISOString().split('T')[0];
}

/* ---------- ReportFiltersBar ---------- */

interface ReportFiltersBarProps {
  dateFrom: string;
  dateTo: string;
  userId: string;
  projectId: string;
  status: string;
  users: FullUser[];
  projects: Project[];
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onUserChange: (v: string) => void;
  onProjectChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
}

function ReportFiltersBar({
  dateFrom,
  dateTo,
  userId,
  projectId,
  status,
  users,
  projects,
  onDateFromChange,
  onDateToChange,
  onUserChange,
  onProjectChange,
  onStatusChange,
  onGenerate,
  generating,
}: ReportFiltersBarProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
        <Select
          label="Employee"
          value={userId}
          onChange={(e) => onUserChange(e.target.value)}
          options={[
            { value: '', label: 'All Employees' },
            ...users.map((u) => ({ value: String(u.id), label: u.name })),
          ]}
        />
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => onProjectChange(e.target.value)}
          options={[
            { value: '', label: 'All Projects' },
            ...projects.map((p) => ({ value: String(p.id), label: `${p.code} - ${p.name}` })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'SUBMITTED', label: 'Submitted' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onGenerate} loading={generating}>
          Generate Report
        </Button>
      </div>
    </div>
  );
}

/* ---------- ReportStatBar ---------- */

interface ReportStatBarProps {
  totalHours: number;
  billableHours: number;
  billablePct: number;
  totalEntries: number;
}

function ReportStatBar({ totalHours, billableHours, billablePct, totalEntries }: ReportStatBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard variant="primary" title="Total Hours" value={formatHours(totalHours)} subtitle="across all entries" />
      <StatCard variant="success" title="Billable Hours" value={formatHours(billableHours)} subtitle="client work" />
      <StatCard variant="secondary" title="Billable %" value={`${billablePct}%`} subtitle="utilization rate" />
      <StatCard variant="neutral" title="Total Entries" value={totalEntries} subtitle="timesheet rows" />
    </div>
  );
}

/* ---------- ExportButtons ---------- */

interface ExportButtonsProps {
  filters: ReportFilters;
  disabled: boolean;
}

function ExportButtons({ filters, disabled }: ExportButtonsProps) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: 'csv' | 'excel' | 'pdf') => {
      setExporting(format);
      try {
        const blob = await exportReport(format, filters);
        const ext = format === 'excel' ? 'xlsx' : format;
        downloadBlob(blob, `report.${ext}`);
        showToast(`${format.toUpperCase()} report downloaded`, 'success');
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        setExporting(null);
      }
    },
    [filters, showToast],
  );

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => handleExport('csv')}
        loading={exporting === 'csv'}
        disabled={disabled}
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export CSV
      </Button>
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => handleExport('excel')}
        loading={exporting === 'excel'}
        disabled={disabled}
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export Excel
      </Button>
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => handleExport('pdf')}
        loading={exporting === 'pdf'}
        disabled={disabled}
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export PDF
      </Button>
    </div>
  );
}

/* ---------- main page ---------- */

export default function ReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Filter state
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [activeFilters, setActiveFilters] = useState<ReportFilters | undefined>(undefined);

  // Monthly download state
  const now = new Date();
  const [dlUserId, setDlUserId] = useState('');
  const [dlYear, setDlYear] = useState(String(now.getFullYear()));
  const [dlMonth, setDlMonth] = useState(String(now.getMonth() + 1));
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: myReportsRaw } = useQuery({
    queryKey: ['team', 'my-reports'],
    queryFn: () => teamService.getMyReports(),
    enabled: user?.role === 'MANAGER' || user?.role === 'ADMIN',
  });
  const myReports: { id: number; name: string }[] = myReportsRaw?.data ?? [];

  const handleDownloadMonthly = async () => {
    const targetId = dlUserId ? parseInt(dlUserId) : user?.userId;
    if (!targetId) return;
    setIsDownloading(true);
    try {
      await exportMonthly(targetId, parseInt(dlYear), parseInt(dlMonth));
      showToast('Monthly timesheet downloaded', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Data fetching
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: reportData, isLoading: reportLoading, isFetching: reportFetching } = useReports(activeFilters);

  // Derived data
  const users: FullUser[] = usersData?.data ?? [];
  const projects: Project[] = projectsData?.data ?? [];
  const reportRows: {
    employeeName: string;
    employeeEmail: string;
    weekRange: string;
    weekStartDate: string;
    weekEndDate: string;
    status: string;
    totalHours: number;
    billableHours: number;
    projectBreakdown: { projectName: string; projectCode: string; hours: number; billable: boolean }[];
  }[] = reportData?.data?.rows ?? [];
  const reportSummary = reportData?.data?.summary;

  // Stats — use backend-computed summary when available
  const { totalHours, billableHours, billablePct, totalEntries } = useMemo(() => {
    if (reportSummary) {
      return {
        totalHours: reportSummary.totalHours,
        billableHours: reportSummary.billableHours,
        billablePct: reportSummary.billablePercentage,
        totalEntries: reportSummary.totalEntries,
      };
    }
    return { totalHours: 0, billableHours: 0, billablePct: 0, totalEntries: 0 };
  }, [reportSummary]);

  const currentFilters: ReportFilters = useMemo(() => {
    const f: ReportFilters = {};
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (userId) f.userId = parseInt(userId, 10);
    if (projectId) f.projectId = parseInt(projectId, 10);
    if (status) f.status = status;
    return f;
  }, [dateFrom, dateTo, userId, projectId, status]);

  const handleGenerate = useCallback(() => {
    setActiveFilters({ ...currentFilters });
  }, [currentFilters]);

  const scaffoldLoading = usersLoading || projectsLoading;

  if (scaffoldLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export team timesheet reports.
          </p>
        </div>
        {activeFilters && (
          <ExportButtons filters={activeFilters} disabled={reportRows.length === 0} />
        )}
      </div>

      {/* Monthly Timesheet Download */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Download Monthly Timesheet</h3>
        <div className="flex flex-wrap items-center gap-3">
          {myReports.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Employee</label>
              <select
                value={dlUserId}
                onChange={(e) => setDlUserId(e.target.value)}
                className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">{user?.name ?? 'Me'} (Myself)</option>
                {myReports.map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Month</label>
            <select
              value={dlMonth}
              onChange={(e) => setDlMonth(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((name, i) => (
                <option key={i + 1} value={String(i + 1)}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Year</label>
            <select
              value={dlYear}
              onChange={(e) => setDlYear(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleDownloadMonthly} loading={isDownloading}>
            Download Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReportFiltersBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        userId={userId}
        projectId={projectId}
        status={status}
        users={users}
        projects={projects}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onUserChange={setUserId}
        onProjectChange={setProjectId}
        onStatusChange={setStatus}
        onGenerate={handleGenerate}
        generating={reportFetching}
      />

      {/* Report results */}
      {activeFilters && (
        <>
          {reportLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Stat bar */}
              <ReportStatBar
                totalHours={totalHours}
                billableHours={billableHours}
                billablePct={billablePct}
                totalEntries={totalEntries}
              />

              {/* Data table */}
              <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Employee
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Week
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                        Total Hours
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                        Billable Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                          No results found. Adjust your filters and try again.
                        </td>
                      </tr>
                    ) : (
                      reportRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50"
                        >
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-gray-900">{row.employeeName}</p>
                            <p className="text-xs text-gray-400">{row.employeeEmail}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">{row.weekRange}</td>
                          <td className="px-5 py-3">
                            <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-gray-900">
                            {formatHours(row.totalHours)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm text-brand-primary">
                            {formatHours(row.billableHours)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                        <td className="px-5 py-3 text-sm text-gray-700" colSpan={3}>
                          Totals
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-sm text-gray-900">
                          {formatHours(totalHours)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-sm text-brand-primary">
                          {formatHours(billableHours)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Initial state - no report generated yet */}
      {!activeFilters && (
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">
            Set your filters and click "Generate Report" to view data.
          </p>
        </div>
      )}
    </div>
  );
}
