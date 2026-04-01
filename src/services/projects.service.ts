import { api } from './api';

export const projectsService = {
  list(params?: Record<string, unknown>) {
    return api.get('/projects', { params }).then((r) => r.data);
  },

  create(data: Record<string, unknown>) {
    return api.post('/projects', data).then((r) => r.data);
  },

  update(id: number, data: Record<string, unknown>) {
    return api.put(`/projects/${id}`, data).then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/projects/${id}`).then((r) => r.data);
  },

  assignEmployees(id: number, employeeIds: number[]) {
    return api.put(`/projects/${id}/employees`, { employeeIds }).then((r) => r.data);
  },
};
