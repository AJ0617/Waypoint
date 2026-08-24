import type { Command, Pose, Units } from '../../types';
import { CommandRow } from './CommandRow';
import { StartingPoseSection } from './StartingPoseSection';

interface CommandListProps {
  commands: Command[];
  currentStep: number;
  units: Units;
  startPose: Pose;
  onSetStartX: (v: number) => void;
  onSetStartY: (v: number) => void;
  onSetStartHeading: (v: number) => void;
  onGoTo: (idx: number) => void;
  onToggleDir: (idx: number) => void;
  onDelete: (idx: number) => void;
  onChangeValue: (idx: number, raw: number) => void;
  onChangeNote: (idx: number, note: string) => void;
  onChangeSpeed: (idx: number, raw: number) => void;
  onAddDrive: () => void;
  onAddTurn: () => void;
}

export function CommandList({
  commands,
  currentStep,
  units,
  startPose,
  onSetStartX,
  onSetStartY,
  onSetStartHeading,
  onGoTo,
  onToggleDir,
  onDelete,
  onChangeValue,
  onChangeNote,
  onChangeSpeed,
  onAddDrive,
  onAddTurn,
}: CommandListProps) {
  return (
    <div className="sequence-panel">
      <StartingPoseSection startPose={startPose} units={units} onSetX={onSetStartX} onSetY={onSetStartY} onSetHeading={onSetStartHeading} />
      <div className="sequence-header">
        <h6 style={{ margin: 0, color: 'var(--color-text)' }}>AUTONOMOUS SEQUENCE</h6>
        <div className="text-muted" style={{ fontSize: 11, marginTop: 3 }}>
          robot-centric — distance &amp; rotation only
        </div>
      </div>
      <div className="sequence-list">
        {commands.map((cmd, idx) => (
          <CommandRow
            key={cmd.id}
            cmd={cmd}
            idx={idx}
            isCurrent={idx === currentStep}
            isDone={idx < currentStep}
            units={units}
            onGoTo={() => onGoTo(idx)}
            onToggleDir={() => onToggleDir(idx)}
            onDelete={() => onDelete(idx)}
            onChangeValue={(raw) => onChangeValue(idx, raw)}
            onChangeNote={(note) => onChangeNote(idx, note)}
            onChangeSpeed={(raw) => onChangeSpeed(idx, raw)}
          />
        ))}
      </div>
      <div className="sequence-footer">
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAddDrive}>
          + DRIVE
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAddTurn}>
          + TURN
        </button>
      </div>
    </div>
  );
}
