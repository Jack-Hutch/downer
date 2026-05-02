import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Btn } from '../components/primitives';
import { useResolvedThemes, useTheme, COUNTDOWN_STYLES } from '../lib/themes';
import { EventCard } from '../components/EventCard';
import { Countdown } from '../countdowns/Countdown';
import { fmtDateTime, toDateInput, toTimeInput, setDatePart, setTimePart } from '../lib/format';

export function CreateEditView({ isEdit }: { isEdit: boolean }) {
  const { draft, updateDraft, saveDraft, cancelDraft, categories } = useStore();
  if (!draft) return null;
  const ct = useTheme(draft.theme);
  const themes = useResolvedThemes();

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar
        title={isEdit ? 'Edit event' : 'New event'}
        subtitle={isEdit ? 'Update details and preview live' : 'Fill in details to create a countdown'}
        right={
          <>
            <Btn onClick={cancelDraft}>Cancel</Btn>
            <Btn primary onClick={saveDraft} icon="check">{isEdit ? 'Save changes' : 'Create event'}</Btn>
          </>
        }
      />

      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '1fr 1.1fr' }}>
        <div className="overflow-auto px-6 py-5 pb-8 border-r border-fg/10">
          <Field label="Event name">
            <input
              value={draft.name}
              onChange={e => updateDraft({ name: e.target.value })}
              placeholder="Untitled event"
              className="w-full h-[38px] px-3 rounded-lg border-[0.5px] border-fg/10 bg-surface text-fg text-[16px] font-semibold outline-none focus:border-fg/30"
            />
          </Field>

          <div className="grid gap-2.5" style={{ gridTemplateColumns: '1fr 110px' }}>
            <Field label="Date">
              <input
                type="date" value={toDateInput(draft.target)}
                onChange={e => updateDraft({ target: setDatePart(draft.target, e.target.value) })}
                className="w-full h-[34px] px-3 rounded-lg border-[0.5px] border-fg/10 bg-surface text-fg text-[13px] outline-none"
              />
            </Field>
            <Field label="Time">
              <input
                type="time" value={toTimeInput(draft.target)}
                onChange={e => updateDraft({ target: setTimePart(draft.target, e.target.value) })}
                className="w-full h-[34px] px-3 rounded-lg border-[0.5px] border-fg/10 bg-surface text-fg text-[13px] outline-none"
              />
            </Field>
          </div>

          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const sel = draft.category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => updateDraft({ category: c.id })}
                    className="h-[30px] px-3 rounded-full text-[12px] font-medium border-[0.5px] inline-flex items-center gap-1.5 transition"
                    style={{
                      borderColor: sel ? c.color : 'rgb(var(--fg) / 0.1)',
                      background: sel ? `${c.color}1f` : 'transparent',
                      color: sel ? c.color : 'rgb(var(--fg) / 0.6)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Repeat">
            <div className="flex gap-1.5">
              {[
                { v: null, l: 'Never' }, { v: 'yearly', l: 'Yearly' },
                { v: 'monthly', l: 'Monthly' }, { v: 'weekly', l: 'Weekly' },
              ].map(o => {
                const sel = draft.repeat === o.v;
                return (
                  <button
                    key={o.l}
                    onClick={() => updateDraft({ repeat: o.v as any })}
                    className={`flex-1 h-[30px] rounded-md text-[12px] font-medium border-[0.5px] transition ${
                      sel ? 'bg-fg text-bg border-transparent' : 'bg-transparent text-fg-mid border-fg/10'
                    }`}
                  >{o.l}</button>
                );
              })}
            </div>
          </Field>

          <Field label="Card theme">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {themes.map(t => {
                const sel = draft.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateDraft({ theme: t.id })}
                    className="h-14 rounded-lg relative overflow-hidden transition"
                    style={{
                      border: `1.5px solid ${sel ? 'rgb(var(--fg))' : 'transparent'}`,
                      background: t.bg,
                      boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.05)',
                    }}
                  >
                    <span className="absolute left-2 bottom-1.5 text-[10px] font-semibold" style={{ color: t.fg, opacity: 0.7 }}>{t.label}</span>
                    <span className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Countdown style">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {COUNTDOWN_STYLES.map(s => {
                const sel = draft.style === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => updateDraft({ style: s.value })}
                    className="h-14 rounded-md text-[11px] font-medium flex flex-col items-center justify-center gap-1 p-1 transition"
                    style={{
                      border: `1.5px solid ${sel ? 'rgb(var(--fg))' : 'rgb(var(--fg) / 0.1)'}`,
                      background: sel ? 'rgb(var(--fg) / 0.04)' : 'transparent',
                    }}
                  >
                    <span className="text-fg-mid uppercase tracking-wider text-[9px]">{s.value}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Show as widget">
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-hover cursor-pointer">
              <input
                type="checkbox" checked={!!draft.widget}
                onChange={e => updateDraft({ widget: e.target.checked })}
                className="w-3.5 h-3.5 accent-fg"
              />
              <span className="text-[12.5px] text-fg">Pin a floating widget for this event</span>
            </label>
          </Field>
        </div>

        <div className="overflow-auto px-6 py-5 pb-8 bg-bg">
          <Eyebrow>Live preview</Eyebrow>
          <EventCard event={{ ...draft, id: 'preview' }} categories={categories} />
          <div className="mt-6"><Eyebrow>Detail view</Eyebrow></div>
          <div
            className="rounded-[14px] overflow-hidden border-[0.5px] border-fg/10 p-8 flex flex-col items-center gap-4 min-h-[240px]"
            style={{ background: ct.bg, color: ct.fg }}
          >
            <div className="text-[22px] font-semibold tracking-[-0.02em]">{draft.name || 'Untitled'}</div>
            <Countdown style={draft.style} target={draft.target} accent={ct.accent} dark={ct.dark} createdAt={Date.now()} />
            <div className="text-[11.5px]" style={{ opacity: 0.55 }}>{fmtDateTime(new Date(draft.target))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-sub mb-2">{label}</div>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-sub mb-3">{children}</div>;
}
