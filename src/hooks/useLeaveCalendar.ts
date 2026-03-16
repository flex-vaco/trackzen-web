import { useQuery } from '@tanstack/react-query';
import { leaveCalendarService } from '../services/leaveCalendar.service';

export function useLeaveCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: ['leave', 'calendar', { from, to }],
    queryFn: () => leaveCalendarService.getCalendar(from!, to!),
    enabled: !!from && !!to,
  });
}
