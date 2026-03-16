import { api } from './api';

export const holidaysService = {
  list(params?: Record<string, unknown>) {
    return api.get('/holidays', { params }).then((r) => r.data);
  },

  create(data: Record<string, unknown>) {
    return api.post('/holidays', data).then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/holidays/${id}`).then((r) => r.data);
  },
};
