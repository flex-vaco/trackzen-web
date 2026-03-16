import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApprovalsService } from '../services/leaveApprovals.service';

export function useLeaveApprovals() {
  return useQuery({
    queryKey: ['leave', 'approvals'],
    queryFn: () => leaveApprovalsService.list(),
  });
}

export function useLeaveApprovalStats() {
  return useQuery({
    queryKey: ['leave', 'approvals', 'stats'],
    queryFn: () => leaveApprovalsService.getStats(),
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveRequestId, comment }: { leaveRequestId: number; comment?: string }) =>
      leaveApprovalsService.approve(leaveRequestId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveRequestId, comment }: { leaveRequestId: number; comment: string }) =>
      leaveApprovalsService.reject(leaveRequestId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}
