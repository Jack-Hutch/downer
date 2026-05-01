import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/primitives';
import { themeById, COUNTDOWN_STYLES } from '../lib/themes';
import { Countdown } from '../countdowns/Countdown';
import { fmtRelative } from '../lib/format';
import type { WidgetSize } from '../types';

const SIZES: { v: WidgetSize; l: string }[] = [
  { v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' }, { v: 'large', l: 'Large' },
];

export function WidgetsView() {
  const { events, widgets, toggleWidget, updateWidget } = useStore();

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar title="Widgets" subtitle="Pin countdowns to your desktop — on the wallpaper or floating above apps" />
      <div className="flex-1 overflow-auto py-6 px-8">
        <Eyebrow>Active widgets</Eyebrow>
        <div className="grid gap-3.5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {events.filter(e => widgets[e.id]).map(ev => {
            const ct = themeById(ev.theme);
            const cfg = widgets[ev.id];
            return (
              <div key={ev.id} className="rounded-xl border-[0.5px] border-fg/10 bg-surface overflow-hidden">
                <div className="p-4 flex flex-col items-center gap-1.5" style={{ background: ct.bg, color: ct.fg }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ opacity: 0.55 }}>{ev.name}</div>
                  <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                    <Countdown style={cfg.style || ev.style} target={ev.target} accent={ct.accent} dark={ct.dark} createdAt={ev.createdAt} />
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-2.5">
                  <div className="flex gap-1">
                    {SIZES.map(s => (
                      <button
                        key={s.v}
                        onClick={() => updateWidget(ev.id, { size: s.v })}
                        className={`flex-1 h-[26px] rounded text-[11px] font-medium ${
                          cfg.size === s.v ? 'bg-fg text-bg' : 'bg-hover text-fg-mid'
                        }`}
                      >{s.l}</button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-fg-sub">Display mode</span>
                    <div className="flex p-0.5 bg-hover rounded-md">
                      {[
                        { v: 'desktop' as const, l: 'On desktop' },
                        { v: 'float' as const,   l: 'Float above' },
                      ].map(o => (
                        <button
                          key={o.v}
                          onClick={() => updateWidget(ev.id, { mode: o.v })}
                          className={`flex-1 h-[24px] text-[11.5px] font-medium rounded transition ${
                            cfg.mode === o.v ? 'bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'text-fg-mid'
                          }`}
                        >{o.l}</button>
                      ))}
                    </div>
                    <span className="text-[10.5px] text-fg-sub leading-snug">
                      {cfg.mode === 'desktop'
                        ? 'Sits behind app windows on your wallpaper. Click-through.'
                        : 'Always on top of every other window.'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleWidget(ev.id, false)}
                    className="h-[26px] rounded bg-hover text-fg-mid text-[11.5px]"
                  >Remove from desktop</button>
                </div>
              </div>
            );
          })}
          {Object.keys(widgets).length === 0 && (
            <div className="p-6 rounded-xl border border-dashed border-fg/10 text-fg-sub text-[12.5px] text-center" style={{ gridColumn: '1/-1' }}>
              No widgets pinned yet. Add one from the list below.
            </div>
          )}
        </div>

        <Eyebrow>Available events</Eyebrow>
        <div className="bg-surface rounded-xl border-[0.5px] border-fg/10 overflow-hidden">
          {events.filter(e => !e.archived).map((ev, i) => {
            const on = !!widgets[ev.id];
            const ct = themeById(ev.theme);
            return (
              <div key={ev.id} className="flex items-center gap-3.5 px-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgb(var(--fg) / 0.08)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ct.accent }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-fg">{ev.name}</div>
                  <div className="text-[11.5px] text-fg-sub mt-px">
                    {fmtRelative(new Date(ev.target))} · {COUNTDOWN_STYLES.find(s => s.value === ev.style)?.label}
                  </div>
                </div>
                <Btn size="sm" primary={on} onClick={() => toggleWidget(ev.id, !on)}>
                  {on ? 'Pinned' : 'Pin to desktop'}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-sub mb-3">{children}</div>;
}
