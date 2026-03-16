import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useOwnBalances } from '../hooks/useLeaveBalances';
import { useLeaveTypes } from '../hooks/useLeaveTypes';
import { useLeaveRequests, useCreateLeaveRequest, useCancelLeaveRequest } from '../hooks/useLeave';
import { formatDate } from '../utils/dateHelpers';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { LeaveBalance, LeaveRequest, LeaveType } from '../types';

/* ---------- helpers ---------- */

function statusToBadgeVariant(status: string) {
  const map: Record<string, 'pending' | 'approved' | 'rejected' | 'cancelled'> = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  };
  return map[status] ?? 'draft';
}

function countBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const d = new Date(s);
  while (d <= e) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function balanceColorClass(available: number, allocated: number): string {
  if (available <= 0) return 'border-brand-danger/40 bg-red-50';
  if (available <= allocated * 0.25) return 'border-amber-400/40 bg-amber-50';
  return 'border-brand-success/40 bg-green-50';
}

/* ---------- LeaveBalanceCards ---------- */

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
}

function LeaveBalanceCards({ balances }: LeaveBalanceCardsProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">No leave balances found for this year.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {balances.map((bal) => {
        const available = bal.allocatedDays + bal.carriedOver - bal.usedDays - bal.pendingDays;
        return (
          <div
            key={bal.id}
            className={`rounded-xl border p-4 shadow-sm ${balanceColorClass(available, bal.allocatedDays)}`}
          >
            <p className="text-sm font-semibold text-gray-900">
              {bal.leaveType?.name ?? `Leave Type #${bal.leaveTypeId}`}
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Allocated</span>
                <span className="font-mono font-semibold text-gray-900">{bal.allocatedDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Used</span>
                <span className="font-mono font-semibold text-gray-900">{bal.usedDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-mono font-semibold text-gray-900">{bal.pendingDays}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span className="font-medium">Available</span>
                <span className="font-mono font-bold text-gray-900">{available}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- LeaveRequestForm ---------- */

interface LeaveFormValues {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
}

function LeaveRequestForm({ leaveTypes, balances }: LeaveRequestFormProps) {
  const { showToast } = useToast();
  const createRequest = useCreateLeaveRequest();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    defaultValues: { leaveTypeId: '', startDate: '', endDate: '', reason: '' },
  });

  const watchedTypeId = watch('leaveTypeId');
  const watchedStart = watch('startDate');
  const watchedEnd = watch('endDate');

  const requestedDays = useMemo(
    () => countBusinessDays(watchedStart, watchedEnd),
    [watchedStart, watchedEnd],
  );

  const selectedBalance = useMemo(() => {
    if (!watchedTypeId) return null;
    return balances.find((b) => b.leaveTypeId === parseInt(watchedTypeId, 10)) ?? null;
  }, [watchedTypeId, balances]);

  const availableAfter = useMemo(() => {
    if (!selectedBalance) return null;
    const available =
      selectedBalance.allocatedDays +
      selectedBalance.carriedOver -
      selectedBalance.usedDays -
      selectedBalance.pendingDays;
    return available - requestedDays;
  }, [selectedBalance, requestedDays]);

  const onSubmit = async (data: LeaveFormValues) => {
    try {
      await createRequest.mutateAsync({
        leaveTypeId: parseInt(data.leaveTypeId, 10),
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || undefined,
      });
      showToast('Leave request submitted successfully', 'success');
      reset();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const activeTypes = leaveTypes.filter((lt) => lt.active);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">New Leave Request</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Leave Type"
          options={[
            { value: '', label: '-- Select leave type --' },
            ...activeTypes.map((lt) => ({
              value: String(lt.id),
              label: lt.name,
            })),
          ]}
          error={errors.leaveTypeId?.message}
          {...register('leaveTypeId', { required: 'Leave type is required' })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Start date is required' })}
          />
          <Input
            label="End Date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate', {
              required: 'End date is required',
              validate: (value) => {
                if (watchedStart && value < watchedStart) return 'End date must be after start date';
                return true;
              },
            })}
          />
        </div>

        {/* Business days preview */}
        {requestedDays > 0 && (
          <div className="flex items-center gap-6 rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-600">
              Business Days: <span className="font-mono font-semibold text-gray-900">{requestedDays}</span>
            </div>
            {availableAfter !== null && (
              <div className="text-sm text-gray-600">
                Balance After:{' '}
                <span
                  className={`font-mono font-semibold ${
                    availableAfter < 0 ? 'text-brand-danger' : 'text-brand-success'
                  }`}
                >
                  {availableAfter} days
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Reason (optional)</label>
          <textarea
            {...register('reason')}
            rows={3}
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="Enter reason for leave..."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={createRequest.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- LeaveHistory ---------- */

interface LeaveHistoryProps {
  requests: LeaveRequest[];
  onCancel: (id: number) => void;
  cancelling: boolean;
}

function LeaveHistory({ requests, onCancel, cancelling }: LeaveHistoryProps) {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const year = new Date(r.startDate).getFullYear();
      if (yearFilter !== 'ALL' && year !== parseInt(yearFilter, 10)) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      return true;
    });
  }, [requests, yearFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const canCancel = (r: LeaveRequest) => {
    if (r.status === 'PENDING') return true;
    if (r.status === 'APPROVED' && new Date(r.startDate) > new Date()) return true;
    return false;
  };

  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 3; y--) {
    yearOptions.push({ value: String(y), label: String(y) });
  }
  yearOptions.unshift({ value: 'ALL', label: 'All Years' });

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Leave History</h2>
        <div className="flex items-center gap-3">
          <Select
            options={yearOptions}
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="w-28"
          />
          <Select
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-32"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">Leave Type</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Start Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">End Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Days</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {r.leaveType?.name ?? `Type #${r.leaveTypeId}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(r.startDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(r.endDate)}</td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                    {r.businessDays}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusToBadgeVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canCancel(r) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onCancel(r.id)}
                        loading={cancelling}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- main page ---------- */

export default function LeavePage() {
  const { showToast } = useToast();

  // Data fetching
  const { data: balancesData, isLoading: balancesLoading } = useOwnBalances();
  const { data: leaveTypesData, isLoading: typesLoading } = useLeaveTypes();
  const { data: requestsData, isLoading: requestsLoading } = useLeaveRequests();

  // Mutations
  const cancelRequest = useCancelLeaveRequest();

  // Derived data
  const balances: LeaveBalance[] = balancesData?.data ?? [];
  const leaveTypes: LeaveType[] = leaveTypesData?.data ?? [];
  const requests: LeaveRequest[] = requestsData?.data ?? [];

  const isLoading = balancesLoading || typesLoading || requestsLoading;

  // Handlers
  const handleCancel = async (id: number) => {
    try {
      await cancelRequest.mutateAsync({ id });
      showToast('Leave request cancelled', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Leave</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your leave balances, apply for leave, and track your requests.
        </p>
      </div>

      {/* Leave Balance Summary */}
      <LeaveBalanceCards balances={balances} />

      {/* Leave Request Form */}
      <LeaveRequestForm leaveTypes={leaveTypes} balances={balances} />

      {/* Leave History */}
      <LeaveHistory
        requests={requests}
        onCancel={handleCancel}
        cancelling={cancelRequest.isPending}
      />
    </div>
  );
}
