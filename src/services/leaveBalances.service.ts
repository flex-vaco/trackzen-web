import { api } from './api';

export const leaveBalancesService = {
  getOwn(params?: Record<string, unknown>) {
    return api.get('/leave-balances/me', { params }).then((r) => r.data);
  },

  getByUserId(userId: number, params?: Record<string, unknown>) {
    return api.get(`/leave-balances/user/${userId}`, { params }).then((r) => r.data);
  },
};
