import { api } from './api';

export const leaveCalendarService = {
  getCalendar(from: string, to: string) {
    return api.get('/leave-calendar', { params: { from, to } }).then((r) => r.data);
  },
};
