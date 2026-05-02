import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Seg, Toggle, Btn } from '../components/primitives';
import { BrandMark } from '../components/BrandMark';
import { FontPicker } from '../components/FontPicker';
import { UpdateCheck } from '../components/UpdateCheck';
import { WINDOW_PRESETS } from '../types';
import { APP_VERSION } from '../lib/version';
import { resetNotificationHistory } from '../lib/notifications';
import { useState, useRef } from 'react';

export function SettingsView() {
  const { settings, setSettings } = useStore();

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar title="Settings" subtitle="Customize how Downer looks and behaves" />
      <div className="flex-1 overflow-auto py-6 px-8 max-w-[720px] w-full self-center">

        {/* ── APPEARANCE ─────────────────────────────────────────────── */}
        <Section title="Appearance" desc="Theme, density and animations.">
          <Row label="Theme" desc="Switch between light and dark modes."
            control={<Seg value={settings.theme} onChange={v => setSettings({ theme: v as any })}
              options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'auto', l: 'Auto' }]} />} />
          <Row label="Accent color" desc="Highlight color across the app."
            control={
              <div className="flex gap-1.5">
                {['#d97757', '#5b8def', '#10b981', '#a78bfa', '#ec4899', '#14120f'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSettings({ accent: c })}
                    className="w-[22px] h-[22px] rounded-md"
                    style={{
                      background: c,
                      boxShadow: settings.accent === c
                        ? '0 0 0 2px rgb(var(--bg)), 0 0 0 3.5px rgb(var(--fg))'
                        : 'inset 0 0 0 0.5px rgba(0,0,0,0.1)',
                    }}
                    aria-label={`Accent ${c}`}
                  />
                ))}
              </div>
            } />
          <Row label="Density" desc="Compact, regular or comfy spacing."
            control={<Seg value={settings.density} onChange={v => setSettings({ density: v as any })}
              options={[{ v: 'compact', l: 'Compact' }, { v: 'regular', l: 'Regular' }, { v: 'comfy', l: 'Comfy' }]} />} />
          <Row label="Animations" desc="Smooth transitions across the app. Turn off for instant updates."
            control={<Toggle value={settings.animations} onChange={v => setSettings({ animations: v })} />} />
          <Row label="Font" desc="Typography across the app. Pick from system fonts grouped by style."
            control={<FontPicker value={settings.font} onChange={id => setSettings({ font: id })} />} />
        </Section>

        {/* ── FORMAT ──────────────────────────────────────────────── */}
        <Section title="Format" desc="How dates and times are displayed throughout the app.">
          <Row label="Date format"
            desc={dateFormatExample(settings.dateFormat)}
            control={<Seg value={settings.dateFormat} onChange={v => setSettings({ dateFormat: v as any })}
              options={[
                { v: 'us',  l: 'US' },
                { v: 'eu',  l: 'EU' },
                { v: 'iso', l: 'ISO' },
              ]} />} />
          <Row label="Time format"
            desc={settings.timeFormat === '12h' ? 'e.g. 4:30 PM' : 'e.g. 16:30'}
            control={<Seg value={settings.timeFormat} onChange={v => setSettings({ timeFormat: v as any })}
              options={[{ v: '12h', l: '12-hour' }, { v: '24h', l: '24-hour' }]} />} />
          <Row label="Week starts on"
            control={<Seg value={settings.weekStart} onChange={v => setSettings({ weekStart: v as any })}
              options={[{ v: 'sun', l: 'Sunday' }, { v: 'mon', l: 'Monday' }]} />} />
        </Section>

        {/* ── DEFAULTS ────────────────────────────────────────────── */}
        <Section title="Countdown defaults" desc="How countdowns are rendered.">
          <Row label="Default countdown style"
            desc="Override the per-event style with a single style across the dashboard."
            control={<Seg value={settings.defaultStyle} onChange={v => setSettings({ defaultStyle: v as any })}
              options={[
                { v: 'auto', l: 'Per event' }, { v: 'large', l: 'Number' },
                { v: 'digital', l: 'Digital' }, { v: 'ring', l: 'Ring' }, { v: 'flip', l: 'Flip' },
              ]} />} />
          <Row label="Show seconds" desc="Include seconds in clock-style countdowns."
            control={<Toggle value={settings.showSeconds} onChange={v => setSettings({ showSeconds: v })} />} />
          <Row label="Days only" desc="Hide hours, minutes and seconds. Just the day count."
            control={<Toggle value={settings.daysOnly} onChange={v => setSettings({ daysOnly: v })} />} />
        </Section>

        {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
        <Section title="Notifications" desc="Reminders fire as native macOS notifications.">
          <Row label="Notify before event" desc="Get a reminder when an event is approaching."
            control={<Toggle value={settings.notify} onChange={v => setSettings({ notify: v })} />} />
          <Row label="Reminder window" desc="How far ahead of an event to notify you."
            control={<Seg value={settings.reminderWindow} onChange={v => setSettings({ reminderWindow: v as any })}
              options={[{ v: '1h', l: '1 hour' }, { v: '1d', l: '1 day' }, { v: '1w', l: '1 week' }]} />} />
          <Row label="Daily summary" desc="A digest of upcoming events at 9:00 AM each morning."
            control={<Toggle value={settings.dailySummary} onChange={v => setSettings({ dailySummary: v })} />} />
          <Row label="Sound" desc="Play the system notification sound."
            control={<Toggle value={settings.notificationSound} onChange={v => setSettings({ notificationSound: v })} />} />
          <Row label="Test"
            desc="Fire one right now to confirm notifications are working on your Mac."
            control={
              <div className="flex gap-2">
                <Btn size="sm" onClick={() => {
                  window.downer?.showNotification({
                    title: 'Downer is set up',
                    body: 'Notifications are working — you\'ll get a reminder when events are coming up.',
                    silent: !settings.notificationSound,
                  });
                }}>Send test</Btn>
                <Btn size="sm" onClick={() => resetNotificationHistory()}>Reset history</Btn>
              </div>
            } />
        </Section>

        {/* ── WINDOW SIZE ─────────────────────────────────────────── */}
        <Section title="Window size" desc="Resize the main Downer window. Drag the corner anytime to fine-tune.">
          <Row label="Preset"
            control={
              <Seg
                value={settings.windowSize}
                onChange={v => {
                  const next = v as typeof settings.windowSize;
                  setSettings({ windowSize: next });
                  if (next !== 'custom') {
                    const p = WINDOW_PRESETS[next];
                    window.downer?.setWindowSize(p);
                  } else {
                    window.downer?.setWindowSize(settings.customWindowSize);
                  }
                }}
                options={[
                  { v: 'small',  l: 'Small' },
                  { v: 'medium', l: 'Medium' },
                  { v: 'large',  l: 'Large' },
                  { v: 'custom', l: 'Custom' },
                ]}
              />
            }
          />
          {settings.windowSize !== 'custom' && (
            <div className="text-[11.5px] text-fg-sub mt-2 mb-2 tabular-nums">
              {WINDOW_PRESETS[settings.windowSize].width} × {WINDOW_PRESETS[settings.windowSize].height} px
            </div>
          )}
          {settings.windowSize === 'custom' && (
            <Row label="Custom dimensions" desc="Width and height in pixels. Min 800 × 600, max 3840 × 2400."
              control={
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={800} max={3840} step={10}
                    value={settings.customWindowSize.width}
                    onChange={e => {
                      const w = Math.max(800, Math.min(3840, Number(e.target.value) || 1280));
                      setSettings({ customWindowSize: { ...settings.customWindowSize, width: w } });
                    }}
                    className="w-20 h-8 px-2 rounded-md border-[0.5px] border-fg/10 bg-surface text-fg text-[13px] tabular-nums outline-none focus:border-fg/40"
                  />
                  <span className="text-fg-sub text-[12px]">×</span>
                  <input
                    type="number" min={600} max={2400} step={10}
                    value={settings.customWindowSize.height}
                    onChange={e => {
                      const h = Math.max(600, Math.min(2400, Number(e.target.value) || 820));
                      setSettings({ customWindowSize: { ...settings.customWindowSize, height: h } });
                    }}
                    className="w-20 h-8 px-2 rounded-md border-[0.5px] border-fg/10 bg-surface text-fg text-[13px] tabular-nums outline-none focus:border-fg/40"
                  />
                  <Btn size="sm" onClick={() => window.downer?.setWindowSize(settings.customWindowSize)}>Apply</Btn>
                </div>
              }
            />
          )}
        </Section>

        {/* ── WIDGETS ─────────────────────────────────────────────── */}
        <Section title="Widgets & desktop" desc="Floating countdowns that live across all Spaces.">
          <Row label="Default mode for new widgets"
            desc="Float pins above all windows. On desktop sits at normal level."
            control={<Seg
              value={settings.alwaysOnTop ? 'float' : 'desktop'}
              onChange={v => setSettings({ alwaysOnTop: v === 'float' })}
              options={[{ v: 'desktop', l: 'On desktop' }, { v: 'float', l: 'Float above' }]}
            />} />
          <Row label="Show in menu bar" desc="Quick access to upcoming events from the system tray."
            control={<Toggle value={settings.menuBar} onChange={v => setSettings({ menuBar: v })} />} />
          <Row label="Launch at login" desc="Open Downer automatically when you log into your Mac."
            control={<Toggle value={settings.launchAtLogin} onChange={v => {
              setSettings({ launchAtLogin: v });
              window.downer?.setLaunchAtLogin(v);
            }} />} />
        </Section>

        {/* ── DATA ───────────────────────────────────────────────── */}
        <DataSection />

        {/* ── KEYBOARD SHORTCUTS ────────────────────────────────── */}
        <Section title="Keyboard shortcuts" desc="Common actions, faster.">
          {[
            { keys: '⌘ N',          label: 'New event' },
            { keys: '⌘ ,',          label: 'Open Settings' },
            { keys: '⌘ W',          label: 'Close current view (back to dashboard)' },
            { keys: '⌘ F',          label: 'Search countdowns' },
            { keys: '⌘ ⇧ D',        label: 'Toggle dark mode' },
          ].map(s => (
            <div key={s.label}
              className="flex items-center justify-between py-2.5 border-b-[0.5px] border-fg/10 last:border-b-0">
              <span className="text-[12.5px] text-fg">{s.label}</span>
              <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-hover text-fg-mid">{s.keys}</kbd>
            </div>
          ))}
        </Section>

        {/* ── UPDATES ───────────────────────────────────────────── */}
        <Section title="Updates" desc="Downer checks GitHub Releases for new versions.">
          <UpdateCheck />
        </Section>

        {/* ── ABOUT ─────────────────────────────────────────────── */}
        <Section title="About">
          <div className="flex items-center gap-3.5 py-2">
            <BrandMark size={44} accent={settings.accent} />
            <div>
              <div className="text-[13px] font-semibold text-fg">Downer</div>
              <div className="text-[11.5px] text-fg-sub">Version {APP_VERSION} · macOS 11+</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── DATA SECTION (export / import / reset) ───────────────────────────────────

function DataSection() {
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const data = localStorage.getItem('downer-state');
    if (!data) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `downer-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        // Validate it looks like a Downer backup before clobbering state.
        if (!parsed.state || !Array.isArray(parsed.state.events)) {
          throw new Error('Not a Downer backup file.');
        }
        localStorage.setItem('downer-state', String(reader.result));
        setImportMsg('Imported. Reloading…');
        setTimeout(() => location.reload(), 800);
      } catch (e) {
        setImportMsg(`Import failed: ${e instanceof Error ? e.message : 'Bad file'}`);
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (resetting) {
      localStorage.removeItem('downer-state');
      localStorage.removeItem('downer-fired-notifications');
      localStorage.removeItem('downer-last-daily-summary');
      location.reload();
    } else {
      setResetting(true);
      setTimeout(() => setResetting(false), 5000);
    }
  };

  return (
    <Section title="Your data" desc="Everything is stored locally on your Mac. No cloud, no telemetry.">
      <Row label="Export backup"
        desc="Download a JSON file with all your events, categories, widgets and settings."
        control={<Btn size="sm" onClick={exportData} icon="archive">Export…</Btn>} />
      <Row label="Import backup"
        desc="Restore from a previous export. Replaces all current data."
        control={
          <div className="flex flex-col items-end gap-1">
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => e.target.files?.[0] && importData(e.target.files[0])}
            />
            <Btn size="sm" onClick={() => fileInput.current?.click()}>Choose file…</Btn>
            {importMsg && <span className="text-[11px] text-fg-sub">{importMsg}</span>}
          </div>
        } />
      <Row label="Reset all data"
        desc="Delete every event, category, widget, and setting. Cannot be undone."
        control={<Btn size="sm" danger onClick={reset} icon="trash">
          {resetting ? 'Click again to confirm' : 'Reset…'}
        </Btn>} />
    </Section>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function dateFormatExample(f: 'us' | 'eu' | 'iso'): string {
  const sample = new Date(2026, 3, 30); // Apr 30 2026
  if (f === 'iso') return 'e.g. 2026-04-30';
  if (f === 'eu') return 'e.g. ' + sample.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return 'e.g. ' + sample.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="text-[13px] font-semibold text-fg mb-1">{title}</div>
      {desc && <div className="text-[12px] text-fg-sub mb-3">{desc}</div>}
      {children}
    </div>
  );
}

function Row({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b-[0.5px] border-fg/10">
      <div className="flex-1">
        <div className="text-[12.5px] font-medium text-fg">{label}</div>
        {desc && <div className="text-[11.5px] text-fg-sub mt-0.5">{desc}</div>}
      </div>
      {control}
    </div>
  );
}
