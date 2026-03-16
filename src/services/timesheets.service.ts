import { api } from './api';

export const timesheetsService = {
  list(params?: Record<string, unknown>) {
    return api.get('/timesheets', { params }).then((r) => r.data);
  },

  create(data: { weekStartDate: string }) {
    return api.post('/timesheets', data).then((r) => r.data);
  },

  getById(id: number) {
    return api.get(`/timesheets/${id}`).then((r) => r.data);
  },

  update(id: number, data: Record<string, unknown>) {
    return api.put(`/timesheets/${id}`, data).then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/timesheets/${id}`).then((r) => r.data);
  },

  submit(id: number) {
    return api.post(`/timesheets/${id}/submit`).then((r) => r.data);
  },

  copyPreviousWeek(weekStartDate: string, force = false) {
    return api.post('/timesheets/copy-previous-week', { targetWeekStart: weekStartDate, force }).then((r) => r.data);
  },

  // Time entries
  getEntries(timesheetId: number) {
    return api.get(`/timesheets/${timesheetId}/entries`).then((r) => r.data);
  },

  addEntry(timesheetId: number, dto: Record<string, unknown>) {
    return api.post(`/timesheets/${timesheetId}/entries`, dto).then((r) => r.data);
  },

  updateEntry(timesheetId: number, entryId: number, dto: Record<string, unknown>) {
    return api.put(`/timesheets/${timesheetId}/entries/${entryId}`, dto).then((r) => r.data);
  },

  deleteEntry(timesheetId: number, entryId: number) {
    return api.delete(`/timesheets/${timesheetId}/entries/${entryId}`).then((r) => r.data);
  },
};
