import { api } from './api';

export const teamService = {
  getMyManagers() {
    return api.get('/team/my-managers').then((r) => r.data);
  },

  getMyReports() {
    return api.get('/team/my-reports').then((r) => r.data);
  },

  getUserManagers(userId: number) {
    return api.get(`/team/${userId}/managers`).then((r) => r.data);
  },

  assignManagers(userId: number, managerIds: number[]) {
    return api.post(`/team/${userId}/managers`, { managerIds }).then((r) => r.data);
  },
};
