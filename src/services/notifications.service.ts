import { api } from './api';

export const notificationsService = {
  list(params?: Record<string, unknown>) {
    return api.get('/notifications', { params }).then((r) => r.data);
  },

  markAsRead(id: number) {
    return api.put(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllAsRead() {
    return api.put('/notifications/read-all').then((r) => r.data);
  },
};
