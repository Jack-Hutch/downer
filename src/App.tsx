import { useEffect } from 'react';
import { useStore } from './store/store';
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

  // Apply dark mode + font + accent + animations toggle at root
  useEffect(() => {
    const dark = settings.theme === 'dark'
      || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('no-animations', !settings.animations);
    const fontMap = {
      sans: 'var(--font-sans)', serif: 'var(--font-serif)', mono: 'var(--font-mono)',
    };
    document.documentElement.style.setProperty('font-family', fontMap[settings.font] || fontMap.sans);
    document.documentElement.style.setProperty('--accent', settings.accent);
  }, [settings.theme, settings.font, settings.accent, settings.animations]);

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
        {renderView()}
      </main>
    </div>
  );
}
