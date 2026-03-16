import { api } from './api';

export const authService = {
  login(email: string, password: string) {
    return api.post('/auth/login', { email, password }).then((r) => r.data);
  },

  register(orgName: string, name: string, email: string, password: string) {
    return api.post('/auth/register', { orgName, name, email, password }).then((r) => r.data);
  },

  refreshToken() {
    return api.post('/auth/refresh').then((r) => r.data);
  },

  logout() {
    return api.post('/auth/logout').then((r) => r.data);
  },
};
