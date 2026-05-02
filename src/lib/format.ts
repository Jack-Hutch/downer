// Cached settings used by the standalone fmt* functions. Updated at runtime
// by `applyFormatSettings()` whenever the user changes the relevant prefs.
let _dateFormat: 'us' | 'eu' | 'iso' = 'us';
let _timeFormat: '12h' | '24h' = '12h';

export function applyFormatSettings(s: { dateFormat?: 'us' | 'eu' | 'iso'; timeFormat?: '12h' | '24h' }) {
  if (s.dateFormat) _dateFormat = s.dateFormat;
  if (s.timeFormat) _timeFormat = s.timeFormat;
}

export const fmtDate = (d: Date) => {
  switch (_dateFormat) {
    case 'iso':
      // 2026-04-30
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    case 'eu':
      // Wed 30 Apr 2026
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    default:
      // Wed, Apr 30, 2026
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
};

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString(_timeFormat === '24h' ? 'en-GB' : 'en-US', {
    hour: _timeFormat === '24h' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: _timeFormat === '12h',
  });

export const fmtDateTime = (d: Date) => `${fmtDate(d)} · ${fmtTime(d)}`;

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
