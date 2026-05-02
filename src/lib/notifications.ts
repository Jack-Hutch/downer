// Notification scheduler — fires native macOS notifications via the Electron
// main process when an event is approaching. The user's preferences in Settings
// (notify on/off, reminder window, daily summary, sound) drive when and what
// gets sent. Triggers are tracked per-event in localStorage so each event
// notifies only once per reminder window per app run.

import { useEffect } from 'react';
import { useStore } from '../store/store';
import { fmtDate } from './format';

const FIRED_KEY = 'downer-fired-notifications';
const SUMMARY_KEY = 'downer-last-daily-summary';

/** Read the set of (eventId × reminderKind) combos we've already notified for. */
function readFired(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function writeFired(fired: Set<string>) {
  try { localStorage.setItem(FIRED_KEY, JSON.stringify([...fired])); } catch {}
}

/** Reminder-window cutoff in ms. */
const WINDOW_MS = { '1h': 3_600_000, '1d': 86_400_000, '1w': 604_800_000 } as const;

export function useNotificationScheduler() {
  const settings = useStore(s => s.settings);
  const events = useStore(s => s.events);

  useEffect(() => {
    // Tick every minute. Cheap; fine for a tray-style app.
    const tick = () => {
      const now = Date.now();
      const fired = readFired();
      let dirty = false;

      // ── Per-event reminder ─────────────────────────────────────────────
      if (settings.notify) {
        const windowMs = WINDOW_MS[settings.reminderWindow];
        for (const ev of events) {
          if (ev.archived) continue;
          const ms = ev.target - now;
          if (ms <= 0) continue;                  // already past
          if (ms > windowMs) continue;            // not in window yet
          const key = `${ev.id}:${settings.reminderWindow}`;
          if (fired.has(key)) continue;           // already notified this run
          fired.add(key);
          dirty = true;
          window.downer?.showNotification({
            title: `${ev.name} is coming up`,
            body: humanizeIn(ms) + ' · ' + fmtDate(new Date(ev.target)),
            silent: !settings.notificationSound,
          });
        }
      }

      // ── Daily summary at ~9am local time ───────────────────────────────
      if (settings.dailySummary) {
        const today = new Date();
        const hour = today.getHours();
        const todayKey = today.toDateString();
        const last = localStorage.getItem(SUMMARY_KEY);
        if (hour >= 9 && last !== todayKey) {
          const upcoming = events
            .filter(e => !e.archived && e.target > now && e.target - now < WINDOW_MS['1w'])
            .sort((a, b) => a.target - b.target);
          if (upcoming.length > 0) {
            const lines = upcoming.slice(0, 3)
              .map(e => `• ${e.name} — ${humanizeIn(e.target - now)}`).join('\n');
            window.downer?.showNotification({
              title: `Your week ahead`,
              body: lines,
              silent: !settings.notificationSound,
            });
          }
          try { localStorage.setItem(SUMMARY_KEY, todayKey); } catch {}
        }
      }

      if (dirty) writeFired(fired);
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [settings.notify, settings.reminderWindow, settings.dailySummary, settings.notificationSound, events]);
}

function humanizeIn(ms: number): string {
  if (ms < 60_000) return 'in less than a minute';
  if (ms < 3_600_000) return `in ${Math.round(ms / 60_000)} minutes`;
  if (ms < 86_400_000) {
    const h = Math.round(ms / 3_600_000);
    return `in ${h} hour${h === 1 ? '' : 's'}`;
  }
  const d = Math.round(ms / 86_400_000);
  return `in ${d} day${d === 1 ? '' : 's'}`;
}

/** Reset fired-notification tracking — useful for the user-facing "Test
 *  notification" or "Reset reminders" button in Settings. */
export function resetNotificationHistory() {
  try {
    localStorage.removeItem(FIRED_KEY);
    localStorage.removeItem(SUMMARY_KEY);
  } catch {}
}
