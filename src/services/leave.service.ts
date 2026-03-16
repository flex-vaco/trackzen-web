import { api } from './api';

export const leaveService = {
  list(params?: Record<string, unknown>) {
    return api.get('/leave', { params }).then((r) => r.data);
  },

  create(data: Record<string, unknown>) {
    return api.post('/leave', data).then((r) => r.data);
  },

  getById(id: number) {
    return api.get(`/leave/${id}`).then((r) => r.data);
  },

  update(id: number, data: Record<string, unknown>) {
    return api.put(`/leave/${id}`, data).then((r) => r.data);
  },

  cancel(id: number, reason?: string) {
    return api.post(`/leave/${id}/cancel`, { reason }).then((r) => r.data);
  },
};
