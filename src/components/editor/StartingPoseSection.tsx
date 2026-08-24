import { useState } from 'react';
import { fmtDist } from '../../lib/pathSim';
import type { Pose, Units } from '../../types';
import { ChevronIcon } from '../icons';

interface StartingPoseSectionProps {
  startPose: Pose;
  units: Units;
  onSetX: (v: number) => void;
  onSetY: (v: number) => void;
  onSetHeading: (v: number) => void;
}

export function StartingPoseSection({ startPose, units, onSetX, onSetY, onSetHeading }: StartingPoseSectionProps) {
  const [open, setOpen] = useState(false);
  const x = fmtDist(startPose.x, units);
  const y = fmtDist(startPose.y, units);
  const heading = startPose.heading.toFixed(0);

  return (
    <div className="pose-section">
      <button className="pose-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronIcon open={open} />
        <span className="pose-toggle-label">STARTING POSE</span>
        <span className="pose-toggle-summary">{x}, {y} {units} · {heading}°</span>
      </button>
      {open && (
        <div className="pose-fields">
          <div className="field">
            <label>X ({units})</label>
            <input
              className="input"
              type="number"
              defaultValue={x}
              key={`x-${x}`}
              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSetX(v); }}
            />
          </div>
          <div className="field">
            <label>Y ({units})</label>
            <input
              className="input"
              type="number"
              defaultValue={y}
              key={`y-${y}`}
              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSetY(v); }}
            />
          </div>
          <div className="field">
            <label>HEADING (°)</label>
            <input
              className="input"
              type="number"
              defaultValue={heading}
              key={`h-${heading}`}
              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onSetHeading(v); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
