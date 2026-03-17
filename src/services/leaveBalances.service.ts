import { api } from './api';

export const leaveBalancesService = {
  getOwn(params?: Record<string, unknown>) {
    return api.get('/leave/balances', { params }).then((r) => r.data);
  },

  getByUserId(userId: number, params?: Record<string, unknown>) {
    return api.get(`/leave/balances/${userId}`, { params }).then((r) => r.data);
  },
};
