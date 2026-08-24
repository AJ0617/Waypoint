import { MoonIcon, RedoIcon, SunIcon, UndoIcon } from './icons';

interface TopNavProps {
  pathName: string;
  teamNumber: string;
  darkMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onPathNameChange: (value: string) => void;
  onTeamNumberChange: (value: string) => void;
  onToggleDark: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopNav({ pathName, teamNumber, darkMode, canUndo, canRedo, onPathNameChange, onTeamNumberChange, onToggleDark, onUndo, onRedo }: TopNavProps) {
  return (
    <div className="nav" style={{ background: 'var(--color-bg)', padding: '14px 24px', flex: 'none' }}>
      <span className="nav-brand" style={{ letterSpacing: '-0.02em' }}>
        WAYPOINT
      </span>
      <div className="app-nav-divider" />
      <input
        className="input app-nav-input-name"
        defaultValue={pathName}
        placeholder="Auto Name"
        onBlur={(e) => onPathNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        key={`name-${pathName}`}
      />
      <input
        className="input app-nav-input-team"
        defaultValue={teamNumber}
        placeholder="Team Number"
        onBlur={(e) => onTeamNumberChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        key={`team-${teamNumber}`}
      />
      <div className="app-nav-spacer">
        <button className="btn btn-secondary btn-icon" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <UndoIcon />
        </button>
        <button className="btn btn-secondary btn-icon" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <RedoIcon />
        </button>
        <button className="btn btn-secondary btn-icon" onClick={onToggleDark} title="Toggle dark mode">
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  );
}
