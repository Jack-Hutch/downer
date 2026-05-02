import { useState } from 'react';
import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Btn, Icon } from '../components/primitives';
import { CARD_THEMES, useResolvedThemes } from '../lib/themes';
import { Countdown } from '../countdowns/Countdown';
import type { CardTheme } from '../types';

const PALETTE = [
  '#f5f1e8', '#e8dcc4', '#dde5d8', '#d8e3ec', '#ecd8d8', '#e0dceb',
  '#f4d3a5', '#c8e3f0', '#f8c8c8', '#d4c5e8', '#ffe4c4', '#cce8d4',
  '#1a1815', '#2a2218', '#1f2937', '#312e2a',
  '#ffffff', '#f5f5f5', '#0a0a0a',
];
const ACCENT_PALETTE = [
  '#d97757', '#5b8def', '#10b981', '#a78bfa', '#ec4899', '#f59e0b',
  '#14b8a6', '#ef4444', '#8b5cf6', '#64748b', '#14120f', '#e879f9',
  '#06b6d4', '#84cc16', '#f97316',
];

const SAMPLE_TARGET = Date.now() + 47 * 86_400_000;
const SAMPLE_CREATED = Date.now() - 14 * 86_400_000;

export function ThemesView() {
  const { customThemes, addTheme, updateTheme, deleteTheme, duplicateTheme, events } = useStore();
  const allThemes = useResolvedThemes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<CardTheme, 'id' | 'builtin'>>({
    label: '', bg: '#f5f1e8', fg: '#14120f', accent: '#d97757', dark: false,
  });

  const startNew = () => {
    setEditingId('__new__');
    setDraft({ label: '', bg: '#f5f1e8', fg: '#14120f', accent: '#d97757', dark: false });
  };

  const startEditExisting = (t: CardTheme) => {
    if (t.builtin) {
      // Built-ins are read-only; offer to duplicate instead.
      const newId = duplicateTheme(t.id);
      if (newId) {
        const dup = useStore.getState().customThemes.find(x => x.id === newId);
        if (dup) {
          setEditingId(newId);
          setDraft({ label: dup.label, bg: dup.bg, fg: dup.fg, accent: dup.accent, dark: dup.dark });
        }
      }
      return;
    }
    setEditingId(t.id);
    setDraft({ label: t.label, bg: t.bg, fg: t.fg, accent: t.accent, dark: t.dark });
  };

  const save = () => {
    const label = (draft.label.trim() || 'Untitled');
    if (editingId === '__new__') {
      addTheme({ ...draft, label });
    } else if (editingId) {
      updateTheme(editingId, { ...draft, label });
    }
    setEditingId(null);
  };

  const cancel = () => setEditingId(null);

  const usageCount = (themeId: string) =>
    events.filter(e => e.theme === themeId && !e.archived).length;

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar
        title="Themes" subtitle="Built-in presets plus your own custom card themes"
        right={editingId ? null : <Btn primary onClick={startNew} icon="plus">New theme</Btn>}
      />
      <div className="flex-1 overflow-auto py-6 px-8 max-w-[860px] w-full self-center">

        {editingId ? (
          <ThemeEditor
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={cancel}
            isNew={editingId === '__new__'}
          />
        ) : (
          <>
            <Eyebrow>Built-in presets</Eyebrow>
            <ThemeGrid themes={CARD_THEMES} usageCount={usageCount} onEdit={startEditExisting} onDelete={deleteTheme} onDuplicate={duplicateTheme} />

            <div className="mt-10">
              <Eyebrow>Your custom themes</Eyebrow>
              {customThemes.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-fg/10 text-fg-sub text-[12.5px] text-center">
                  No custom themes yet. Click <strong>New theme</strong> above, or duplicate one of the presets to start tweaking.
                </div>
              ) : (
                <ThemeGrid themes={customThemes} usageCount={usageCount} onEdit={startEditExisting} onDelete={deleteTheme} onDuplicate={duplicateTheme} />
              )}
            </div>

            <div className="mt-8 text-[11.5px] text-fg-sub leading-relaxed">
              Built-in presets can be duplicated but not edited or deleted. Deleting a custom theme that's in use will revert affected events to <strong>Paper</strong>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Grid of theme cards ────────────────────────────────────────────────────

function ThemeGrid({
  themes, usageCount, onEdit, onDelete, onDuplicate,
}: {
  themes: CardTheme[];
  usageCount: (id: string) => number;
  onEdit: (t: CardTheme) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => string | null;
}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {themes.map(t => {
        const inUse = usageCount(t.id);
        return (
          <div key={t.id} className="rounded-2xl border-[0.5px] border-fg/10 overflow-hidden bg-surface flex flex-col">
            {/* Live preview */}
            <div
              className="h-[140px] flex items-center justify-center cursor-pointer"
              style={{ background: t.bg, color: t.fg }}
              onClick={() => onEdit(t)}
            >
              <div style={{ transform: 'scale(0.75)' }}>
                <Countdown style="ring" target={SAMPLE_TARGET} accent={t.accent} dark={t.dark} createdAt={SAMPLE_CREATED} />
              </div>
            </div>
            {/* Meta + actions */}
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-fg truncate flex items-center gap-1.5">
                    {t.label}
                    {t.builtin && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-px rounded bg-hover text-fg-sub">preset</span>
                    )}
                  </div>
                  <div className="text-[11px] text-fg-sub">
                    {inUse === 0 ? 'Unused' : `${inUse} event${inUse === 1 ? '' : 's'}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Swatch color={t.bg} title="Background" />
                  <Swatch color={t.fg} title="Text" />
                  <Swatch color={t.accent} title="Accent" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Btn size="sm" onClick={() => onEdit(t)}>
                  {t.builtin ? 'Duplicate & edit' : 'Edit'}
                </Btn>
                {!t.builtin && (
                  <>
                    <button
                      onClick={() => onDuplicate(t.id)}
                      className="h-7 w-7 rounded-md text-fg-mid hover:bg-hover flex items-center justify-center"
                      title="Duplicate"
                    ><Icon name="plus" size={13} /></button>
                    <button
                      onClick={() => {
                        if (inUse > 0 && !confirm(`Delete "${t.label}"? ${inUse} event${inUse === 1 ? '' : 's'} using it will revert to Paper.`)) return;
                        onDelete(t.id);
                      }}
                      className="h-7 w-7 rounded-md text-fg-mid hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"
                      title="Delete"
                    ><Icon name="trash" size={13} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Swatch({ color, title }: { color: string; title: string }) {
  return (
    <span
      className="w-4 h-4 rounded-full border-[0.5px] border-fg/10"
      style={{ background: color }}
      title={`${title}: ${color}`}
    />
  );
}

// ── Theme editor — full color customization with live preview ──────────────

function ThemeEditor({
  draft, setDraft, onSave, onCancel, isNew,
}: {
  draft: Omit<CardTheme, 'id' | 'builtin'>;
  setDraft: (d: Omit<CardTheme, 'id' | 'builtin'>) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1.1fr' }}>
      {/* ── Editor form ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <Field label="Theme name">
          <input
            value={draft.label}
            onChange={e => setDraft({ ...draft, label: e.target.value })}
            placeholder="e.g. Sunrise, Midnight, Forest"
            className="w-full h-9 px-3 rounded-lg border-[0.5px] border-fg/10 bg-surface text-fg text-[14px] font-medium outline-none focus:border-fg/40"
          />
        </Field>

        <Field label="Background color" hint={draft.bg}>
          <SwatchGrid
            value={draft.bg}
            options={PALETTE}
            onChange={bg => setDraft({ ...draft, bg })}
          />
          <ColorTextInput value={draft.bg} onChange={bg => setDraft({ ...draft, bg })} />
        </Field>

        <Field label="Text color" hint={draft.fg}>
          <SwatchGrid
            value={draft.fg}
            options={['#14120f', '#2a2418', '#1f2937', '#0a0a0a', '#ffffff', '#f5f1e8', '#f0e6d4', '#e5e5e5']}
            onChange={fg => setDraft({ ...draft, fg })}
          />
          <ColorTextInput value={draft.fg} onChange={fg => setDraft({ ...draft, fg })} />
        </Field>

        <Field label="Accent color" hint={draft.accent}>
          <SwatchGrid
            value={draft.accent}
            options={ACCENT_PALETTE}
            onChange={accent => setDraft({ ...draft, accent })}
          />
          <ColorTextInput value={draft.accent} onChange={accent => setDraft({ ...draft, accent })} />
        </Field>

        <Field label="Surface tone" hint="Affects how borders and overlays render — set to dark for inky backgrounds.">
          <div className="flex gap-2">
            <button
              onClick={() => setDraft({ ...draft, dark: false })}
              className={`flex-1 h-9 rounded-md text-[12.5px] font-medium border-[0.5px] ${
                !draft.dark ? 'bg-fg text-bg border-transparent' : 'bg-transparent text-fg-mid border-fg/10'
              }`}
            >Light surface</button>
            <button
              onClick={() => setDraft({ ...draft, dark: true })}
              className={`flex-1 h-9 rounded-md text-[12.5px] font-medium border-[0.5px] ${
                draft.dark ? 'bg-fg text-bg border-transparent' : 'bg-transparent text-fg-mid border-fg/10'
              }`}
            >Dark surface</button>
          </div>
        </Field>

        <div className="flex gap-2 mt-2">
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn primary onClick={onSave} icon="check">{isNew ? 'Create theme' : 'Save changes'}</Btn>
        </div>
      </div>

      {/* ── Live preview — what the theme looks like in cards / details / widgets ── */}
      <div className="flex flex-col gap-3">
        <Eyebrow>Live preview</Eyebrow>

        {/* Card preview */}
        <div
          className="rounded-[18px] overflow-hidden p-6 flex flex-col justify-between"
          style={{
            height: 230,
            background: draft.bg,
            color: draft.fg,
            border: `0.5px solid ${draft.dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,18,15,0.06)'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ opacity: 0.55 }}>Preview</span>
          </div>
          <div className="flex items-center justify-start flex-1 pt-3 overflow-hidden">
            <div style={{ transformOrigin: 'left center', transform: 'scale(0.55)' }}>
              <Countdown style="ring" target={SAMPLE_TARGET} accent={draft.accent} dark={draft.dark} createdAt={SAMPLE_CREATED} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[19px] font-semibold tracking-[-0.01em]">A sample event</div>
            <div className="text-[12px] tabular-nums" style={{ opacity: 0.55 }}>Wed, Jun 17, 2026</div>
          </div>
        </div>

        <Eyebrow>Detail view</Eyebrow>
        <div
          className="rounded-[14px] overflow-hidden p-8 flex flex-col items-center gap-4"
          style={{
            minHeight: 200,
            background: draft.bg,
            color: draft.fg,
            border: `0.5px solid ${draft.dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,18,15,0.06)'}`,
          }}
        >
          <div className="text-[22px] font-semibold tracking-[-0.02em]">A sample event</div>
          <div style={{ transform: 'scale(0.7)' }}>
            <Countdown style="large" target={SAMPLE_TARGET} accent={draft.accent} dark={draft.dark} createdAt={SAMPLE_CREATED} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SwatchGrid({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {options.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-md border-[0.5px] border-fg/10"
          style={{
            background: c,
            boxShadow: value.toLowerCase() === c.toLowerCase()
              ? '0 0 0 2px rgb(var(--bg)), 0 0 0 3.5px rgb(var(--fg))'
              : undefined,
          }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function ColorTextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={normalizeHex(value)}
        onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-md border-[0.5px] border-fg/10 bg-transparent cursor-pointer"
        title="Pick any color"
      />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 h-9 px-3 rounded-md border-[0.5px] border-fg/10 bg-surface text-fg text-[12.5px] font-mono outline-none focus:border-fg/40"
      />
    </div>
  );
}

function normalizeHex(c: string): string {
  // <input type="color"> only accepts "#rrggbb". Strip rgb()/named/etc to a safe fallback.
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    const [, r, g, b] = c.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-sub">{label}</span>
        {hint && <span className="text-[10.5px] font-mono text-fg-sub">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-sub mb-3">{children}</div>;
}
