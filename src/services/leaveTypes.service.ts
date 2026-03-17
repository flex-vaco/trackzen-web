import { api } from './api';

export const leaveTypesService = {
  list(params?: Record<string, unknown>) {
    return api.get('/leave/types', { params }).then((r) => r.data);
  },

  create(data: Record<string, unknown>) {
    return api.post('/leave/types', data).then((r) => r.data);
  },

  update(id: number, data: Record<string, unknown>) {
    return api.put(`/leave/types/${id}`, data).then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/leave/types/${id}`).then((r) => r.data);
  },
};
