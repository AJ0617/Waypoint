export type Units = 'in' | 'cm';
export type Alliance = 'red' | 'blue';
export type Drivetrain = 'tank' | 'mecanum' | 'xdrive';
export type CommandAction = 'drive' | 'turn';
export type DriveDir = 'forward' | 'reverse';
export type TurnDir = 'left' | 'right';

export interface Pose {
  x: number;
  y: number;
  heading: number;
}

export interface Command {
  id: number;
  action: CommandAction;
  /** DriveDir when action is 'drive', TurnDir when action is 'turn' */
  dir: DriveDir | TurnDir;
  /** inches for drive, degrees for turn — always stored in inches/degrees regardless of display units */
  value: number;
  /** 0-127, VEX motor speed scale */
  speed: number;
  note: string;
}

export interface RobotConfig {
  width: number;
  length: number;
  drivetrain: Drivetrain;
}

export type ExportFormat = 'pdf' | 'png';
export type PaperSize = 'letter' | 'a4';

export interface PathState {
  id: string;
  pathName: string;
  teamNumber: string;
  units: Units;
  allianceColor: Alliance;
  startPose: Pose;
  robotWidth: number;
  robotLength: number;
  drivetrain: Drivetrain;
  commands: Command[];
  exportFormat: ExportFormat;
  paperSize: PaperSize;
  includeField: boolean;
  includeSteps: boolean;
  updatedAt: number;
}

export type Tab = 'editor' | 'config' | 'export';

export interface SimStep {
  cmd: Command;
  before: Pose;
  after: Pose;
}

export interface SimPoint {
  x: number;
  y: number;
  cmdIdx: number;
}

export interface SimResult {
  steps: SimStep[];
  points: SimPoint[];
  finalPose: Pose;
}
