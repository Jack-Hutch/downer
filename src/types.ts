export type CountdownStyle = 'large' | 'digital' | 'ring' | 'dots' | 'flip';
/** Theme IDs are now free-form strings — built-ins use the legacy keys
 *  (paper, sand, sage, …) and user-created themes use generated IDs. */
export type CardThemeId = string;
export type Repeat = null | 'yearly' | 'monthly' | 'weekly';
export type WidgetSize = 'small' | 'medium' | 'large';

export interface Category { id: string; label: string; color: string; }

export interface CardTheme {
  id: string;
  label: string;
  /** Card / widget background. */
  bg: string;
  /** Foreground text color. Should contrast with bg. */
  fg: string;
  /** Accent used by countdowns (rings, digits, dot grids…). */
  accent: string;
  /** True for the macOS-style "dark" presets (Ink, Cocoa). Affects
   *  border / overlay colors so they read on a dark surface. */
  dark?: boolean;
  /** Built-in presets are read-only — can't be edited or deleted. */
  builtin?: boolean;
}

export interface DownerEvent {
  id: string;
  name: string;
  target: number; // unix ms
  createdAt: number;
  theme: CardThemeId;
  style: CountdownStyle;
  category: string;
  archived?: boolean;
  pinned?: boolean;
  repeat?: Repeat;
  widget?: boolean;
}

export type WidgetMode = 'float' | 'desktop';

export interface WidgetConfig {
  size: WidgetSize;
  mode: WidgetMode;
  /** Last known screen position — persisted so widgets reopen where the user left them. */
  x?: number;
  y?: number;
  /** @deprecated kept for migration from earlier versions; replaced by `mode`. */
  alwaysOnTop?: boolean;
  style?: CountdownStyle;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  accent: string;
  density: 'compact' | 'regular' | 'comfy';
  /** Either a legacy preset key ('sans' | 'serif' | 'mono') or a font id from
   *  FONT_OPTIONS in components/FontPicker.tsx. */
  font: string;
  defaultStyle: 'auto' | CountdownStyle;
  showSeconds: boolean;
  daysOnly: boolean;
  animations: boolean;
  notify: boolean;
  reminderWindow: '1h' | '1d' | '1w';
  dailySummary: boolean;
  notificationSound: boolean;
  alwaysOnTop: boolean;
  menuBar: boolean;
  launchAtLogin: boolean;
  windowSize: 'small' | 'medium' | 'large' | 'custom';
  customWindowSize: { width: number; height: number };
  dateFormat: 'us' | 'eu' | 'iso';
  timeFormat: '12h' | '24h';
  weekStart: 'sun' | 'mon';
}

export const WINDOW_PRESETS = {
  small:  { width: 1024, height: 700 },
  medium: { width: 1280, height: 820 },
  large:  { width: 1600, height: 1000 },
} as const;

export type ViewState =
  | { name: 'dashboard' }
  | { name: 'pinned' }
  | { name: 'archive' }
  | { name: 'category'; category: string }
  | { name: 'categories' }
  | { name: 'widgets' }
  | { name: 'settings' }
  | { name: 'themes' }
  | { name: 'detail'; eventId: string }
  | { name: 'create' }
  | { name: 'edit'; eventId: string };

declare global {
  interface Window {
    downer?: {
      openWidget: (id: string, size: WidgetSize, mode: WidgetMode, x?: number, y?: number) => Promise<void>;
      closeWidget: (id: string) => Promise<void>;
      updateWidget: (id: string, payload: { size?: WidgetSize; mode?: WidgetMode }) => Promise<void>;
      setWindowSize: (payload: { width: number; height: number }) => Promise<void>;
      setLaunchAtLogin: (enabled: boolean) => Promise<void>;
      showNotification: (payload: { title: string; body: string; silent?: boolean }) => Promise<void>;
      checkForUpdates?: () => Promise<unknown>;
      downloadUpdate?:  () => Promise<unknown>;
      installUpdate?:   () => void;
      onUpdateAvailable?:  (cb: (info: any) => void) => void;
      onUpdateUpToDate?:   (cb: () => void) => void;
      onUpdateProgress?:   (cb: (pct: number) => void) => void;
      onUpdateDownloaded?: (cb: (info: any) => void) => void;
      onUpdaterError?:     (cb: (msg: string) => void) => void;
      broadcastStore: (snapshot: unknown) => void;
      onStoreSnapshot: (cb: (s: any) => void) => void;
      notifyWidgetReady: () => void;
      onWidgetClosed: (cb: (id: string) => void) => void;
      onWidgetMoved: (cb: (id: string, x: number, y: number) => void) => void;
      setIgnoreMouseEvents: (ignore: boolean) => void;
    };
  }
}
