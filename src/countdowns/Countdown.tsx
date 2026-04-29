import { useEffect, useState } from 'react';
import { pad } from '../lib/format';
import type { CountdownStyle } from '../types';

const MONO = '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace';
const SANS = '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif';

export function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = target - now;
  const clamped = Math.max(0, t);
  const days = Math.floor(clamped / 86400000);
  const hours = Math.floor((clamped % 86400000) / 3600000);
  const mins = Math.floor((clamped % 3600000) / 60000);
  const secs = Math.floor((clamped % 60000) / 1000);
  return { days, hours, mins, secs, total: clamped, past: t <= 0 };
}

interface BaseProps {
  target: number;
  accent?: string;
  dark?: boolean;
  size?: number;
  createdAt?: number;
}

export function CDLargeNumber({ target, accent = '#29261b', dark = false, size = 1 }: BaseProps) {
  const { days, past } = useCountdown(target);
  const fg = dark ? 'rgba(255,255,255,0.95)' : 'rgba(20,18,15,0.95)';
  const sub = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,18,15,0.45)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontFamily: SANS, color: fg }}>
      <div style={{
        fontSize: 96 * size, fontWeight: 200, letterSpacing: '-0.04em',
        lineHeight: 0.9, fontVariantNumeric: 'tabular-nums', color: accent,
      }}>{past ? 0 : days}</div>
      <div style={{
        fontSize: 13 * size, fontWeight: 500, marginTop: 6 * size,
        textTransform: 'uppercase', letterSpacing: '0.18em', color: sub,
      }}>{past ? 'Today' : `Day${days === 1 ? '' : 's'}`}</div>
    </div>
  );
}

export function CDDigital({ target, dark = false, size = 1 }: BaseProps) {
  const { days, hours, mins, secs } = useCountdown(target);
  const fg = dark ? 'rgba(255,255,255,0.95)' : 'rgba(20,18,15,0.95)';
  const sub = dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,18,15,0.4)';
  const sep = dark ? 'rgba(255,255,255,0.2)' : 'rgba(20,18,15,0.18)';
  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 * size }}>
      <div style={{
        fontSize: 56 * size, fontWeight: 300, fontFamily: MONO,
        fontVariantNumeric: 'tabular-nums', color: fg, lineHeight: 1, letterSpacing: '-0.02em',
      }}>{pad(v)}</div>
      <div style={{
        fontSize: 9 * size, fontWeight: 600, color: sub,
        textTransform: 'uppercase', letterSpacing: '0.22em', marginTop: 8 * size,
      }}>{l}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 * size }}>
      <Cell v={days} l="Days" />
      <span style={{ fontSize: 44 * size, color: sep, fontFamily: MONO, fontWeight: 200, lineHeight: 1, paddingTop: 4 * size }}>:</span>
      <Cell v={hours} l="Hrs" />
      <span style={{ fontSize: 44 * size, color: sep, fontFamily: MONO, fontWeight: 200, lineHeight: 1, paddingTop: 4 * size }}>:</span>
      <Cell v={mins} l="Min" />
      <span style={{ fontSize: 44 * size, color: sep, fontFamily: MONO, fontWeight: 200, lineHeight: 1, paddingTop: 4 * size }}>:</span>
      <Cell v={secs} l="Sec" />
    </div>
  );
}

