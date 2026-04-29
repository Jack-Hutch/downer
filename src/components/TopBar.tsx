import { ReactNode } from 'react';
import { Btn, Icon } from './primitives';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  layout?: 'grid' | 'list';
  setLayout?: (l: 'grid' | 'list') => void;
  sort?: 'date' | 'name' | 'category';
  setSort?: (s: 'date' | 'name' | 'category') => void;
  onCreate?: () => void;
  draggable?: boolean;
}

export function TopBar({ title, subtitle, right, layout, setLayout, sort, setSort, onCreate, draggable = true }: Props) {
  return (
    <div className={`flex items-center gap-3 px-6 py-3.5 border-b border-fg/10 flex-shrink-0 ${draggable ? 'titlebar-drag' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="text-[18px] font-semibold tracking-[-0.015em] text-fg truncate">{title}</div>
        {subtitle && <div className="text-[12px] text-fg-sub mt-0.5 truncate">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2 no-drag">
        {right}
        {sort != null && setSort && (
          <button
            onClick={() => setSort(sort === 'date' ? 'name' : sort === 'name' ? 'category' : 'date')}
            className="h-[30px] flex items-center gap-1.5 px-2.5 rounded-md bg-hover text-fg-mid text-[12px]"
          >
            <Icon name="sort" size={13} />
            {sort === 'date' ? 'Closest first' : sort === 'name' ? 'A → Z' : 'By category'}
          </button>
        )}
        {layout != null && setLayout && (
          <div className="flex p-0.5 bg-hover rounded-md">
            {(['grid', 'list'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`w-7 h-[26px] rounded flex items-center justify-center transition ${
                  layout === l ? 'bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-fg-sub'
                }`}
              >
                <Icon name={l} size={13} />
              </button>
            ))}
          </div>
        )}
        {onCreate && <Btn primary onClick={onCreate} icon="plus">New event</Btn>}
      </div>
    </div>
  );
}
