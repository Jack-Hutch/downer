import { useEffect, useState } from 'react';
import { Btn } from './primitives';
import { APP_VERSION } from '../lib/version';

type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version?: string }
  | { kind: 'downloading'; pct: number }
  | { kind: 'ready'; version?: string }
  | { kind: 'error'; message: string };

/**
 * Auto-update UI — wraps the electron-updater IPC channels exposed by the
 * preload (`checkForUpdates`, `downloadUpdate`, `installUpdate`, plus the
 * `onUpdate*` event subscribers).
 *
 * Important: when the app isn't code-signed by Apple, electron-updater can't
 * verify downloaded updates and will fail with a signature error. We catch
 * that case and fall through to a "Open download page" link so the user can
 * grab the latest .dmg manually instead of being stuck.
 */
export function UpdateCheck() {
  const [state, setState] = useState<UpdateState>({ kind: 'idle' });

  useEffect(() => {
    const d = window.downer;
    if (!d) return;
    d.onUpdateAvailable?.((info: any) => setState({ kind: 'available', version: info?.version }));
    d.onUpdateUpToDate?.(() => setState({ kind: 'up-to-date' }));
    d.onUpdateProgress?.((pct: number) => setState({ kind: 'downloading', pct }));
    d.onUpdateDownloaded?.((info: any) => setState({ kind: 'ready', version: info?.version }));
    d.onUpdaterError?.((msg: string) => setState({ kind: 'error', message: msg }));
  }, []);

  const check = async () => {
    setState({ kind: 'checking' });
    try {
      await window.downer?.checkForUpdates?.();
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    }
  };

  const download = async () => {
    setState({ kind: 'downloading', pct: 0 });
    try {
      await window.downer?.downloadUpdate?.();
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message });
    }
  };

  const install = () => window.downer?.installUpdate?.();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 py-3 border-b-[0.5px] border-fg/10">
        <div className="flex-1">
          <div className="text-[12.5px] font-medium text-fg">Current version</div>
          <div className="text-[11.5px] text-fg-sub mt-0.5 font-mono tabular-nums">v{APP_VERSION}</div>
        </div>
        <Btn size="sm" onClick={check} disabled={state.kind === 'checking' || state.kind === 'downloading'}>
          {state.kind === 'checking' ? 'Checking…' : 'Check for updates'}
        </Btn>
      </div>

      {state.kind !== 'idle' && (
        <div
          className="rounded-xl px-4 py-3 text-[12.5px] flex items-center gap-3"
          style={{
            background: state.kind === 'error' ? 'rgba(220, 38, 38, 0.08)'
                      : state.kind === 'available' || state.kind === 'ready' ? 'rgb(var(--fg) / 0.04)'
                      : 'rgb(var(--fg) / 0.03)',
            border: `0.5px solid ${state.kind === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'rgb(var(--fg) / 0.08)'}`,
          }}
        >
          <Status state={state} />
          <div className="flex-1" />
          {state.kind === 'available' && <Btn size="sm" primary onClick={download}>Download</Btn>}
          {state.kind === 'ready' && <Btn size="sm" primary onClick={install}>Restart &amp; install</Btn>}
          {state.kind === 'error' && (
            <a
              href="https://downer.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium underline text-fg"
            >Download manually</a>
          )}
        </div>
      )}

      <div className="text-[11.5px] text-fg-sub leading-relaxed mt-1">
        Auto-update only works on properly signed builds. If you see a signature error,
        download the latest version from the website manually — your data carries over.
      </div>
    </div>
  );
}

function Status({ state }: { state: UpdateState }) {
  switch (state.kind) {
    case 'checking':
      return <span className="text-fg">Checking GitHub Releases for a newer version…</span>;
    case 'up-to-date':
      return <span className="text-fg">You're on the latest version.</span>;
    case 'available':
      return <span className="text-fg">Update available{state.version ? <> — <span className="font-mono">v{state.version}</span></> : ''}</span>;
    case 'downloading':
      return <span className="text-fg">Downloading… <span className="font-mono tabular-nums">{Math.round(state.pct)}%</span></span>;
    case 'ready':
      return <span className="text-fg">Ready to install{state.version ? <> — <span className="font-mono">v{state.version}</span></> : ''}. Restart Downer to apply.</span>;
    case 'error':
      return <span className="text-red-500">Update failed: {state.message}</span>;
    default:
      return null;
  }
}