export function CDRing({ target, accent = '#29261b', dark = false, size = 1, createdAt }: BaseProps) {
  const { days, hours, mins, total, past } = useCountdown(target);
  const start = createdAt ?? (target - 30 * 86400000);
  const span = Math.max(1, target - start);
  const elapsed = Math.max(0, Math.min(span, span - total));
  const progress = past ? 1 : elapsed / span;
  const px = 220 * size;
  const stroke = 10 * size;
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fg = dark ? 'rgba(255,255,255,0.95)' : 'rgba(20,18,15,0.95)';
  const sub = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,18,15,0.45)';
  const track = dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,18,15,0.07)';
  return (
    <div style={{ position: 'relative', width: px, height: px }}>
      <svg width={px} height={px} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={accent}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS }}>
        <div style={{ fontSize: 56 * size, fontWeight: 200, color: fg, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{days}</div>
        <div style={{ fontSize: 10 * size, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6 * size }}>
          {`Days · ${hours}h ${pad(mins)}m`}
        </div>
        <div style={{ fontSize: 10 * size, color: accent, marginTop: 4 * size, fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}

export function CDDots({ target, accent = '#29261b', dark = false, size = 1 }: BaseProps) {
  const { days, past } = useCountdown(target);
  const totalDots = 30;
  const remaining = Math.min(totalDots, days + 1);
  const filled = Math.max(0, totalDots - remaining);
  const dot = 14 * size;
  const gap = 6 * size;
  const cols = Math.min(15, totalDots);
  const fg = dark ? 'rgba(255,255,255,0.95)' : 'rgba(20,18,15,0.95)';
  const sub = dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,18,15,0.4)';
  const off = dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,18,15,0.08)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * size, fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 * size }}>
        <div style={{ fontSize: 36 * size, fontWeight: 300, color: fg, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{past ? 0 : days}</div>
        <div style={{ fontSize: 10 * size, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Days remaining</div>
      </div>
      <div style={{ display: 'grid', gap: gap, gridTemplateColumns: `repeat(${cols}, ${dot}px)` }}>
        {Array.from({ length: totalDots }).map((_, i) => {
          const isFilled = i < filled;
          return (
            <div key={i} style={{
              width: dot, height: dot * 2.2, borderRadius: dot,
              background: isFilled ? accent : off,
              opacity: isFilled ? (0.35 + 0.65 * (i / Math.max(1, filled))) : 1,
              transition: 'background .4s, opacity .4s',
            }} />
          );
        })}
      </div>
    </div>
  );
}

function FlipDigit({ value, size = 1 }: { value: string; size?: number }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  useEffect(() => {
    if (value !== prev) {
      setFlipping(true);
      const t = setTimeout(() => { setPrev(value); setFlipping(false); }, 480);
      return () => clearTimeout(t);
    }
  }, [value, prev]);
  const w = 44 * size, h = 64 * size;
  const bg = '#1a1815';
  const fg = '#f5f1e8';
  const line = 'rgba(0,0,0,0.4)';
  const cardStyle: React.CSSProperties = {
    position: 'absolute', left: 0, right: 0, height: h / 2, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, color: fg, fontFamily: MONO, fontWeight: 500,
    fontSize: h * 0.78, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
  };
  return (
    <div style={{ position: 'relative', width: w, height: h, perspective: 400 }}>
      <div style={{ ...cardStyle, top: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
        <span style={{ transform: `translateY(${h * 0.39}px)` }}>{value}</span>
      </div>
      <div style={{ ...cardStyle, bottom: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>
        <span style={{ transform: `translateY(${-h * 0.11}px)` }}>{prev}</span>
      </div>
      {flipping && (
        <div style={{
          ...cardStyle, top: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6,
          transformOrigin: 'bottom', transformStyle: 'preserve-3d',
          animation: 'flipTop .48s cubic-bezier(.4,0,.6,1) forwards', zIndex: 2,
        }}>
          <span style={{ transform: `translateY(${h * 0.39}px)` }}>{prev}</span>
        </div>
      )}
      {flipping && (
        <div style={{
          ...cardStyle, bottom: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
          transformOrigin: 'top', transformStyle: 'preserve-3d',
          animation: 'flipBot .48s cubic-bezier(.4,0,.6,1) forwards', zIndex: 2,
        }}>
          <span style={{ transform: `translateY(${-h * 0.11}px)` }}>{value}</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: h / 2 - 0.5, left: 0, right: 0, height: 1, background: line, zIndex: 3 }} />
    </div>
  );
}

export function CDFlip({ target, dark = false, size = 1 }: BaseProps) {
  const { days, hours, mins, secs } = useCountdown(target);
  const sub = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,18,15,0.45)';
  const Group = ({ v, l, w = 2 }: { v: number; l: string; w?: number }) => {
    const s = pad(v, w);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * size }}>
        <div style={{ display: 'flex', gap: 4 * size }}>
          {s.split('').map((d, i) => <FlipDigit key={i} value={d} size={size} />)}
        </div>
        <div style={{ fontSize: 9 * size, fontWeight: 600, color: sub, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.22em' }}>{l}</div>
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', gap: 14 * size, alignItems: 'flex-start' }}>
      <Group v={days} l="Days" w={String(days).length > 2 ? 3 : 2} />
      <Group v={hours} l="Hours" />
      <Group v={mins} l="Minutes" />
      <Group v={secs} l="Seconds" />
    </div>
  );
}

export function Countdown({ style = 'large', ...props }: BaseProps & { style?: CountdownStyle }) {
  switch (style) {
    case 'digital': return <CDDigital {...props} />;
    case 'ring': return <CDRing {...props} />;
    case 'dots': return <CDDots {...props} />;
    case 'flip': return <CDFlip {...props} />;
    default: return <CDLargeNumber {...props} />;
  }
}
