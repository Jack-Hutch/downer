import { useState } from 'react';
import { useStore } from '../store/store';
import { TopBar } from '../components/TopBar';
import { EventCard, EventRow } from '../components/EventCard';
import { Btn, Icon } from '../components/primitives';
import type { DownerEvent } from '../types';

export function Dashboard() {
  const {
    events, view, layout, setLayout, sort, setSort, settings, setView, startCreate, categories,
    selectMode, selected, enterSelectMode, exitSelectMode, toggleSelected, selectAll, clearSelected,
    bulkDelete, bulkArchive,
  } = useStore();

  let filtered: DownerEvent[];
  if (view.name === 'archive') filtered = events.filter(e => e.archived);
  else if (view.name === 'pinned') filtered = events.filter(e => e.pinned && !e.archived);
  else if (view.name === 'category') filtered = events.filter(e => e.category === view.category && !e.archived);
  else filtered = events.filter(e => !e.archived);

  if (sort === 'date') filtered = [...filtered].sort((a, b) => a.target - b.target);
  if (sort === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'category') filtered = [...filtered].sort((a, b) => (a.category || '').localeCompare(b.category || ''));

  const titleMap: Record<string, { title: string; sub: string }> = {
    dashboard: { title: 'All countdowns', sub: `${filtered.length} upcoming events` },
    pinned: { title: 'Pinned', sub: 'Your priority countdowns' },
    archive: { title: 'Archive', sub: 'Past events' },
  };
  const t = view.name === 'category'
    ? { title: categories.find(c => c.id === view.category)?.label || 'Category', sub: `${filtered.length} events` }
    : titleMap[view.name] || titleMap.dashboard;

  const overrideStyle = settings.defaultStyle === 'auto' ? null : settings.defaultStyle;
  const filteredIds = filtered.map(e => e.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.includes(id));

  const onCardClick = (id: string) => {
    if (selectMode) toggleSelected(id);
    else setView({ name: 'detail', eventId: id });
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <TopBar
        title={t.title} subtitle={t.sub}
        layout={selectMode ? undefined : layout} setLayout={setLayout}
        sort={selectMode ? undefined : sort} setSort={setSort}
        onCreate={selectMode ? undefined : startCreate}
        right={
          selectMode ? (
            <Btn onClick={exitSelectMode} icon="x">Done</Btn>
          ) : (
            filtered.length > 0 && <Btn onClick={enterSelectMode} icon="check">Select</Btn>
          )
        }
      />

      {selectMode && (
        <SelectionBar
          count={selected.length}
          total={filtered.length}
          allSelected={allSelected}
          onToggleAll={() => allSelected ? clearSelected() : selectAll(filteredIds)}
          onArchive={() => selected.length > 0 && bulkArchive()}
          onDelete={bulkDelete}
          archiveLabel={view.name === 'archive' ? 'Unarchive' : 'Archive'}
        />
      )}

      <div className={`flex-1 overflow-auto ${layout === 'grid' ? 'px-6 pt-5 pb-8' : 'px-6 py-2 pb-8'}`}>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : layout === 'grid' ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map(ev => (
              <SelectableCard
                key={ev.id}
                isSelected={selected.includes(ev.id)}
                selectMode={selectMode}
              >
                <EventCard
                  event={ev} density={settings.density}
                  styleOverride={overrideStyle} categories={categories}
                  onClick={() => onCardClick(ev.id)}
                />
              </SelectableCard>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border-[0.5px] border-fg/10 overflow-hidden">
            {filtered.map((ev, i) => (
              <SelectableRow
                key={ev.id}
                isSelected={selected.includes(ev.id)}
                selectMode={selectMode}
                onToggle={() => toggleSelected(ev.id)}
              >
                <EventRow
                  event={ev}
                  styleOverride={overrideStyle} categories={categories}
                  isFirst={i === 0}
                  onClick={() => onCardClick(ev.id)}
                />
              </SelectableRow>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionBar({
  count, total, allSelected, onToggleAll, onArchive, onDelete, archiveLabel,
}: {
  count: number; total: number; allSelected: boolean;
  onToggleAll: () => void; onArchive: () => void; onDelete: () => void;
  archiveLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-fg/10 bg-fg/[0.04]">
      <button
        onClick={onToggleAll}
        className="flex items-center gap-2 text-[12.5px] font-medium text-fg hover:opacity-70"
      >
        <span
          className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition ${
            allSelected ? 'bg-fg border-fg' : 'border-fg/30'
          }`}
        >
          {allSelected && <Icon name="check" size={11} className="text-bg" strokeWidth={3} />}
        </span>
        {allSelected ? 'Deselect all' : 'Select all'}
      </button>
      <div className="text-[12.5px] text-fg-mid tabular-nums">
        {count} of {total} selected
      </div>
      <div className="flex-1" />
      {!confirming ? (
        <>
          <Btn size="sm" onClick={onArchive} icon="archive" disabled={count === 0}>
            {archiveLabel}
          </Btn>
          <Btn
            size="sm" danger
            onClick={() => setConfirming(true)}
            icon="trash"
            disabled={count === 0}
          >
            Delete{count > 0 ? ` ${count}` : ''}
          </Btn>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-fg">
            Delete {count} event{count === 1 ? '' : 's'}? This cannot be undone.
          </span>
          <Btn size="sm" onClick={() => setConfirming(false)}>Cancel</Btn>
          <Btn size="sm" danger onClick={() => { onDelete(); setConfirming(false); }} icon="trash">
            Delete
          </Btn>
        </div>
      )}
    </div>
  );
}

function SelectableCard({
  children, isSelected, selectMode,
}: { children: React.ReactNode; isSelected: boolean; selectMode: boolean }) {
  return (
    <div
      className={`relative rounded-[18px] transition ${
        selectMode && isSelected ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : ''
      }`}
    >
      {children}
      {selectMode && (
        <div
          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center pointer-events-none transition ${
            isSelected ? 'bg-fg border-fg' : 'bg-bg/70 border-fg/30 backdrop-blur'
          }`}
        >
          {isSelected && <Icon name="check" size={14} className="text-bg" strokeWidth={3} />}
        </div>
      )}
    </div>
  );
}

function SelectableRow({
  children, isSelected, selectMode, onToggle,
}: { children: React.ReactNode; isSelected: boolean; selectMode: boolean; onToggle: () => void }) {
  return (
    <div className={`relative ${selectMode && isSelected ? 'bg-fg/5' : ''}`}>
      {selectMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded border-[1.5px] flex items-center justify-center transition ${
            isSelected ? 'bg-fg border-fg' : 'bg-bg border-fg/30'
          }`}
        >
          {isSelected && <Icon name="check" size={12} className="text-bg" strokeWidth={3} />}
        </button>
      )}
      <div className={selectMode ? 'pl-9' : ''}>{children}</div>
    </div>
  );
}

function EmptyState() {
  const startCreate = useStore(s => s.startCreate);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-fg-mid gap-3.5">
      <div className="w-14 h-14 rounded-[14px] bg-hover flex items-center justify-center">
        <Icon name="cal" size={24} />
      </div>
      <div className="text-[15px] font-semibold text-fg">Nothing here yet</div>
      <div className="text-[12.5px] text-fg-sub text-center max-w-[280px]">
        Create your first countdown to start tracking what matters.
      </div>
      <Btn primary onClick={startCreate} icon="plus">New event</Btn>
    </div>
  );
}
