import { api } from './api';

export const leaveApprovalsService = {
  list(params?: Record<string, unknown>) {
    return api.get('/leave-approvals', { params }).then((r) => r.data);
  },

  getStats() {
    return api.get('/leave-approvals/stats').then((r) => r.data);
  },

  approve(leaveRequestId: number, comment?: string) {
    return api.post(`/leave-approvals/${leaveRequestId}/approve`, { comment }).then((r) => r.data);
  },

  reject(leaveRequestId: number, comment: string) {
    return api.post(`/leave-approvals/${leaveRequestId}/reject`, { comment }).then((r) => r.data);
  },
};
