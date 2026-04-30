import { useEffect } from 'react';
import { useStore } from './store/store';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { DetailView } from './views/DetailView';
import { CreateEditView } from './views/CreateEditView';
import { SettingsView } from './views/SettingsView';
import { CategoriesView } from './views/CategoriesView';
import { WidgetsView } from './views/WidgetsView';
import { WINDOW_PRESETS } from './types';

export default function App() {
  const { view, settings } = useStore();

  // Apply dark mode + font + accent at root
  useEffect(() => {
    const dark = settings.theme === 'dark'
      || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    const fontMap = {
      sans: 'var(--font-sans)', serif: 'var(--font-serif)', mono: 'var(--font-mono)',
    };
    document.documentElement.style.setProperty('font-family', fontMap[settings.font] || fontMap.sans);
    document.documentElement.style.setProperty('--accent', settings.accent);
  }, [settings.theme, settings.font, settings.accent]);

  // Broadcast store snapshot to widget windows whenever it changes
  useEffect(() => {
    const send = () => {
      const s = useStore.getState();
      window.downer?.broadcastStore({
        events: s.events, categories: s.categories, widgets: s.widgets, settings: s.settings,
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

  // Restore the saved main-window size on app start (one-shot).
  useEffect(() => {
    const s = useStore.getState().settings;
    const dims = s.windowSize === 'custom' ? s.customWindowSize : WINDOW_PRESETS[s.windowSize];
    window.downer?.setWindowSize(dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderView = () => {
    switch (view.name) {
      case 'detail': return <DetailView eventId={view.eventId} />;
      case 'create': return <CreateEditView isEdit={false} />;
      case 'edit': return <CreateEditView isEdit={true} />;
      case 'settings': return <SettingsView />;
      case 'categories': return <CategoriesView />;
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
