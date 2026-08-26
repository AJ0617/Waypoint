import { useEffect, useRef } from 'react';
import { useHistoryState } from '../lib/history';
import { dragWaypoint as dragWaypointCalc, mirrorCommands, mirrorPose, parseDist } from '../lib/pathSim';
import { loadActivePath, saveActivePath } from '../lib/persistence';
import type { Command, CommandAction, Drivetrain, Alliance, Units, ExportFormat, PaperSize, PathState } from '../types';

const AUTOSAVE_DELAY_MS = 400;

export function usePathState() {
  const history = useHistoryState<PathState>(loadActivePath());
  const path = history.present;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveActivePath(path), AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [path]);

  const commit = (patch: Partial<PathState> | ((s: PathState) => Partial<PathState>)) => {
    const next = typeof patch === 'function' ? patch(path) : patch;
    history.commit({ ...path, ...next });
  };

  const setPathName = (value: string) => commit({ pathName: value });
  const setTeamNumber = (value: string) => commit({ teamNumber: value });
  const setUnits = (units: Units) => commit({ units });
  const setAlliance = (allianceColor: Alliance) => commit({ allianceColor });
  const mirrorAlliance = () =>
    commit((s) => ({
      startPose: mirrorPose(s.startPose),
      commands: mirrorCommands(s.commands),
      allianceColor: s.allianceColor === 'red' ? 'blue' : 'red',
    }));
  const setDrivetrain = (drivetrain: Drivetrain) => commit({ drivetrain });

  const setStartX = (displayValue: number) => commit((s) => ({ startPose: { ...s.startPose, x: parseDist(displayValue, s.units) } }));
  const setStartY = (displayValue: number) => commit((s) => ({ startPose: { ...s.startPose, y: parseDist(displayValue, s.units) } }));
  const setStartHeading = (heading: number) => commit((s) => ({ startPose: { ...s.startPose, heading } }));
  const setStartXY = (x: number, y: number) => commit({ startPose: { ...path.startPose, x, y } });

  const setRobotWidth = (displayValue: number) => commit((s) => ({ robotWidth: parseDist(displayValue, s.units) }));
  const setRobotLength = (displayValue: number) => commit((s) => ({ robotLength: parseDist(displayValue, s.units) }));

  const importPath = (next: PathState) => history.commit(next);

  const setExportFormat = (exportFormat: ExportFormat) => commit({ exportFormat });
  const setPaperSize = (paperSize: PaperSize) => commit({ paperSize });
  const toggleIncludeField = () => commit((s) => ({ includeField: !s.includeField }));
  const toggleIncludeSteps = () => commit((s) => ({ includeSteps: !s.includeSteps }));

  const addCommand = (action: CommandAction) => {
    const cmd: Command =
      action === 'drive'
        ? { id: Date.now(), action: 'drive', dir: 'forward', value: 12, speed: 127, note: '' }
        : { id: Date.now() + 1, action: 'turn', dir: 'right', value: 45, speed: 127, note: '' };
    commit((s) => ({ commands: [...s.commands, cmd] }));
  };

  const deleteCommand = (idx: number) => commit((s) => ({ commands: s.commands.filter((_, i) => i !== idx) }));

  const toggleCommandDir = (idx: number) =>
    commit((s) => ({
      commands: s.commands.map((c, i) => {
        if (i !== idx) return c;
        if (c.action === 'turn') return { ...c, dir: c.dir === 'left' ? 'right' : 'left' };
        return { ...c, dir: c.dir === 'forward' ? 'reverse' : 'forward' };
      }),
    }));

  const changeCommandValue = (idx: number, raw: number) =>
    commit((s) => ({
      commands: s.commands.map((c, i) => {
        if (i !== idx) return c;
        const inches = c.action === 'turn' ? Math.max(0, Math.min(360, raw)) : Math.max(0, parseDist(raw, s.units));
        return { ...c, value: inches };
      }),
    }));

  const changeCommandNote = (idx: number, note: string) => commit((s) => ({ commands: s.commands.map((c, i) => (i === idx ? { ...c, note } : c)) }));

  const changeCommandSpeed = (idx: number, raw: number) =>
    commit((s) => ({ commands: s.commands.map((c, i) => (i === idx ? { ...c, speed: Math.max(0, Math.min(127, raw)) } : c)) }));

  // Captured on the first preview tick of a drag gesture, since the live preview updates
  // `path` via `replace` (no history entries) — the baseline lets drag-end push one clean
  // undo step from "before the drag" to "after the drag" instead of a no-op.
  const dragBaseline = useRef<PathState | null>(null);

  const commitDrag = () => {
    if (dragBaseline.current) {
      history.commitFrom(dragBaseline.current, path);
      dragBaseline.current = null;
    }
  };

  /** Live preview while dragging (no history entry) — call commitDragWaypoint on drag-end. */
  const previewDragWaypoint = (cmdIdx: number, fx: number, fy: number) => {
    if (dragBaseline.current === null) dragBaseline.current = path;
    const next = dragWaypointCalc(path.commands, path.startPose, cmdIdx, fx, fy);
    history.replace({ ...path, commands: next });
  };
  const commitDragWaypoint = commitDrag;

  /** Live preview while dragging the starting-pose marker on the field — call commitDragStart on drag-end. */
  const previewDragStart = (fx: number, fy: number) => {
    if (dragBaseline.current === null) dragBaseline.current = path;
    history.replace({ ...path, startPose: { ...path.startPose, x: fx, y: fy } });
  };
  const commitDragStart = commitDrag;

  return {
    path,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    setPathName,
    setTeamNumber,
    setUnits,
    setAlliance,
    mirrorAlliance,
    setDrivetrain,
    importPath,
    setStartX,
    setStartY,
    setStartHeading,
    setStartXY,
    setRobotWidth,
    setRobotLength,
    setExportFormat,
    setPaperSize,
    toggleIncludeField,
    toggleIncludeSteps,
    addCommand,
    deleteCommand,
    toggleCommandDir,
    changeCommandValue,
    changeCommandNote,
    changeCommandSpeed,
    previewDragWaypoint,
    commitDragWaypoint,
    previewDragStart,
    commitDragStart,
  };
}
