import type { ReactElement } from 'react';
import type { Tab } from '../types';
import { ExportIcon, GridIcon, SlidersIcon } from './icons';

interface SideRailProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

const items: { tab: Tab; label: string; icon: (props: { size?: number }) => ReactElement }[] = [
  { tab: 'editor', label: 'EDITOR', icon: GridIcon },
  { tab: 'config', label: 'ROBOT', icon: SlidersIcon },
  { tab: 'export', label: 'EXPORT', icon: ExportIcon },
];

export function SideRail({ tab, onChange }: SideRailProps) {
  return (
    <div className="rail">
      {items.map(({ tab: t, label, icon: Icon }) => (
        <button key={t} className={`rail-btn${tab === t ? ' active' : ''}`} onClick={() => onChange(t)}>
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}
