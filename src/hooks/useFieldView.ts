import { useCallback, useRef, useState } from 'react';
import type { MouseEvent, WheelEvent } from 'react';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

export function useFieldView() {
  const [fieldZoom, setFieldZoom] = useState(1);
  const [fieldPanX, setFieldPanX] = useState(0);
  const [fieldPanY, setFieldPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

  const zoomIn = useCallback(() => setFieldZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2))), []);
  const zoomOut = useCallback(() => setFieldZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2))), []);
  const resetZoom = useCallback(() => {
    setFieldZoom(1);
    setFieldPanX(0);
    setFieldPanY(0);
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setFieldZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + delta).toFixed(2))));
  }, []);

  const startPan = useCallback(
    (e: MouseEvent, draggingWaypoint: boolean) => {
      if (draggingWaypoint || fieldZoom === 1) return;
      panOrigin.current = { x: e.clientX, y: e.clientY, offX: fieldPanX, offY: fieldPanY };
      setIsPanning(true);
    },
    [fieldZoom, fieldPanX, fieldPanY],
  );

  const onPointerMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panOrigin.current.x;
      const dy = e.clientY - panOrigin.current.y;
      setFieldPanX(panOrigin.current.offX + dx);
      setFieldPanY(panOrigin.current.offY + dy);
    },
    [isPanning],
  );

  const endInteraction = useCallback(() => setIsPanning(false), []);

  return { fieldZoom, fieldPanX, fieldPanY, isPanning, zoomIn, zoomOut, resetZoom, onWheel, startPan, onPointerMove, endInteraction };
}
