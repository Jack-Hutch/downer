import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Category, DownerEvent, Settings, ViewState, WidgetConfig, WidgetSize, CountdownStyle,
} from '../types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', label: 'Personal', color: '#d97757' },
  { id: 'work', label: 'Work', color: '#5b8def' },
  { id: 'travel', label: 'Travel', color: '#10b981' },
  { id: 'milestone', label: 'Milestone', color: '#a78bfa' },
  { id: 'birthday', label: 'Birthdays', color: '#ec4899' },
];

const now = Date.now();
const day = 86400000;

const SAMPLE_EVENTS: DownerEvent[] = [
  {
    id: 'finals', name: 'Final Exams', target: now + 47 * day, createdAt: now - 14 * day,
    theme: 'paper', style: 'digital', category: 'work',
  },
  {
    id: 'europe', name: 'Holiday to Europe', target: now + 220 * day, createdAt: now - 5 * day,
    theme: 'sky', style: 'dots', category: 'travel',
  },
  {
    id: 'birthday', name: 'Birthday', target: now + 115 * day, createdAt: now - 30 * day,
    theme: 'rose', style: 'large', category: 'birthday',
  },
  {
    id: 'deadline', name: 'Project Deadline', target: now + 11 * day, createdAt: now - 2 * day,
    theme: 'sand', style: 'ring', category: 'work',
  },
  {
    id: 'newyear', name: 'New Year 2027', target: new Date('2027-01-01T00:00:00').getTime(),
    createdAt: now, theme: 'ink', style: 'flip', category: 'milestone',
  },
];

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  accent: '#d97757',
  density: 'regular',
  font: 'sans',
  defaultStyle: 'auto',
  showSeconds: true,
  daysOnly: false,
  animations: true,
  notify: true,
  reminderWindow: '1d',
  dailySummary: false,
  alwaysOnTop: true,
  menuBar: true,
  launchAtLogin: false,
};

interface State {
  events: DownerEvent[];
  categories: Category[];
  widgets: Record<string, WidgetConfig>;
  settings: Settings;
  view: ViewState;
  layout: 'grid' | 'list';
  sort: 'date' | 'name' | 'category';
  trayOpen: boolean;
  draft: DownerEvent | null;
  selectMode: boolean;
  selected: string[];
  // actions
  setView: (v: ViewState) => void;
  setLayout: (l: 'grid' | 'list') => void;
  setSort: (s: 'date' | 'name' | 'category') => void;
  setSettings: (patch: Partial<Settings>) => void;
  setCategories: (c: Category[]) => void;
  startCreate: () => void;
  startEdit: (id: string) => void;
  updateDraft: (patch: Partial<DownerEvent>) => void;
  saveDraft: () => void;
  cancelDraft: () => void;
  deleteEvent: (id: string) => void;
  archiveEvent: (id: string) => void;
  togglePin: (id: string) => void;
  toggleWidget: (id: string, on: boolean) => void;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  setTrayOpen: (b: boolean) => void;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelected: () => void;
  bulkDelete: () => void;
  bulkArchive: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      events: SAMPLE_EVENTS,
      categories: DEFAULT_CATEGORIES,
      widgets: {},
      settings: DEFAULT_SETTINGS,
      view: { name: 'dashboard' },
      layout: 'grid',
      sort: 'date',
      trayOpen: false,
      draft: null,
      selectMode: false,
      selected: [],

      setView: (v) => set({ view: v }),
      setLayout: (l) => set({ layout: l }),
      setSort: (s) => set({ sort: s }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setCategories: (c) => set({ categories: c }),

      startCreate: () => set({
        view: { name: 'create' },
        draft: {
          id: `ev-${Date.now().toString(36)}`,
          name: '',
          target: Date.now() + 30 * 86400000,
          createdAt: Date.now(),
          theme: 'paper',
          style: 'large',
          category: get().categories[0]?.id ?? '',
          repeat: null,
          widget: false,
        },
      }),
      startEdit: (id) => {
        const ev = get().events.find(e => e.id === id);
        if (!ev) return;
        set({ view: { name: 'edit', eventId: id }, draft: { ...ev } });
      },
      updateDraft: (patch) => set({ draft: get().draft ? { ...get().draft!, ...patch } : null }),
      saveDraft: () => {
        const d = get().draft;
        if (!d || !d.name.trim()) return;
        const exists = get().events.some(e => e.id === d.id);
        const events = exists
          ? get().events.map(e => e.id === d.id ? d : e)
          : [...get().events, d];
        set({ events, draft: null, view: { name: 'dashboard' } });
        // open widget if requested
        if (d.widget && !get().widgets[d.id]) {
          get().toggleWidget(d.id, true);
        }
      },
      cancelDraft: () => set({ draft: null, view: { name: 'dashboard' } }),
      deleteEvent: (id) => {
        const widgets = { ...get().widgets }; delete widgets[id];
        set({
          events: get().events.filter(e => e.id !== id),
          widgets,
          view: { name: 'dashboard' },
        });
        window.downer?.closeWidget(id);
      },
      archiveEvent: (id) => set({
        events: get().events.map(e => e.id === id ? { ...e, archived: !e.archived } : e),
        view: { name: 'dashboard' },
      }),
      togglePin: (id) => set({
        events: get().events.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e),
      }),
      toggleWidget: (id, on) => {
        const widgets = { ...get().widgets };
        if (on) {
          widgets[id] = widgets[id] || { size: 'medium', alwaysOnTop: true };
          set({ widgets });
          window.downer?.openWidget(id, widgets[id].size, widgets[id].alwaysOnTop);
        } else {
          delete widgets[id];
          set({ widgets });
          window.downer?.closeWidget(id);
        }
      },
      updateWidget: (id, patch) => {
        const widgets = { ...get().widgets };
        widgets[id] = { ...(widgets[id] || { size: 'medium', alwaysOnTop: true }), ...patch };
        set({ widgets });
        window.downer?.updateWidget(id, { size: widgets[id].size, alwaysOnTop: widgets[id].alwaysOnTop });
      },
      setTrayOpen: (b) => set({ trayOpen: b }),

      enterSelectMode: () => set({ selectMode: true, selected: [] }),
      exitSelectMode: () => set({ selectMode: false, selected: [] }),
      toggleSelected: (id) => {
        const sel = get().selected;
        set({ selected: sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id] });
      },
      selectAll: (ids) => set({ selected: ids }),
      clearSelected: () => set({ selected: [] }),
      bulkDelete: () => {
        const ids = new Set(get().selected);
        const widgets = { ...get().widgets };
        for (const id of ids) {
          delete widgets[id];
          window.downer?.closeWidget(id);
        }
        set({
          events: get().events.filter(e => !ids.has(e.id)),
          widgets,
          selected: [],
          selectMode: false,
        });
      },
      bulkArchive: () => {
        const ids = new Set(get().selected);
        set({
          events: get().events.map(e => ids.has(e.id) ? { ...e, archived: !e.archived } : e),
          selected: [],
          selectMode: false,
        });
      },
    }),
    {
      name: 'downer-state',
      partialize: (s) => ({
        events: s.events,
        categories: s.categories,
        widgets: s.widgets,
        settings: s.settings,
        layout: s.layout,
        sort: s.sort,
      }),
    }
  )
);
