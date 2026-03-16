import { api } from './api';

export const approvalsService = {
  list(params?: Record<string, unknown>) {
    return api.get('/approvals', { params }).then((r) => r.data);
  },

  getStats() {
    return api.get('/approvals/stats').then((r) => r.data);
  },

  approve(timesheetId: number) {
    return api.post(`/approvals/${timesheetId}/approve`).then((r) => r.data);
  },

  reject(timesheetId: number, reason: string) {
    return api.post(`/approvals/${timesheetId}/reject`, { reason }).then((r) => r.data);
  },
};
