import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import {
  useLeaveApprovals,
  useLeaveApprovalStats,
  useApproveLeave,
  useRejectLeave,
} from '../hooks/useLeaveApprovals';
import { formatDate } from '../utils/dateHelpers';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { LeaveRequest } from '../types';

/* ---------- LeaveApprovalStatBar ---------- */

interface StatsBarProps {
  stats: { pendingCount: number; approvedThisWeek: number; onLeaveToday?: number } | null;
}

function LeaveApprovalStatBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        variant="primary"
        title="Pending Leave Requests"
        value={stats?.pendingCount ?? 0}
        subtitle="awaiting review"
      />
      <StatCard
        variant="success"
        title="Approved This Week"
        value={stats?.approvedThisWeek ?? 0}
        subtitle="leave requests"
      />
      <StatCard
        variant="secondary"
        title="Team Members on Leave"
        value={stats?.onLeaveToday ?? 0}
        subtitle="today"
      />
    </div>
  );
}

/* ---------- LeaveApprovalCard ---------- */

interface ApprovalCardProps {
  request: LeaveRequest;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  approvingId: number | null;
}

function LeaveApprovalCard({ request, onApprove, onReject, approvingId }: ApprovalCardProps) {
  const maxLevel = request.approvals?.length
    ? Math.max(...request.approvals.map((a) => a.level))
    : 0;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <Avatar name={request.user?.name ?? 'Unknown'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {request.user?.name ?? 'Unknown'}
          </p>
          <p className="truncate text-xs text-gray-400">{request.user?.email ?? ''}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="pending">{request.leaveType?.name ?? 'Leave'}</Badge>
            <span className="text-xs text-gray-500">
              {formatDate(request.startDate)} &ndash; {formatDate(request.endDate)}
            </span>
            <span className="font-mono text-xs font-semibold text-gray-900">
              {request.businessDays} day{request.businessDays !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Reason */}
          {request.reason && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Reason:</span> {request.reason}
            </p>
          )}

          {/* Approval level indicator */}
          {maxLevel > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {request.approvals?.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    a.status === 'APPROVED'
                      ? 'bg-brand-success/10 text-brand-success'
                      : a.status === 'REJECTED'
                        ? 'bg-brand-danger/10 text-brand-danger'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  L{a.level}: {a.status}
                  {a.approver?.name ? ` (${a.approver.name})` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-3">
        <Button variant="danger" size="sm" onClick={() => onReject(request.id)}>
          Reject
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={() => onApprove(request.id)}
          loading={approvingId === request.id}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

export default function LeaveApprovalsPage() {
  const { showToast } = useToast();

  // Data fetching
  const { data: approvalsData, isLoading: approvalsLoading } = useLeaveApprovals();
  const { data: statsData, isLoading: statsLoading } = useLeaveApprovalStats();

  // Mutations
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  // Modal state
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Derived data
  const requests: LeaveRequest[] = approvalsData?.data ?? [];
  const stats = statsData?.data ?? null;

  const isLoading = approvalsLoading || statsLoading;

  // Handlers
  const openApproveModal = useCallback((id: number) => {
    setTargetId(id);
    setComment('');
    setModalType('approve');
  }, []);

  const openRejectModal = useCallback((id: number) => {
    setTargetId(id);
    setComment('');
    setModalType('reject');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setTargetId(null);
    setComment('');
  }, []);

  const handleApprove = useCallback(async () => {
    if (!targetId) return;
    setApprovingId(targetId);
    try {
      await approveLeave.mutateAsync({
        leaveRequestId: targetId,
        comment: comment.trim() || undefined,
      });
      showToast('Leave request approved', 'success');
      closeModal();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setApprovingId(null);
    }
  }, [targetId, comment, approveLeave, showToast, closeModal]);

  const handleReject = useCallback(async () => {
    if (!targetId) return;
    try {
      await rejectLeave.mutateAsync({
        leaveRequestId: targetId,
        comment: comment.trim() || 'No reason provided',
      });
      showToast('Leave request rejected', 'success');
      closeModal();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }, [targetId, comment, rejectLeave, showToast, closeModal]);

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
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve team leave requests.
        </p>
      </div>

      {/* Stats bar */}
      <LeaveApprovalStatBar stats={stats} />

      {/* Pending requests */}
      {requests.length === 0 ? (
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
          <p className="mt-3 text-sm text-gray-500">No pending leave requests to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {requests.map((req) => (
            <LeaveApprovalCard
              key={req.id}
              request={req}
              onApprove={openApproveModal}
              onReject={openRejectModal}
              approvingId={approvingId}
            />
          ))}
        </div>
      )}

      {/* Approve modal */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={closeModal}
        title="Approve Leave Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add an optional comment for the employee.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="Optional comment..."
            autoFocus
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleApprove}
              loading={approveLeave.isPending}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={closeModal}
        title="Reject Leave Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this leave request. The employee will be
            notified.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="Enter rejection reason..."
            autoFocus
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              loading={rejectLeave.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
