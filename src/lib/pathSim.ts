import type { Command, Pose, SimResult, Units } from '../types';

/** VEX field geometry: a 144"x144" field square sits at (LEFT,TOP) sized SIZE within the IMG_W x IMG_H field.jpg. */
export const FIELD = { IMG_W: 1320, IMG_H: 779, LEFT: 278, TOP: 14, SIZE: 750, IN: 144 };

/** V5RC/VIQC autonomous period length in seconds. */
export const AUTON_WINDOW_SEC = 15;

/** Keyboard-nudge step sizes for a selected waypoint/start pose, in field inches (always inches, regardless of display units — see `Command.value`). */
export const NUDGE_STEP_IN = 1;
export const NUDGE_STEP_BIG_IN = 5;

export interface FieldMetrics {
  scale: number;
  dispW: number;
  dispH: number;
  left: number;
  top: number;
  size: number;
}

export function metrics(dispW: number): FieldMetrics {
  const s = dispW / FIELD.IMG_W;
  return { scale: s, dispW, dispH: FIELD.IMG_H * s, left: FIELD.LEFT * s, top: FIELD.TOP * s, size: FIELD.SIZE * s };
}

/** Field inches -> on-screen px, field origin is bottom-left with +y up (VEX convention). */
export function toPx(x: number, y: number, m: FieldMetrics): { px: number; py: number } {
  return { px: m.left + (x / FIELD.IN) * m.size, py: m.top + (1 - y / FIELD.IN) * m.size };
}

export function simulate(commands: Command[], start: Pose): SimResult {
  let pose: Pose = { ...start };
  const points = [{ x: pose.x, y: pose.y, cmdIdx: -1 }];
  const steps = commands.map((cmd, idx) => {
    const before = { ...pose };
    if (cmd.action === 'turn') {
      pose = { ...pose, heading: pose.heading + (cmd.dir === 'left' ? 1 : -1) * cmd.value };
    } else {
      const rad = (pose.heading * Math.PI) / 180;
      const sign = cmd.dir === 'reverse' ? -1 : 1;
      pose = { ...pose, x: pose.x + Math.cos(rad) * cmd.value * sign, y: pose.y + Math.sin(rad) * cmd.value * sign };
      points.push({ x: pose.x, y: pose.y, cmdIdx: idx });
    }
    return { cmd, before, after: { ...pose } };
  });
  return { steps, points, finalPose: pose };
}

/** Duration model used for playback timing (ms). */
export function stepDuration(cmd: Command): number {
  const isTurn = cmd.action === 'turn';
  const speed = Math.max(10, cmd.speed ?? 127) / 127;
  const dur = (isTurn ? (cmd.value / 180) * 900 : (cmd.value / 40) * 1000) / speed;
  return Math.max(350, dur);
}

export function fmtDist(v: number, units: Units): string {
  const val = units === 'cm' ? v * 2.54 : v;
  return val.toFixed(1);
}

/** Inverse: a value typed in the display unit -> stored inches. */
export function parseDist(displayValue: number, units: Units): number {
  return units === 'cm' ? displayValue / 2.54 : displayValue;
}

/**
 * Reflects a pose across the field's vertical centerline (the red/blue mirror line on a
 * symmetric field). Drive commands are already robot-relative and invariant under this
 * reflection; only the starting pose and turn directions need to flip — see `mirrorCommands`.
 */
export function mirrorPose(pose: Pose): Pose {
  return { x: FIELD.IN - pose.x, y: pose.y, heading: 180 - pose.heading };
}

/** Flips left/right on turn commands to match a mirrored (`mirrorPose`'d) starting pose; drive commands are unchanged. */
export function mirrorCommands(commands: Command[]): Command[] {
  return commands.map((c) => (c.action === 'turn' ? { ...c, dir: c.dir === 'left' ? 'right' : 'left' } : { ...c }));
}

/**
 * Solve backward for the value(s) that make the path pass through (fx, fy) at waypoint `cmdIdx`.
 * If the immediately preceding command is a turn, that turn's angle and this drive's distance are
 * both re-solved (so dragging a corner waypoint reshapes the turn-then-drive pair). Otherwise only
 * this command's drive distance/direction is re-solved along the existing heading.
 */
export function dragWaypoint(commands: Command[], startPose: Pose, cmdIdx: number, fx: number, fy: number): Command[] {
  const before = simulate(commands.slice(0, cmdIdx), startPose).finalPose;
  const dx = fx - before.x;
  const dy = fy - before.y;
  const dist = Math.hypot(dx, dy);
  const prevIdx = cmdIdx - 1;
  const prevIsTurn = prevIdx >= 0 && commands[prevIdx].action === 'turn';
  const next = commands.map((c) => ({ ...c }));

  if (prevIsTurn) {
    const headingBeforeTurn = simulate(commands.slice(0, prevIdx), startPose).finalPose.heading;
    const desired = (Math.atan2(dy, dx) * 180) / Math.PI;
    let diff = desired - headingBeforeTurn;
    diff = (((diff + 180) % 360) + 360) % 360 - 180;
    next[prevIdx].dir = diff >= 0 ? 'left' : 'right';
    next[prevIdx].value = Math.abs(diff);
    next[cmdIdx].dir = 'forward';
    next[cmdIdx].value = Math.max(1, dist);
  } else {
    const rad = (before.heading * Math.PI) / 180;
    const proj = dx * Math.cos(rad) + dy * Math.sin(rad);
    next[cmdIdx].dir = proj >= 0 ? 'forward' : 'reverse';
    next[cmdIdx].value = Math.max(1, Math.abs(proj));
  }
  return next;
}
