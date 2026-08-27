import type { MouseEvent } from 'react';
import type { FieldMetrics } from '../../lib/pathSim';
import fieldImg from '../../assets/field.jpg';

export interface FieldWaypoint {
  px: number;
  py: number;
  num: number;
  cmdIdx: number;
  /** Selected for keyboard nudging — shown with a highlight ring. */
  selected?: boolean;
}

export interface PoseMarker {
  px: number;
  py: number;
  rot: number;
  color: string;
  /** Robot chassis footprint, drawn to scale and rotated with the marker. */
  footprintWidthPx?: number;
  footprintLengthPx?: number;
  /** Selected for keyboard nudging — shown with a highlight ring. */
  selected?: boolean;
}

interface FieldSvgProps {
  m: FieldMetrics;
  mainPts: string;
  donePts?: string;
  waypoints?: FieldWaypoint[];
  onWaypointDragStart?: (cmdIdx: number, e: MouseEvent) => void;
  startMarker?: PoseMarker;
  onStartMarkerDragStart?: (e: MouseEvent) => void;
  endMarker?: { px: number; py: number };
}

export function FieldSvg({ m, mainPts, donePts, waypoints, onWaypointDragStart, startMarker, onStartMarkerDragStart, endMarker }: FieldSvgProps) {
  return (
    <>
      <img src={fieldImg} alt="VEX field" style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
      <svg viewBox={`0 0 ${m.dispW} ${m.dispH}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polyline points={mainPts} fill="none" stroke="var(--color-neutral-600)" strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
        {donePts && <polyline points={donePts} fill="none" stroke="var(--color-accent)" strokeWidth={4} strokeLinecap="round" />}
        {waypoints?.map((wp) => (
          <g key={wp.cmdIdx}>
            {wp.selected && (
              <circle cx={wp.px} cy={wp.py} r={16} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
            )}
            <circle
              cx={wp.px}
              cy={wp.py}
              r={11}
              fill="var(--color-bg)"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              style={{ cursor: onWaypointDragStart ? 'grab' : 'default' }}
              onMouseDown={onWaypointDragStart ? (e) => onWaypointDragStart(wp.cmdIdx, e) : undefined}
            />
            <text x={wp.px} y={wp.py} textAnchor="middle" dy={4} fontSize={11} fontWeight={800} fontFamily="Archivo" fill="var(--color-accent-700)" style={{ pointerEvents: 'none' }}>
              {wp.num}
            </text>
          </g>
        ))}
        {startMarker && (
          <g
            transform={`translate(${startMarker.px} ${startMarker.py}) rotate(${startMarker.rot})`}
            style={{ cursor: onStartMarkerDragStart ? 'grab' : 'default' }}
            onMouseDown={onStartMarkerDragStart}
          >
            {startMarker.footprintWidthPx != null && startMarker.footprintLengthPx != null && (
              <rect
                x={-startMarker.footprintWidthPx / 2}
                y={-startMarker.footprintLengthPx / 2}
                width={startMarker.footprintWidthPx}
                height={startMarker.footprintLengthPx}
                fill="color-mix(in srgb, var(--color-accent) 16%, transparent)"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}
            {onStartMarkerDragStart && <circle r={16} fill="transparent" />}
            {startMarker.selected && (
              <circle r={19} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
            )}
            <rect x={-11} y={-11} width={22} height={22} fill={startMarker.color} stroke="var(--color-bg)" strokeWidth={2.5} />
            <path d="M0 -15 L6 -4 L-6 -4 Z" fill="var(--color-bg)" />
          </g>
        )}
        {endMarker && (
          <g transform={`translate(${endMarker.px} ${endMarker.py})`}>
            <path d="M0 -16 L0 4 M0 -16 L12 -11 L0 -6 Z" fill="none" stroke="var(--color-text)" strokeWidth={2} />
            <path d="M0 -16 L12 -11 L0 -6 Z" fill="var(--color-accent)" />
          </g>
        )}
      </svg>
    </>
  );
}
