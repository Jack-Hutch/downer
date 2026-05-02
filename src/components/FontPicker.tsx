import { useEffect, useRef, useState } from 'react';

/** A font choice — `id` is what we persist in settings; `stack` is the actual
 *  CSS font-family value applied via `--app-font`. */
export interface FontOption {
  id: string;
  label: string;
  stack: string;
  category: 'Sans' | 'Serif' | 'Mono' | 'Display';
}

/**
 * The catalogue. The first three (`sans`, `serif`, `mono`) keep the legacy
 * preset IDs so previously-saved settings continue to work. Everything below
 * uses a free-form ID equal to the canonical font name.
 */
export const FONT_OPTIONS: FontOption[] = [
  // ── Sans ──
  { id: 'sans',           label: 'System (Inter / SF Pro)', stack: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif', category: 'Sans' },
  { id: 'Helvetica Neue', label: 'Helvetica Neue',          stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: 'Sans' },
  { id: 'Avenir Next',    label: 'Avenir Next',             stack: '"Avenir Next", "Avenir", -apple-system, sans-serif', category: 'Sans' },
  { id: 'Avenir',         label: 'Avenir',                  stack: '"Avenir", -apple-system, sans-serif', category: 'Sans' },
  { id: 'Verdana',        label: 'Verdana',                 stack: 'Verdana, Geneva, sans-serif', category: 'Sans' },
  { id: 'Trebuchet MS',   label: 'Trebuchet MS',            stack: '"Trebuchet MS", -apple-system, sans-serif', category: 'Sans' },

  // ── Serif ──
  { id: 'serif',           label: 'New York / Iowan Old Style', stack: '"New York", "Iowan Old Style", "Apple Garamond", Georgia, serif', category: 'Serif' },
  { id: 'Georgia',         label: 'Georgia',                    stack: 'Georgia, "Iowan Old Style", serif', category: 'Serif' },
  { id: 'Palatino',        label: 'Palatino',                   stack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif', category: 'Serif' },
  { id: 'Times New Roman', label: 'Times New Roman',            stack: '"Times New Roman", Times, serif', category: 'Serif' },
  { id: 'Iowan Old Style', label: 'Iowan Old Style',            stack: '"Iowan Old Style", Georgia, serif', category: 'Serif' },
  { id: 'Baskerville',     label: 'Baskerville',                stack: 'Baskerville, "Baskerville Old Face", serif', category: 'Serif' },

  // ── Mono ──
  { id: 'mono',           label: 'SF Mono / JetBrains Mono', stack: '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace', category: 'Mono' },
  { id: 'Menlo',          label: 'Menlo',                    stack: 'Menlo, Monaco, monospace', category: 'Mono' },
  { id: 'Monaco',         label: 'Monaco',                   stack: 'Monaco, Menlo, monospace', category: 'Mono' },
  { id: 'Courier New',    label: 'Courier New',              stack: '"Courier New", Courier, monospace', category: 'Mono' },

  // ── Display ──
  { id: 'Optima',         label: 'Optima',                   stack: 'Optima, "Optima Nova", "Helvetica Neue", sans-serif', category: 'Display' },
  { id: 'Futura',         label: 'Futura',                   stack: 'Futura, "Trebuchet MS", sans-serif', category: 'Display' },
  { id: 'Didot',          label: 'Didot',                    stack: 'Didot, "Didot LT STD", "Bodoni MT", serif', category: 'Display' },
  { id: 'Copperplate',    label: 'Copperplate',              stack: 'Copperplate, "Copperplate Gothic Light", sans-serif', category: 'Display' },
];

export function findFontOption(id: string): FontOption | undefined {
  return FONT_OPTIONS.find(f => f.id === id);
}

interface Props {
  value: string;
  onChange: (id: string) => void;
}

/**
 * Self-contained font picker. Click the trigger to open a scrollable dropdown
 * grouped by category. Each row previews itself in its own font so you can
 * pick by sight without committing first. Closes on selection, on outside
 * click, or on Escape.
 */
export function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = findFontOption(value) ?? FONT_OPTIONS[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Group options by category for the dropdown.
  const grouped = FONT_OPTIONS.reduce<Record<string, FontOption[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center justify-between gap-3 min-w-[220px] h-[30px] px-3 rounded-md bg-hover hover:bg-fg/10 text-fg text-[12.5px] font-medium transition-colors"
      >
        <span className="truncate" style={{ fontFamily: current.stack }}>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Font"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[300px] max-h-[360px] overflow-auto rounded-xl border-[0.5px] border-fg/15 bg-bg shadow-[0_16px_48px_rgba(0,0,0,0.18)] p-1.5"
        >
          {Object.entries(grouped).map(([cat, opts]) => (
            <div key={cat}>
              <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-sub">
                {cat}
              </div>
              {opts.map(o => {
                const selected = o.id === value;
                return (
                  <button
                    key={o.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(o.id); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left text-[13px] transition-colors ${
                      selected ? 'bg-hover' : 'hover:bg-hover'
                    }`}
                    style={{ fontFamily: o.stack }}
                  >
                    <span className="text-fg truncate">{o.label}</span>
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ color: 'var(--accent)' }}>
                        <path d="M2 6 L5 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
