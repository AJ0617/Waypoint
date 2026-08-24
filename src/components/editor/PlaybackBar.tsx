import { fmtDist } from '../../lib/pathSim';
import type { Command, Units } from '../../types';
import { NextIcon, PrevIcon, RestartIcon } from '../icons';

interface PlaybackBarProps {
  currentStep: number;
  stepCount: number;
  playProgress: number;
  isPlaying: boolean;
  noPrev: boolean;
  noNext: boolean;
  currentCommand: Command | undefined;
  units: Units;
  onToggle: () => void;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function PlaybackBar({ currentStep, stepCount, playProgress, isPlaying, noPrev, noNext, currentCommand, units, onToggle, onReset, onPrev, onNext }: PlaybackBarProps) {
  const cmd = currentCommand;
  const verb = cmd ? (cmd.action === 'turn' ? `TURN ${cmd.dir === 'left' ? 'LEFT' : 'RIGHT'}` : cmd.dir === 'forward' ? 'DRIVE FORWARD' : 'DRIVE REVERSE') : 'DONE';
  const big = cmd ? (cmd.action === 'turn' ? `${cmd.value.toFixed(0)}°` : `${fmtDist(cmd.value, units)} ${units === 'cm' ? 'CM' : 'IN'}`) : '';

  return (
    <div className="editor-playback">
      <button className="btn btn-secondary btn-icon" onClick={onReset} title="Restart">
        <RestartIcon />
      </button>
      <button className="btn btn-secondary btn-icon" onClick={onPrev} disabled={noPrev} title="Previous step">
        <PrevIcon />
      </button>
      <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={onToggle}>
        {isPlaying ? '❚❚ PAUSE' : '▶ PLAY SEQUENCE'}
      </button>
      <button className="btn btn-secondary btn-icon" onClick={onNext} disabled={noNext} title="Next step">
        <NextIcon />
      </button>
      <div className="playback-progress">
        <div className="playback-progress-labels">
          <span>STEP {stepCount === 0 ? 0 : currentStep + 1} OF {stepCount}</span>
          <span>{verb} {big}</span>
        </div>
        <div className="playback-progress-track">
          <div className="playback-progress-fill" style={{ width: `${(playProgress * 100).toFixed(0)}%` }} />
        </div>
      </div>
    </div>
  );
}
