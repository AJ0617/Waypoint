import { useState } from 'react';
import type { MouseEvent } from 'react';
import { metrics, toPx, FIELD } from '../../lib/pathSim';
import type { useFieldView } from '../../hooks/useFieldView';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { Pose, SelectedPoint, SimResult } from '../../types';
import { FieldSvg } from './FieldSvg';
import { ZoomInIcon, ZoomOutIcon } from '../icons';

interface FieldCanvasProps {
  sim: SimResult;
  startPose: Pose;
  robotWidth: number;
  robotLength: number;
  currentStep: number;
  playProgress: number;
  fieldView: ReturnType<typeof useFieldView>;
  onDragPreview: (cmdIdx: number, fx: number, fy: number) => void;
  onDragCommit: () => void;
  onDragStartPreview: (fx: number, fy: number) => void;
  onDragStartCommit: () => void;
  selectedPoint: SelectedPoint;
  onSelectPoint: (p: SelectedPoint) => void;
}

export function FieldCanvas({
  sim,
  startPose,
  robotWidth,
  robotLength,
  currentStep,
  playProgress,
  fieldView,
  onDragPreview,
  onDragCommit,
  onDragStartPreview,
  onDragStartCommit,
  selectedPoint,
  onSelectPoint,
}: FieldCanvasProps) {
  const { ref: measureRef, width: dispW } = useElementWidth(280, 900, 780);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [draggingStart, setDraggingStart] = useState(false);
  const { fieldZoom, fieldPanX, fieldPanY, isPanning, zoomIn, zoomOut, resetZoom, onWheel, startPan, onPointerMove, endInteraction } = fieldView;

  // The pose marker shows the interpolated playback position, which only equals the true
  // starting pose when the sequence is parked at step 0 / progress 0 — only offer the marker
  // as a start-pose drag handle then, otherwise dragging it would silently jump the start
  // pose while the marker stays put mid-sequence.
  const startPoseIsShown = currentStep === 0 && playProgress === 0;

  const m = metrics(dispW);
  const mainPts = sim.points.map((p) => { const q = toPx(p.x, p.y, m); return `${q.px.toFixed(1)},${q.py.toFixed(1)}`; }).join(' ');
  const waypoints = sim.points.slice(1).map((p, i) => {
    const q = toPx(p.x, p.y, m);
    return { px: q.px, py: q.py, num: i + 1, cmdIdx: p.cmdIdx, selected: selectedPoint?.type === 'waypoint' && selectedPoint.cmdIdx === p.cmdIdx };
  });
  const endPx = toPx(sim.finalPose.x, sim.finalPose.y, m);

  const stepObj = sim.steps[currentStep];
  const t = Math.min(1, Math.max(0, playProgress));
  const interpX = stepObj ? stepObj.before.x + (stepObj.after.x - stepObj.before.x) * t : startPose.x;
  const interpY = stepObj ? stepObj.before.y + (stepObj.after.y - stepObj.before.y) * t : startPose.y;
  const interpHeading = stepObj ? stepObj.before.heading + (stepObj.after.heading - stepObj.before.heading) * t : startPose.heading;

  let doneDriveCount = 0;
  for (let i = 0; i < currentStep; i++) if (sim.steps[i]?.cmd.action === 'drive') doneDriveCount++;
  const donePtsArr = sim.points.slice(0, doneDriveCount + 1).map((p) => { const q = toPx(p.x, p.y, m); return `${q.px.toFixed(1)},${q.py.toFixed(1)}`; });
  if (stepObj?.cmd.action === 'drive' && t > 0) {
    const q = toPx(interpX, interpY, m);
    donePtsArr.push(`${q.px.toFixed(1)},${q.py.toFixed(1)}`);
  }
  const donePts = donePtsArr.join(' ');

  const curPose = toPx(interpX, interpY, m);
  const curRot = 90 - interpHeading;
  const footprintWidthPx = (robotWidth / FIELD.IN) * m.size;
  const footprintLengthPx = (robotLength / FIELD.IN) * m.size;

  const handleWaypointDragStart = (cmdIdx: number, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIdx(cmdIdx);
    onSelectPoint({ type: 'waypoint', cmdIdx });
  };

  const handleStartPoseDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStart(true);
    onSelectPoint({ type: 'start' });
  };

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (draggingIdx != null || draggingStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const z = fieldZoom;
      const localX = (e.clientX - rect.left) / z;
      const localY = (e.clientY - rect.top) / z;
      const fx = ((localX - m.left) / m.size) * FIELD.IN;
      const fy = FIELD.IN * (1 - (localY - m.top) / m.size);
      if (draggingStart) {
        onDragStartPreview(Math.max(0, Math.min(FIELD.IN, fx)), Math.max(0, Math.min(FIELD.IN, fy)));
      } else if (draggingIdx != null) {
        onDragPreview(draggingIdx, fx, fy);
      }
      return;
    }
    onPointerMove(e);
  };

  const endAll = () => {
    if (draggingIdx != null) {
      setDraggingIdx(null);
      onDragCommit();
    }
    if (draggingStart) {
      setDraggingStart(false);
      onDragStartCommit();
    }
    endInteraction();
  };

  return (
    <div className="field-stage" ref={measureRef}>
      <div style={{ position: 'relative', width: m.dispW, height: m.dispH, overflow: 'hidden' }} onWheel={onWheel}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: m.dispW,
            height: m.dispH,
            transform: `translate(-50%,-50%) translate(${fieldPanX}px,${fieldPanY}px) scale(${fieldZoom})`,
            transformOrigin: 'center center',
            cursor: draggingIdx != null || draggingStart ? 'grabbing' : isPanning ? 'grabbing' : fieldZoom !== 1 ? 'grab' : 'default',
          }}
          onMouseDown={(e) => {
            onSelectPoint(null);
            startPan(e, draggingIdx != null || draggingStart);
          }}
          onMouseMove={handlePointerMove}
          onMouseUp={endAll}
          onMouseLeave={endAll}
        >
          <FieldSvg
            m={m}
            mainPts={mainPts}
            donePts={donePts}
            waypoints={waypoints}
            onWaypointDragStart={handleWaypointDragStart}
            startMarker={{
              px: curPose.px,
              py: curPose.py,
              rot: curRot,
              color: 'var(--color-accent)',
              footprintWidthPx,
              footprintLengthPx,
              selected: startPoseIsShown && selectedPoint?.type === 'start',
            }}
            onStartMarkerDragStart={startPoseIsShown ? handleStartPoseDragStart : undefined}
            endMarker={{ px: endPx.px, py: endPx.py }}
          />
        </div>
      </div>
      <div className="field-zoom-controls">
        <button className="btn btn-secondary btn-icon" onClick={zoomOut} title="Zoom out">
          <ZoomOutIcon />
        </button>
        <span onClick={resetZoom} style={{ cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 11, width: 40, textAlign: 'center' }} title="Reset zoom">
          {Math.round(fieldZoom * 100)}%
        </span>
        <button className="btn btn-secondary btn-icon" onClick={zoomIn} title="Zoom in">
          <ZoomInIcon />
        </button>
      </div>
    </div>
  );
}
