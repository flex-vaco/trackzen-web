import { api } from './api';

export const usersService = {
  list(params?: Record<string, unknown>) {
    return api.get('/users', { params }).then((r) => r.data);
  },

  create(data: Record<string, unknown>) {
    return api.post('/users', data).then((r) => r.data);
  },

  update(id: number, data: Record<string, unknown>) {
    return api.put(`/users/${id}`, data).then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/users/${id}`).then((r) => r.data);
  },
};
