import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '../services/leave.service';

export function useLeaveRequests(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['leave', filters],
    queryFn: () => leaveService.list(filters),
  });
}

export function useLeaveRequest(id?: number) {
  return useQuery({
    queryKey: ['leave', id],
    queryFn: () => leaveService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => leaveService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      leaveService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      leaveService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
    },
  });
}
