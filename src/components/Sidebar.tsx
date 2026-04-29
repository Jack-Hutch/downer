import { useStore } from '../store/store';
import { Icon } from './primitives';

export function Sidebar() {
  const { view, setView, events, categories, settings, setSettings } = useStore();
  const upcoming = events.filter(e => e.target > Date.now() && !e.archived).length;
  const archived = events.filter(e => e.archived).length;
  const pinned = events.filter(e => e.pinned && !e.archived).length;
  const dark = settings.theme === 'dark';

  const NavItem = ({ id, icon, label, count, active }: any) => (
    <div
      onClick={() => setView({ name: id })}
      className={`flex items-center gap-2.5 h-[30px] px-2.5 mx-2 rounded-md cursor-pointer text-[12.5px] transition-colors ${
        active ? 'bg-selected text-fg font-semibold' : 'text-fg-mid hover:bg-hover font-medium'
      }`}
    >
      <Icon name={icon} size={14} />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-[11px] text-fg-sub tabular-nums">{count}</span>}
    </div>
  );

  return (
    <aside className="w-[220px] h-full flex-shrink-0 flex flex-col border-r border-fg/10 bg-fg/[0.015]">
      <div className="h-[38px] titlebar-drag" />

      <div className="px-[18px] pt-1.5 pb-3.5 flex items-center gap-2.5 no-drag">
        <div className="w-[22px] h-[22px] rounded-md bg-fg text-bg flex items-center justify-center font-mono font-semibold text-[11px]">D</div>
        <div className="text-[13.5px] font-semibold tracking-[-0.01em]">Downer</div>
      </div>

      <SectionLabel>Library</SectionLabel>
      <NavItem id="dashboard" icon="home" label="All countdowns" count={upcoming} active={view.name === 'dashboard'} />
      <NavItem id="pinned" icon="pin" label="Pinned" count={pinned} active={view.name === 'pinned'} />
      <NavItem id="archive" icon="archive" label="Archive" count={archived} active={view.name === 'archive'} />

      <SectionLabel>Categories</SectionLabel>
      {categories.map(c => {
        const n = events.filter(e => e.category === c.id && !e.archived).length;
        const active = view.name === 'category' && view.category === c.id;
        return (
          <div
            key={c.id}
            onClick={() => setView({ name: 'category', category: c.id })}
            className={`flex items-center gap-2.5 h-7 px-2.5 mx-2 rounded-md cursor-pointer text-[12px] transition-colors ${
              active ? 'bg-selected text-fg' : 'text-fg-mid hover:bg-hover'
            }`}
          >
            <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
            <span className="flex-1">{c.label}</span>
            <span className="text-[11px] text-fg-sub">{n}</span>
          </div>
        );
      })}
      <div
        onClick={() => setView({ name: 'categories' })}
        className={`flex items-center gap-2 h-[26px] px-2.5 mx-2 mt-1 rounded-md cursor-pointer text-[11.5px] transition-colors ${
          view.name === 'categories' ? 'bg-selected text-fg' : 'text-fg-sub hover:bg-hover'
        }`}
      >
        <Icon name="edit" size={11} />
        <span>Edit categories</span>
      </div>

      <div className="flex-1" />

      <div className="py-1.5 border-t border-fg/10">
        <NavItem id="widgets" icon="widget" label="Widgets" active={view.name === 'widgets'} />
        <NavItem id="settings" icon="settings" label="Settings" active={view.name === 'settings'} />
        <div
          onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}
          className="flex items-center gap-2.5 h-[30px] px-2.5 mx-2 rounded-md cursor-pointer text-[12.5px] text-fg-mid hover:bg-hover font-medium transition-colors"
        >
          <Icon name={dark ? 'sun' : 'moon'} size={14} />
          <span className="flex-1">{dark ? 'Light mode' : 'Dark mode'}</span>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-[18px] pt-3.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-sub">
      {children}
    </div>
  );
}
