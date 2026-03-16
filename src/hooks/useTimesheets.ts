import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsService } from '../services/timesheets.service';

export function useTimesheets(page?: number, limit?: number) {
  return useQuery({
    queryKey: ['timesheets', page, limit],
    queryFn: () => timesheetsService.list({ page, limit }),
  });
}

export function useTimesheet(id?: number) {
  return useQuery({
    queryKey: ['timesheets', id],
    queryFn: () => timesheetsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { weekStartDate: string }) => timesheetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useUpdateTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      timesheetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useDeleteTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => timesheetsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useSubmitTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => timesheetsService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useCopyPreviousWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weekStartDate, force }: { weekStartDate: string; force?: boolean }) =>
      timesheetsService.copyPreviousWeek(weekStartDate, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useAddTimeEntry(timesheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => timesheetsService.addEntry(timesheetId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', timesheetId] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useUpdateTimeEntry(timesheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, dto }: { entryId: number; dto: Record<string, unknown> }) =>
      timesheetsService.updateEntry(timesheetId, entryId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', timesheetId] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useDeleteTimeEntry(timesheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => timesheetsService.deleteEntry(timesheetId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', timesheetId] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}
