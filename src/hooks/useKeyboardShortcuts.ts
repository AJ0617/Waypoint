import { useEffect } from 'react';
import { NUDGE_STEP_BIG_IN, NUDGE_STEP_IN } from '../lib/pathSim';

interface ShortcutHandlers {
  onPlayPause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onUndo: () => void;
  onRedo: () => void;
  /** Whether a waypoint/start-pose marker is currently selected on the field. */
  hasSelection: boolean;
  onNudge: (dx: number, dy: number) => void;
  onDeselect: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useKeyboardShortcuts({ onPlayPause, onPrevStep, onNextStep, onUndo, onRedo, hasSelection, onNudge, onDeselect }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }
      if (hasSelection && e.key === 'Escape') {
        e.preventDefault();
        onDeselect();
        return;
      }
      // While a waypoint/start pose is selected, arrow keys nudge it instead of stepping playback.
      if (hasSelection && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const step = e.shiftKey ? NUDGE_STEP_BIG_IN : NUDGE_STEP_IN;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
        onNudge(dx, dy);
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevStep();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNextStep();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPlayPause, onPrevStep, onNextStep, onUndo, onRedo, hasSelection, onNudge, onDeselect]);
}
