import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Countdown } from '../countdowns/Countdown';
import { themeById } from '../lib/themes';
import { fmtRelative } from '../lib/format';
import type { DownerEvent, WidgetConfig, Settings, Category } from '../types';
import '../index.css';
import './widget.css';

interface Snapshot {
  events: DownerEvent[];
  categories: Category[];
  widgets: Record<string, WidgetConfig>;
  settings: Settings;
}

function WidgetApp() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('eventId') || '';
  const mode = (params.get('mode') as 'float' | 'desktop') || 'desktop';
  const isDesktop = mode === 'desktop';

  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    // Subscribe to store updates from the main app.
    window.downer?.onStoreSnapshot((s) => setSnap(s));
    // Tell main we're loaded so it can push the latest cached snapshot directly,
    // without us having to wait for the next state-change broadcast.
    window.downer?.notifyWidgetReady();
    // Safety retry: on a cold launch the main process may not have cached a
    // snapshot yet when our ready signal arrives. If snap is still null after
    // 600 ms, re-send the ready signal to trigger a fresh push.
    const retry = setTimeout(() => window.downer?.notifyWidgetReady(), 600);
    return () => clearTimeout(retry);
  }, []);

  // ── Render guards ──────────────────────────────────────────────────────
  // These fall back to a visible placeholder rather than `return null`, so
  // a widget always SHOWS something on screen — even before data arrives or
  // if the event was deleted while the widget was open.

  if (!snap) {
    return <Shell isDesktop={isDesktop} bg="#1c1a15" fg="#f5f1e8" message="Starting…" />;
  }
  const event = snap.events.find(e => e.id === eventId);
  if (!event) {
    return <Shell isDesktop={isDesktop} bg="#1c1a15" fg="#f5f1e8" message="Event removed" />;
  }

  const cfg = snap.widgets[eventId] || { size: 'medium' as const, mode: 'desktop' as const };
  const ct = themeById(event.theme);
  const widgetStyle = cfg.style || event.style;

  const styleScale: Record<string, Record<string, number>> = {
    large:   { small: 0.62, medium: 0.85, large: 1.05 },
    digital: { small: 0.30, medium: 0.45, large: 0.58 },
    ring:    { small: 0.45, medium: 0.62, large: 0.80 },
    dots:    { small: 0.50, medium: 0.72, large: 0.90 },
    flip:    { small: 0.28, medium: 0.42, large: 0.55 },
  };
  const scale = (styleScale[widgetStyle] || styleScale.large)[cfg.size];

  return (
    <div
      className={`absolute inset-0 rounded-[14px] overflow-hidden flex flex-col titlebar-drag`}
      style={{
        background: ct.bg,
        color: ct.fg,
        boxShadow: isDesktop
          ? '0 4px 16px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.06)'
          : '0 12px 32px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15), inset 0 0 0 0.5px rgba(255,255,255,0.1)',
      }}
    >
      {!isDesktop && (
        <div
          className="h-[22px] px-2 flex items-center justify-between flex-shrink-0"
          style={{
            background: ct.dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)',
            borderBottom: ct.dark ? '0.5px solid rgba(255,255,255,0.06)' : '0.5px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-1 no-drag">
            <button
              onClick={() => window.downer?.closeWidget(eventId)}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#ff736a' }}
              aria-label="Close widget"
            />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: ct.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: ct.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
          </div>
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ opacity: 0.55 }}>{event.name}</span>
          <span className="w-3" />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center p-2.5 gap-1 overflow-hidden min-h-0">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} className="flex items-center justify-center">
          <Countdown style={widgetStyle} target={event.target} accent={ct.accent} dark={ct.dark} createdAt={event.createdAt} />
        </div>
        <div className="text-[9.5px] tabular-nums max-w-full truncate" style={{ opacity: 0.5 }}>
          {fmtRelative(new Date(event.target))}
        </div>
      </div>
    </div>
  );
}

function Shell({ isDesktop, bg, fg, message }: { isDesktop: boolean; bg: string; fg: string; message: string }) {
  return (
    <div
      className="absolute inset-0 rounded-[14px] overflow-hidden flex items-center justify-center"
      style={{
        background: bg,
        color: fg,
        boxShadow: isDesktop
          ? '0 4px 16px rgba(0,0,0,0.18)'
          : '0 12px 32px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-50">{message}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WidgetApp />
  </React.StrictMode>
);
