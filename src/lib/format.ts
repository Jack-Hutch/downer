export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDateTime = (d: Date) =>
  `${fmtDate(d)} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

export const fmtRelative = (d: Date) => {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Past';
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.round(days / 7)} weeks`;
  if (days < 365) return `In ${Math.round(days / 30)} months`;
  return `In ${(days / 365).toFixed(1)} years`;
};

export const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export const toDateInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const toTimeInput = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const setDatePart = (ms: number, val: string) => {
  const [y, m, day] = val.split('-').map(Number);
  const n = new Date(ms);
  n.setFullYear(y, m - 1, day);
  return n.getTime();
};
export const setTimePart = (ms: number, val: string) => {
  const [h, m] = val.split(':').map(Number);
  const n = new Date(ms);
  n.setHours(h, m, 0, 0);
  return n.getTime();
};
