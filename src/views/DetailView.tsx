import { useState, CSSProperties } from 'react';
import { useStore } from '../store/store';
import { useTheme, COUNTDOWN_STYLES } from '../lib/themes';
import { Countdown } from '../countdowns/Countdown';
import { Icon } from '../components/primitives';
import { fmtDateTime, fmtRelative } from '../lib/format';
import type { CountdownStyle } from '../types';

export function DetailView({ eventId }: { eventId: string }) {
  const { events, categories, settings, setView, startEdit, togglePin, archiveEvent, deleteEvent } = useStore();
  const event = events.find(e => e.id === eventId);
  const ct = useTheme(event?.theme || 'paper');
  const [active, setActive] = useState<CountdownStyle>(
    settings.defaultStyle === 'auto' ? (event?.style || 'large') : settings.defaultStyle
  );
  if (!event) return null;
  const cat = categories.find(c => c.id === event.category);
  const iconBtn: CSSProperties = {
    width: 28, height: 28, borderRadius: 7, border: 'none',
    background: 'transparent', color: ct.fg, opacity: 0.6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div className="flex flex-col h-full transition-colors" style={{ background: ct.bg, color: ct.fg }}>
      <div className="flex items-center gap-2.5 px-6 py-3.5 flex-shrink-0 titlebar-drag" style={{
        borderBottom: `0.5px solid ${ct.dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,18,15,0.06)'}`,
      }}>
        <button
          onClick={() => setView({ name: 'dashboard' })}
          className="no-drag w-7 h-7 rounded-md border-none flex items-center justify-center"
          style={{ background: ct.dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,18,15,0.05)', color: ct.fg, transform: 'scaleX(-1)' }}
        >
          <Icon name="arrow" size={13} />
        </button>
        <div className="flex-1" />
        <button onClick={() => togglePin(event.id)} title="Pin" style={iconBtn} className="no-drag"><Icon name="pin" size={14} /></button>
        <button onClick={() => startEdit(event.id)} title="Edit" style={iconBtn} className="no-drag"><Icon name="edit" size={14} /></button>
        <button onClick={() => archiveEvent(event.id)} title="Archive" style={iconBtn} className="no-drag"><Icon name="archive" size={14} /></button>
        <button onClick={() => deleteEvent(event.id)} title="Delete" style={iconBtn} className="no-drag"><Icon name="trash" size={14} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-8 overflow-auto">
        <div className="flex items-center gap-2 opacity-60">
          {cat && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />}
          <span className="text-[11px] font-medium uppercase tracking-[0.18em]">{cat?.label || 'Event'}</span>
        </div>
        <div className="text-[42px] font-semibold tracking-[-0.025em] text-center leading-tight">{event.name}</div>
        <div className="flex justify-center min-h-[240px] items-center">
          <Countdown style={active} target={event.target} accent={ct.accent} dark={ct.dark} size={1.2} createdAt={event.createdAt} />
        </div>
        <div className="text-[14px] tabular-nums" style={{ opacity: 0.55 }}>
          {fmtDateTime(new Date(event.target))} · {fmtRelative(new Date(event.target))}
        </div>
      </div>

      <div className="flex gap-1.5 px-4 py-3 justify-center flex-shrink-0" style={{
        borderTop: `0.5px solid ${ct.dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,18,15,0.06)'}`,
      }}>
        {COUNTDOWN_STYLES.map(s => (
          <button
            key={s.value}
            onClick={() => setActive(s.value)}
            className="h-[30px] px-3.5 rounded-md text-[12px] font-medium transition"
            style={{
              background: active === s.value
                ? (ct.dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,18,15,0.1)')
                : 'transparent',
              color: ct.fg,
              opacity: active === s.value ? 1 : 0.55,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
