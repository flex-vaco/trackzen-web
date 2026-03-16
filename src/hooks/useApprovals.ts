import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsService } from '../services/approvals.service';

export function useApprovals(page?: number, limit?: number) {
  return useQuery({
    queryKey: ['approvals', page, limit],
    queryFn: () => approvalsService.list({ page, limit }),
  });
}

export function useApprovalStats() {
  return useQuery({
    queryKey: ['approvals', 'stats'],
    queryFn: () => approvalsService.getStats(),
  });
}

export function useApproveTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (timesheetId: number) => approvalsService.approve(timesheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useRejectTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ timesheetId, reason }: { timesheetId: number; reason: string }) =>
      approvalsService.reject(timesheetId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}
