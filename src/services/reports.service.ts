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

export async function exportMonthly(userId: number, year: number, month: number): Promise<void> {
  const response = await api.get('/reports/export-monthly', {
    params: { userId, year, month },
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename=(.+)/);
  const filename = match ? match[1] : `timesheet-${year}-${month}.xlsx`;
  const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
