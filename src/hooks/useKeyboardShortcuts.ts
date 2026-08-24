import { useEffect } from 'react';

interface ShortcutHandlers {
  onPlayPause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useKeyboardShortcuts({ onPlayPause, onPrevStep, onNextStep, onUndo, onRedo }: ShortcutHandlers) {
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
  }, [onPlayPause, onPrevStep, onNextStep, onUndo, onRedo]);
}
