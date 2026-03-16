import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/team.service';

export function useMyManagers() {
  return useQuery({
    queryKey: ['team', 'my-managers'],
    queryFn: () => teamService.getMyManagers(),
  });
}

export function useMyReports() {
  return useQuery({
    queryKey: ['team', 'my-reports'],
    queryFn: () => teamService.getMyReports(),
  });
}

export function useUserManagers(userId?: number) {
  return useQuery({
    queryKey: ['team', 'managers', userId],
    queryFn: () => teamService.getUserManagers(userId!),
    enabled: !!userId,
  });
}

export function useAssignManagers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, managerIds }: { userId: number; managerIds: number[] }) =>
      teamService.assignManagers(userId, managerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
