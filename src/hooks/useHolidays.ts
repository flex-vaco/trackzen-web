import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysService } from '../services/holidays.service';

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidaysService.list(year ? { year } : undefined),
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => holidaysService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => holidaysService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}
