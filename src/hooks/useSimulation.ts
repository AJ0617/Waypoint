import { useMemo } from 'react';
import { simulate } from '../lib/pathSim';
import type { Command, Pose } from '../types';

export function useSimulation(commands: Command[], startPose: Pose) {
  return useMemo(() => simulate(commands, startPose), [commands, startPose]);
}
