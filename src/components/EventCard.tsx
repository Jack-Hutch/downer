import { CSSProperties } from 'react';
import { Countdown, useCountdown } from '../countdowns/Countdown';
import { useTheme } from '../lib/themes';
import { fmtDateTime } from '../lib/format';
import { Icon, Pill } from './primitives';
import type { Category, DownerEvent, CountdownStyle } from '../types';

interface CardProps {
  event: DownerEvent;
  onClick?: () => void;
  density?: 'compact' | 'regular' | 'comfy';
  styleOverride?: CountdownStyle | null;
  categories: Category[];
}

export function EventCard({ event, onClick, density = 'regular', styleOverride, categories }: CardProps) {
  const ct = useTheme(event.theme);
  const cat = categories.find(c => c.id === event.category);
  const dStyle = styleOverride || event.style;
  const padding = density === 'compact' ? 18 : density === 'comfy' ? 28 : 22;
  const h = density === 'compact' ? 200 : density === 'comfy' ? 260 : 230;

  const containerStyle: CSSProperties = {
    height: h,
    background: ct.bg,
    color: ct.fg,
    padding,
    border: `0.5px solid ${ct.dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,18,15,0.06)'}`,
  };

  const transform =
    dStyle === 'flip' ? 'scale(0.42)' :
    dStyle === 'digital' ? 'scale(0.46)' :
    dStyle === 'ring' ? 'scale(0.55)' :
    dStyle === 'dots' ? 'scale(0.7)' : 'scale(0.9)';

  return (
    <div
      onClick={onClick}
      className="relative rounded-[18px] overflow-hidden cursor-pointer flex flex-col justify-between transition shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]"
      style={containerStyle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ opacity: 0.55 }}>
          {cat && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />}
          {cat?.label || 'Event'}
        </div>
        {event.pinned && <Icon name="pin" size={13} />}
      </div>

      <div className="flex items-center justify-start flex-1 pt-3 w-full overflow-hidden min-w-0">
        <div style={{ transformOrigin: 'left center', transform, width: 'max-content', flexShrink: 0 }}>
          <Countdown
            style={dStyle}
            target={event.target}
            accent={ct.accent}
            dark={ct.dark}
            size={dStyle === 'dots' ? 0.85 : 1}
            createdAt={event.createdAt}
          />
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-[-0.01em] leading-tight truncate mb-1">{event.name}</div>
        <div className="text-[12px] truncate tabular-nums" style={{ opacity: 0.55 }}>
          {fmtDateTime(new Date(event.target))}
        </div>
      </div>
    </div>
  );
}

export function EventRow({ event, onClick, isFirst, styleOverride: _so, categories }: {
  event: DownerEvent; onClick?: () => void; isFirst?: boolean; styleOverride?: CountdownStyle | null; categories: Category[];
}) {
  const ct = useTheme(event.theme);
  const cat = categories.find(c => c.id === event.category);
  const { days, hours, mins, secs, past } = useCountdown(event.target);

  return (
    <div
      onClick={onClick}
      className="grid items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-hover"
      style={{
        gridTemplateColumns: '8px minmax(160px, 220px) minmax(80px, 1fr) auto auto',
        borderTop: isFirst ? 'none' : '0.5px solid rgb(var(--fg) / 0.08)',
      }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: ct.accent }} />
      <div>
        <div className="text-[14px] font-semibold text-fg">{event.name}</div>
        <div className="text-[11.5px] text-fg-sub mt-0.5">{fmtDateTime(new Date(event.target))}</div>
      </div>
      <div>{cat && <Pill color={cat.color}>{cat.label}</Pill>}</div>
      <div className="font-mono text-[12px] text-fg-mid tabular-nums whitespace-nowrap">
        {past ? 'past' : `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
      </div>
      <div className="text-[12px] text-fg-mid min-w-[80px] text-right">
        {past ? 'Passed' : `${days}d`}
      </div>
    </div>
  );
}
