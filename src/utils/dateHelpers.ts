export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

export function nextWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d;
}

export function prevWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return d;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const eStr = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${sStr} - ${eStr}`;
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayLabels(weekStart: Date): Array<{ label: string; date: string }> {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { label, date: `${d.getMonth() + 1}/${d.getDate()}` };
  });
}
