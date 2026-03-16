import { useQuery } from '@tanstack/react-query';
import { getReports, type ReportFilters } from '../services/reports.service';

export function useReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => getReports(filters!),
    enabled: !!filters,
  });
}

export { exportReport, exportMonthly, type ReportFilters } from '../services/reports.service';
