import { api } from './api';

export const settingsService = {
  get() {
    return api.get('/settings').then((r) => r.data);
  },

  update(data: Record<string, unknown>) {
    return api.put('/settings', data).then((r) => r.data);
  },
};
