import type { PathState } from '../types';

const STORAGE_KEY = 'waypoint.store.v1';

/**
 * Stored as a { paths, activeId } collection (even though v1 only ever shows one path) so a
 * future multi-path library is a UI change, not a data migration.
 */
interface Store {
  paths: Record<string, PathState>;
  activeId: string;
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function defaultPath(): PathState {
  return {
    id: genId(),
    pathName: '',
    teamNumber: '',
    units: 'in',
    allianceColor: 'red',
    startPose: { x: 24, y: 24, heading: 90 },
    robotWidth: 15.5,
    robotLength: 15.5,
    drivetrain: 'tank',
    commands: [
      { id: 1, action: 'turn', dir: 'right', value: 20, speed: 127, note: 'Aim at center goal' },
      { id: 2, action: 'drive', dir: 'forward', value: 52, speed: 127, note: 'Drive to center goal' },
      { id: 3, action: 'turn', dir: 'left', value: 20, speed: 127, note: 'Square up to goal' },
      { id: 4, action: 'drive', dir: 'forward', value: 10, speed: 80, note: 'Push into goal' },
      { id: 5, action: 'drive', dir: 'reverse', value: 14, speed: 127, note: 'Clear the goal' },
      { id: 6, action: 'turn', dir: 'right', value: 135, speed: 127, note: 'Turn toward long goal' },
      { id: 7, action: 'drive', dir: 'forward', value: 46, speed: 127, note: 'Drive to long goal' },
    ],
    exportFormat: 'pdf',
    paperSize: 'letter',
    includeField: true,
    includeSteps: true,
    updatedAt: Date.now(),
  };
}

export function loadActivePath(): PathState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPath();
    const store = JSON.parse(raw) as Store;
    const path = store.paths?.[store.activeId];
    if (!path) return defaultPath();
    return path;
  } catch {
    return defaultPath();
  }
}

export function saveActivePath(path: PathState): void {
  const store: Store = { paths: { [path.id]: { ...path, updatedAt: Date.now() } }, activeId: path.id };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable (private browsing quota, etc.) — silently skip autosave
  }
}
