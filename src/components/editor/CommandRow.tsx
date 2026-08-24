import { fmtDist, stepDuration } from '../../lib/pathSim';
import type { Command, Units } from '../../types';
import { DriveIcon, TrashIcon, TurnIcon } from '../icons';

interface CommandRowProps {
  cmd: Command;
  idx: number;
  isCurrent: boolean;
  isDone: boolean;
  units: Units;
  onGoTo: () => void;
  onToggleDir: () => void;
  onDelete: () => void;
  onChangeValue: (raw: number) => void;
  onChangeNote: (note: string) => void;
  onChangeSpeed: (raw: number) => void;
}

export function CommandRow({ cmd, idx, isCurrent, isDone, units, onGoTo, onToggleDir, onDelete, onChangeValue, onChangeNote, onChangeSpeed }: CommandRowProps) {
  const isTurn = cmd.action === 'turn';
  const actionLabel = isTurn ? 'TURN' : 'DRIVE';
  const dirLabel = isTurn ? (cmd.dir === 'left' ? 'LEFT' : 'RIGHT') : cmd.dir === 'forward' ? 'FORWARD' : 'REVERSE';
  const valueDisplay = isTurn ? cmd.value.toFixed(0) : fmtDist(cmd.value, units);
  const unit = isTurn ? '°' : units;
  const estSec = (stepDuration(cmd) / 1000).toFixed(1);

  return (
    <div className={`command-row${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}`}>
      <div className="command-row-top">
        <button className="command-row-step" onClick={onGoTo}>{idx + 1}</button>
        <span className="command-row-icon">{isTurn ? <TurnIcon /> : <DriveIcon />}</span>
        <span className="command-row-label">{actionLabel}</span>
        <span className="tag tag-neutral" style={{ fontSize: 10, padding: '2px 6px' }} title="Estimated time">
          {estSec}s
        </span>
        <button onClick={onToggleDir} className="btn btn-secondary" style={{ fontSize: 10, padding: '3px 8px' }}>
          {dirLabel}
        </button>
        <button onClick={onDelete} className="command-row-delete" title="Delete step">
          <TrashIcon />
        </button>
      </div>
      <div className="command-row-mid">
        <input
          type="number"
          className="input command-row-value"
          defaultValue={valueDisplay}
          key={`value-${valueDisplay}`}
          onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChangeValue(v); }}
        />
        <span className="text-muted command-row-unit">{unit}</span>
        <input
          className="input command-row-note"
          placeholder="note (optional)"
          defaultValue={cmd.note}
          key={`note-${cmd.note}`}
          onBlur={(e) => onChangeNote(e.target.value)}
        />
      </div>
      <div className="command-row-bottom">
        <span className="text-muted command-row-speed-label">{isTurn ? 'MAX ROTATE (0–127)' : 'MAX DRIVE (0–127)'}</span>
        <input
          type="range"
          min={0}
          max={127}
          step={1}
          value={cmd.speed}
          onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
          className="command-row-speed"
        />
        <span className="command-row-speed-value">{cmd.speed}</span>
      </div>
    </div>
  );
}
