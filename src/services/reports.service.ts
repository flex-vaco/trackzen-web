import { api } from './api';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  status?: string;
  projectId?: number;
}

export async function getReports(filters: ReportFilters) {
  const { data } = await api.get('/reports', { params: filters });
  return data;
}

export async function exportReport(format: 'csv' | 'excel' | 'pdf', filters: ReportFilters) {
  const response = await api.get('/reports/export', {
    params: { format, ...filters },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportMonthly(userId: number, year: number, month: number) {
  const response = await api.get('/reports/export-monthly', {
    params: { userId, year, month },
    responseType: 'blob',
  });
  return response.data;
}
