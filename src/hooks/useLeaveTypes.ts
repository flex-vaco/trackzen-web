import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveTypesService } from '../services/leaveTypes.service';

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave', 'types'],
    queryFn: () => leaveTypesService.list(),
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => leaveTypesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      leaveTypesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}
