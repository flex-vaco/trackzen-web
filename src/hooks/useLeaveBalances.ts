import { useQuery } from '@tanstack/react-query';
import { leaveBalancesService } from '../services/leaveBalances.service';

export function useOwnBalances() {
  return useQuery({
    queryKey: ['leave', 'balances'],
    queryFn: () => leaveBalancesService.getOwn(),
  });
}

export function useUserBalances(userId?: number) {
  return useQuery({
    queryKey: ['leave', 'balances', userId],
    queryFn: () => leaveBalancesService.getByUserId(userId!),
    enabled: !!userId,
  });
}
