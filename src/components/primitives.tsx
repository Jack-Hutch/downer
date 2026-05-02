import { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import {
  Home, Grid as GridIcon, List as ListIcon, Plus, Star, Tag, Archive, Settings as SettingsIcon,
  LayoutGrid, Bell, Repeat, Calendar, Pin, Eye, Search, ArrowDownUp, ArrowRight, Check, X,
  Pencil, Trash2, Maximize2, ArrowUpToLine, Image as ImageIcon, Sun, Moon, Circle,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  home: Home, grid: GridIcon, list: ListIcon, plus: Plus, star: Star, tag: Tag,
  archive: Archive, settings: SettingsIcon, widget: LayoutGrid, bell: Bell, repeat: Repeat,
  cal: Calendar, pin: Pin, eye: Eye, search: Search, sort: ArrowDownUp, arrow: ArrowRight,
  check: Check, x: X, edit: Pencil, trash: Trash2, expand: Maximize2, pinTop: ArrowUpToLine,
  image: ImageIcon, sun: Sun, moon: Moon, dot: Circle,
};

export function Icon({ name, size = 16, className = '', strokeWidth = 1.6 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = ICONS[name];
  if (!C) return null;
  return <C size={size} strokeWidth={strokeWidth} className={className} />;
}

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  primary?: boolean;
  danger?: boolean;
  ghost?: boolean;
  size?: 'sm' | 'md';
  icon?: string;
  children?: ReactNode;
}

export function Btn({ primary, danger, ghost, size = 'md', icon, children, className = '', style, ...rest }: BtnProps) {
  const base = 'inline-flex items-center gap-1.5 whitespace-nowrap font-medium rounded-lg transition active:scale-[0.98]';
  const sz = size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-[34px] px-3.5 text-[12.5px]';
  let look = 'border-[0.5px] border-fg/10 text-fg hover:bg-hover';
  // Primary buttons paint with the user's chosen accent so picking a new
  // accent in Settings is immediately visible across the app.
  let inlineStyle: React.CSSProperties | undefined;
  if (primary) {
    look = 'text-white hover:opacity-90 border-[0.5px] border-transparent';
    inlineStyle = { background: 'var(--accent)', color: '#fff' };
  } else if (danger) {
    look = 'bg-red-600 text-white hover:bg-red-700 border-[0.5px] border-transparent';
  } else if (ghost) {
    look = 'text-fg-mid hover:bg-hover border-[0.5px] border-transparent';
  }
  const disabled = rest.disabled ? 'opacity-40 pointer-events-none' : '';
  return (
    <button {...rest} style={{ ...inlineStyle, ...style }} className={`${base} ${sz} ${look} ${disabled} ${className}`}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </button>
  );
}

export function Pill({ children, color, className = '' }: { children: ReactNode; color?: string; className?: string }) {
  const style: CSSProperties = color
    ? { background: `${color}1f`, color }
    : {};
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-medium ${color ? '' : 'bg-hover text-fg-mid'} ${className}`}
      style={style}
    >
      {color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-[38px] h-[22px] rounded-full transition-colors"
      style={{ background: value ? 'var(--accent)' : 'rgb(var(--fg) / 0.15)' }}
    >
      <span
        className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-[left]"
        style={{ left: value ? 18 : 2 }}
      />
    </button>
  );
}

export function Seg<T extends string>({ value, options, onChange }: {
  value: T; options: { v: T; l: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-0.5 bg-hover rounded-md">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`h-[26px] px-3 text-[12px] font-medium rounded transition ${
            value === o.v ? 'bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'text-fg-mid'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
