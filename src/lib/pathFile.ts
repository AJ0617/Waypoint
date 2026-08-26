import { triggerDownload, safeFilename } from './exportSheet';
import { defaultPath, genId } from './persistence';
import type { Command, CommandAction, DriveDir, Pose, TurnDir, PathState } from '../types';

const SCHEMA = 'waypoint-path';
const VERSION = 1;

interface PathFileEnvelope {
  schema: typeof SCHEMA;
  version: number;
  exportedAt: number;
  path: PathState;
}

export function exportPathFile(path: PathState): void {
  const envelope: PathFileEnvelope = { schema: SCHEMA, version: VERSION, exportedAt: Date.now(), path };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${safeFilename(path.pathName)}-waypoint.json`);
  URL.revokeObjectURL(url);
}

const BAD_FILE_ERROR = "That doesn't look like a Waypoint path file.";

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function parsePose(raw: unknown): Pose {
  if (typeof raw !== 'object' || raw === null) throw new Error(BAD_FILE_ERROR);
  const p = raw as Record<string, unknown>;
  if (!isFiniteNumber(p.x) || !isFiniteNumber(p.y) || !isFiniteNumber(p.heading)) throw new Error(BAD_FILE_ERROR);
  return { x: p.x, y: p.y, heading: p.heading };
}

function parseCommand(raw: unknown): Command {
  if (typeof raw !== 'object' || raw === null) throw new Error(BAD_FILE_ERROR);
  const c = raw as Record<string, unknown>;
  const action: CommandAction | null = c.action === 'drive' || c.action === 'turn' ? c.action : null;
  if (!action || !isFiniteNumber(c.value) || !isFiniteNumber(c.speed)) throw new Error(BAD_FILE_ERROR);
  const dir: DriveDir | TurnDir =
    action === 'drive'
      ? c.dir === 'reverse'
        ? 'reverse'
        : 'forward'
      : c.dir === 'left'
        ? 'left'
        : 'right';
  return {
    id: typeof c.id === 'number' ? c.id : Date.now() + Math.random(),
    action,
    dir,
    value: c.value,
    speed: Math.max(0, Math.min(127, c.speed)),
    note: typeof c.note === 'string' ? c.note : '',
  };
}

/** Parses a `.json` file previously produced by `exportPathFile`, tolerating hand-edited or
 * bare (unwrapped) path objects. Missing cosmetic fields fall back to `defaultPath()`'s
 * defaults; a malformed `commands` array or `startPose` throws `BAD_FILE_ERROR`. */
export function parsePathFile(json: string): PathState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(BAD_FILE_ERROR);
  }
  if (typeof parsed !== 'object' || parsed === null) throw new Error(BAD_FILE_ERROR);
  const envelope = parsed as Record<string, unknown>;
  const raw = (typeof envelope.path === 'object' && envelope.path !== null ? envelope.path : envelope) as Record<string, unknown>;

  if (!Array.isArray(raw.commands)) throw new Error(BAD_FILE_ERROR);
  const commands = raw.commands.map(parseCommand);
  const startPose = parsePose(raw.startPose);

  const base = defaultPath();
  const merged: PathState = {
    ...base,
    ...raw,
    id: genId(),
    commands,
    startPose,
    pathName: typeof raw.pathName === 'string' ? raw.pathName : base.pathName,
    teamNumber: typeof raw.teamNumber === 'string' ? raw.teamNumber : base.teamNumber,
    units: raw.units === 'cm' ? 'cm' : 'in',
    allianceColor: raw.allianceColor === 'blue' ? 'blue' : 'red',
    drivetrain: raw.drivetrain === 'mecanum' || raw.drivetrain === 'xdrive' ? raw.drivetrain : 'tank',
    robotWidth: isFiniteNumber(raw.robotWidth) ? raw.robotWidth : base.robotWidth,
    robotLength: isFiniteNumber(raw.robotLength) ? raw.robotLength : base.robotLength,
    exportFormat: raw.exportFormat === 'png' ? 'png' : 'pdf',
    paperSize: raw.paperSize === 'a4' ? 'a4' : 'letter',
    includeField: typeof raw.includeField === 'boolean' ? raw.includeField : base.includeField,
    includeSteps: typeof raw.includeSteps === 'boolean' ? raw.includeSteps : base.includeSteps,
    updatedAt: Date.now(),
  };
  return merged;
}
