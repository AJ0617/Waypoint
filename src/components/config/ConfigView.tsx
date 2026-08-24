import type { MouseEvent } from 'react';
import { metrics, toPx, FIELD } from '../../lib/pathSim';
import { fmtDist } from '../../lib/pathSim';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { usePathState } from '../../hooks/usePathState';
import { FieldSvg } from '../editor/FieldSvg';

interface ConfigViewProps {
  pathApi: ReturnType<typeof usePathState>;
}

export function ConfigView({ pathApi }: ConfigViewProps) {
  const { path } = pathApi;
  const { ref, width } = useElementWidth(220, 460, 460);
  const m = metrics(width);
  const pose = toPx(path.startPose.x, path.startPose.y, m);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const ox = e.nativeEvent.offsetX;
    const oy = e.nativeEvent.offsetY;
    const xin = Math.max(0, Math.min(FIELD.IN, (ox / m.size) * FIELD.IN));
    const yin = Math.max(0, Math.min(FIELD.IN, FIELD.IN - (oy / m.size) * FIELD.IN));
    pathApi.setStartXY(xin, yin);
  };

  return (
    <div className="view config-view">
      <div className="config-minimap" ref={ref}>
        <div style={{ position: 'relative', width: m.dispW, height: m.dispH }}>
          <FieldSvg m={m} mainPts="" startMarker={{ px: pose.px, py: pose.py, rot: 90 - path.startPose.heading, color: 'var(--color-accent)' }} />
          <div onClick={handleClick} style={{ position: 'absolute', left: m.left, top: m.top, width: m.size, height: m.size, cursor: 'crosshair' }} />
        </div>
        <p className="text-muted" style={{ fontSize: 11, margin: '10px 0 0', textAlign: 'center' }}>tap the field to set starting position</p>
      </div>

      <div className="config-form">
        <h6 style={{ margin: 0 }}>ROBOT CONFIGURATION</h6>
        <div className="hr" style={{ margin: '2px 0' }} />
        <div className="config-grid-2">
          <div className="field">
            <label>ROBOT WIDTH ({path.units})</label>
            <input
              className="input"
              type="number"
              defaultValue={fmtDist(path.robotWidth, path.units)}
              key={`w-${fmtDist(path.robotWidth, path.units)}`}
              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) pathApi.setRobotWidth(v); }}
            />
          </div>
          <div className="field">
            <label>ROBOT LENGTH ({path.units})</label>
            <input
              className="input"
              type="number"
              defaultValue={fmtDist(path.robotLength, path.units)}
              key={`l-${fmtDist(path.robotLength, path.units)}`}
              onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) pathApi.setRobotLength(v); }}
            />
          </div>
        </div>
        <div className="field">
          <label>DRIVETRAIN</label>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="dt" checked={path.drivetrain === 'tank'} onChange={() => pathApi.setDrivetrain('tank')} />
              <span className="dot" />TANK
            </label>
            <label className="seg-opt">
              <input type="radio" name="dt" checked={path.drivetrain === 'xdrive'} onChange={() => pathApi.setDrivetrain('xdrive')} />
              <span className="dot" />X-DRIVE
            </label>
            <label className="seg-opt">
              <input type="radio" name="dt" checked={path.drivetrain === 'mecanum'} onChange={() => pathApi.setDrivetrain('mecanum')} />
              <span className="dot" />MECANUM
            </label>
          </div>
        </div>
        <div className="field">
          <label>ALLIANCE</label>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="alliance2" checked={path.allianceColor === 'red'} onChange={() => pathApi.setAlliance('red')} />
              <span className="dot" />RED
            </label>
            <label className="seg-opt">
              <input type="radio" name="alliance2" checked={path.allianceColor === 'blue'} onChange={() => pathApi.setAlliance('blue')} />
              <span className="dot" />BLUE
            </label>
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
          Heading is measured field-relative at the start of the routine only — every step after that is driven relative to the robot, since V5RC autonomous has no field-position feedback by default.
        </p>
      </div>
    </div>
  );
}
