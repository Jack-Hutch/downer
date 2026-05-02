import { useEffect, Component, ReactNode } from 'react';
import { useStore } from './store/store';

// ── Error boundary — prevents a single-view crash from blanking the whole app ─
class ViewErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
          <div className="text-[15px] font-semibold text-fg">Something went wrong</div>
          <div className="text-[12px] text-fg-sub max-w-sm">
            {this.state.error.message}
          </div>
          <button
            onClick={() => {
              this.setState({ error: null });
              useStore.getState().setView({ name: 'dashboard' });
            }}
            className="h-8 px-4 rounded-lg bg-fg text-bg text-[12.5px] font-medium"
          >
            Back to dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { DetailView } from './views/DetailView';
import { CreateEditView } from './views/CreateEditView';
import { SettingsView } from './views/SettingsView';
import { CategoriesView } from './views/CategoriesView';
import { ThemesView } from './views/ThemesView';
import { WidgetsView } from './views/WidgetsView';
import { WINDOW_PRESETS } from './types';
import { applyFormatSettings } from './lib/format';
import { useNotificationScheduler } from './lib/notifications';

export default function App() {
  const { view, settings } = useStore();

  // Apply theme tokens, font, accent, density, animations to <html> at runtime.
  // Everything below cascades into the rest of the app via CSS variables.
  useEffect(() => {
    const root = document.documentElement;

    // Dark mode
    const dark = settings.theme === 'dark'
      || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);

    // Animations
    root.classList.toggle('no-animations', !settings.animations);

    // Density — drives a data attribute that index.css uses to vary spacing.
    root.setAttribute('data-density', settings.density);

    // Font — settings.font is either a preset key ('sans' | 'serif' | 'mono')
    // or a literal CSS font stack chosen from the rich picker. We map the
    // preset keys to the matching --font-* variable, otherwise we use the
    // string as-is. The result is written to `--app-font` (used by html/body).
    const fontStack = (() => {
      if (settings.font === 'sans')  return 'var(--font-sans)';
      if (settings.font === 'serif') return 'var(--font-serif)';
      if (settings.font === 'mono')  return 'var(--font-mono)';
      return settings.font; // free-form font stack from the picker
    })();
    root.style.setProperty('--app-font', fontStack);

    // Accent — written to --accent so any UI element that references it
    // (primary buttons, toggle "on" color, segment-selected highlights, etc.)
    // updates instantly when the user changes their accent.
    root.style.setProperty('--accent', settings.accent);
  }, [settings.theme, settings.font, settings.accent, settings.animations, settings.density]);

  // Push date/time format prefs into the standalone fmt helpers.
  useEffect(() => {
    applyFormatSettings({ dateFormat: settings.dateFormat, timeFormat: settings.timeFormat });
  }, [settings.dateFormat, settings.timeFormat]);

  // Run the notification scheduler — fires native notifications at the user's
  // chosen reminder window, optional daily summary at 9am.
  useNotificationScheduler();

  // Broadcast store snapshot to widget windows whenever it changes
  useEffect(() => {
    const send = () => {
      const s = useStore.getState();
      window.downer?.broadcastStore({
        events: s.events,
        categories: s.categories,
        customThemes: s.customThemes,
        widgets: s.widgets,
        settings: s.settings,
      });
    };
    send();
    const unsub = useStore.subscribe(send);
    return unsub;
  }, []);

  // Listen for widget-closed from main process
  useEffect(() => {
    window.downer?.onWidgetClosed((id) => {
      const widgets = { ...useStore.getState().widgets };
      delete widgets[id];
      useStore.setState({ widgets });
    });
  }, []);

  // Persist widget position whenever the user moves one, so it reopens in the
  // same spot on next launch.
  useEffect(() => {
    window.downer?.onWidgetMoved((id, x, y) => {
      const widgets = { ...useStore.getState().widgets };
      if (!widgets[id]) return;
      widgets[id] = { ...widgets[id], x, y };
      useStore.setState({ widgets });
    });
  }, []);

  // Restore the saved main-window size on app start (one-shot).
  useEffect(() => {
    const s = useStore.getState().settings;
    const dims = s.windowSize === 'custom' ? s.customWindowSize : WINDOW_PRESETS[s.windowSize];
    window.downer?.setWindowSize(dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reopen all persisted widget windows on app launch, restoring saved positions.
  useEffect(() => {
    const { widgets } = useStore.getState();
    for (const [eventId, cfg] of Object.entries(widgets)) {
      window.downer?.openWidget(eventId, cfg.size, cfg.mode, cfg.x, cfg.y);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderView = () => {
    switch (view.name) {
      case 'detail': return <DetailView eventId={view.eventId} />;
      case 'create': return <CreateEditView isEdit={false} />;
      case 'edit': return <CreateEditView isEdit={true} />;
      case 'settings': return <SettingsView />;
      case 'categories': return <CategoriesView />;
      case 'themes': return <ThemesView />;
      case 'widgets': return <WidgetsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-fg">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <ViewErrorBoundary key={view.name}>
          {renderView()}
        </ViewErrorBoundary>
      </main>
    </div>
  );
}
