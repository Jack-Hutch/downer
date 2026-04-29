import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Seg, Toggle } from '../components/primitives';

export function SettingsView() {
  const { settings, setSettings } = useStore();
  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar title="Settings" subtitle="Customize how Downer looks and behaves" />
      <div className="flex-1 overflow-auto py-6 px-8 max-w-[720px] w-full self-center">
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
                  />
                ))}
              </div>
            } />
          <Row label="Density" desc="Compact, regular or comfy spacing."
            control={<Seg value={settings.density} onChange={v => setSettings({ density: v as any })}
              options={[{ v: 'compact', l: 'Compact' }, { v: 'regular', l: 'Regular' }, { v: 'comfy', l: 'Comfy' }]} />} />
          <Row label="Animations" desc="Smooth transitions and ticking countdowns."
            control={<Toggle value={settings.animations} onChange={v => setSettings({ animations: v })} />} />
          <Row label="Font" desc="Typography across the app."
            control={<Seg value={settings.font} onChange={v => setSettings({ font: v as any })}
              options={[{ v: 'sans', l: 'Sans' }, { v: 'serif', l: 'Serif' }, { v: 'mono', l: 'Mono' }]} />} />
        </Section>

        <Section title="Defaults" desc="Applied to new countdowns.">
          <Row label="Default countdown style"
            control={<Seg value={settings.defaultStyle} onChange={v => setSettings({ defaultStyle: v as any })}
              options={[
                { v: 'auto', l: 'Per event' }, { v: 'large', l: 'Number' },
                { v: 'digital', l: 'Digital' }, { v: 'ring', l: 'Ring' }, { v: 'flip', l: 'Flip' },
              ]} />} />
          <Row label="Show seconds" desc="On clock-style countdowns."
            control={<Toggle value={settings.showSeconds} onChange={v => setSettings({ showSeconds: v })} />} />
          <Row label="Show days only" desc="Hide hours, minutes and seconds where possible."
            control={<Toggle value={settings.daysOnly} onChange={v => setSettings({ daysOnly: v })} />} />
        </Section>

        <Section title="Notifications" desc="Reminders and alerts.">
          <Row label="Notify before event" desc="Get a reminder ahead of time."
            control={<Toggle value={settings.notify} onChange={v => setSettings({ notify: v })} />} />
          <Row label="Reminder window"
            control={<Seg value={settings.reminderWindow} onChange={v => setSettings({ reminderWindow: v as any })}
              options={[{ v: '1h', l: '1h' }, { v: '1d', l: '1 day' }, { v: '1w', l: '1 week' }]} />} />
          <Row label="Daily summary" desc="Morning digest of upcoming events."
            control={<Toggle value={settings.dailySummary} onChange={v => setSettings({ dailySummary: v })} />} />
        </Section>

        <Section title="Widgets & desktop" desc="Floating, always-on-top countdowns.">
          <Row label="Always on top" desc="Pin widgets above other apps."
            control={<Toggle value={settings.alwaysOnTop} onChange={v => setSettings({ alwaysOnTop: v })} />} />
          <Row label="Show in menu bar" desc="Quick access from the system tray."
            control={<Toggle value={settings.menuBar} onChange={v => setSettings({ menuBar: v })} />} />
          <Row label="Launch at login"
            control={<Toggle value={settings.launchAtLogin} onChange={v => setSettings({ launchAtLogin: v })} />} />
        </Section>

        <Section title="About">
          <div className="flex items-center gap-3.5 py-2">
            <div className="w-11 h-11 rounded-[11px] bg-fg text-bg flex items-center justify-center font-mono font-semibold text-[20px]">D</div>
            <div>
              <div className="text-[13px] font-semibold text-fg">Downer</div>
              <div className="text-[11.5px] text-fg-sub">Version 1.4.2 · macOS 14+</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
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
