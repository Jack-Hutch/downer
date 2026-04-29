import { useState } from 'react';
import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { Btn, Icon } from '../components/primitives';

const PALETTE = ['#d97757', '#5b8def', '#10b981', '#a78bfa', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444', '#8b5cf6', '#64748b'];

export function CategoriesView() {
  const { categories, setCategories, events } = useStore();
  const [draft, setDraft] = useState({ label: '', color: PALETTE[0] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ label: '', color: '#d97757' });

  const add = () => {
    const name = draft.label.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36).slice(-4);
    setCategories([...categories, { id, label: name, color: draft.color }]);
    setDraft({ label: '', color: PALETTE[(categories.length + 1) % PALETTE.length] });
  };

  const remove = (id: string) => setCategories(categories.filter(c => c.id !== id));
  const startEdit = (c: { id: string; label: string; color: string }) => {
    setEditingId(c.id); setEditDraft({ label: c.label, color: c.color });
  };
  const saveEdit = () => {
    setCategories(categories.map(c => c.id === editingId ? { ...c, label: editDraft.label.trim() || c.label, color: editDraft.color } : c));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar title="Categories" subtitle="Add, rename, recolor or delete categories" />
      <div className="flex-1 overflow-auto py-6 px-8 max-w-[720px] w-full self-center">
        <div className="p-3.5 rounded-xl bg-surface border-[0.5px] border-fg/10 mb-5 flex items-center gap-2.5">
          <div className="flex gap-1 flex-shrink-0">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setDraft({ ...draft, color: c })}
                className="w-[18px] h-[18px] rounded"
                style={{
                  background: c,
                  boxShadow: draft.color === c
                    ? '0 0 0 2px rgb(var(--bg)), 0 0 0 3px rgb(var(--fg))'
                    : 'inset 0 0 0 0.5px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>
          <input
            value={draft.label}
            onChange={e => setDraft({ ...draft, label: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="New category name…"
            className="flex-1 h-8 px-3 rounded-md border-[0.5px] border-fg/10 bg-bg text-fg text-[13px] outline-none"
          />
          <Btn primary onClick={add} icon="plus">Add</Btn>
        </div>

        <div className="bg-surface rounded-xl border-[0.5px] border-fg/10 overflow-hidden">
          {categories.map((c, i) => {
            const inUse = events.filter(e => e.category === c.id && !e.archived).length;
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgb(var(--fg) / 0.08)' }}>
                {isEditing ? (
                  <>
                    <div className="flex gap-1 flex-shrink-0">
                      {PALETTE.map(col => (
                        <button
                          key={col}
                          onClick={() => setEditDraft({ ...editDraft, color: col })}
                          className="w-4 h-4 rounded"
                          style={{
                            background: col,
                            boxShadow: editDraft.color === col
                              ? '0 0 0 1.5px rgb(var(--bg)), 0 0 0 2.5px rgb(var(--fg))'
                              : 'inset 0 0 0 0.5px rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <input
                      value={editDraft.label} autoFocus
                      onChange={e => setEditDraft({ ...editDraft, label: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 h-7 px-2.5 rounded border-[0.5px] border-fg/10 bg-bg text-fg text-[13px] outline-none"
                    />
                    <Btn size="sm" onClick={() => setEditingId(null)}>Cancel</Btn>
                    <Btn primary size="sm" onClick={saveEdit} icon="check">Save</Btn>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: c.color }} />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-fg">{c.label}</div>
                      <div className="text-[11.5px] text-fg-sub mt-0.5">
                        {inUse === 0 ? 'No events' : `${inUse} event${inUse === 1 ? '' : 's'}`}
                      </div>
                    </div>
                    <button onClick={() => startEdit(c)} className="w-7 h-7 rounded text-fg-mid hover:bg-hover flex items-center justify-center">
                      <Icon name="edit" size={13} />
                    </button>
                    <button onClick={() => remove(c.id)} className="w-7 h-7 rounded text-fg-mid hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center">
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="p-8 text-center text-fg-sub text-[12.5px]">
              No categories yet. Add one above to organize your countdowns.
            </div>
          )}
        </div>

        <div className="mt-3.5 text-[11.5px] text-fg-sub leading-relaxed">
          Removing a category leaves its events uncategorized — they won't be deleted.
        </div>
      </div>
    </div>
  );
}
