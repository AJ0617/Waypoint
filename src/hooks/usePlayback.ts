import { useCallback, useEffect, useRef, useState } from 'react';
import { stepDuration } from '../lib/pathSim';
import type { Command } from '../types';

const TICK_MS = 30;

export function usePlayback(commands: Command[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);
  const stateRef = useRef({ currentStep, playProgress, commands });
  stateRef.current = { currentStep, playProgress, commands };

  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;
    const { currentStep: step, playProgress: progress, commands: cmds } = stateRef.current;
    const cmd = cmds[step];
    if (!cmd) {
      pause();
      return;
    }
    const inc = dt / stepDuration(cmd);
    const next = progress + inc;
    if (next >= 1) {
      if (step >= cmds.length - 1) {
        pause();
        setPlayProgress(1);
        return;
      }
      setCurrentStep(step + 1);
      setPlayProgress(0);
    } else {
      setPlayProgress(next);
    }
  }, [pause]);

  const play = useCallback(() => {
    const { currentStep: step, playProgress: progress, commands: cmds } = stateRef.current;
    if (step >= cmds.length) return;
    if (step >= cmds.length - 1 && progress >= 1) {
      setCurrentStep(0);
      setPlayProgress(0);
    }
    setIsPlaying(true);
    lastTickRef.current = performance.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const toggle = useCallback(() => (stateRef.current && isPlaying ? pause() : play()), [isPlaying, pause, play]);

  const reset = useCallback(() => {
    pause();
    setCurrentStep(0);
    setPlayProgress(0);
  }, [pause]);

  const goToStep = useCallback(
    (idx: number) => {
      pause();
      setCurrentStep(idx);
      setPlayProgress(0);
    },
    [pause],
  );

  const nextStep = useCallback(() => {
    pause();
    setCurrentStep((s) => Math.min(s + 1, stateRef.current.commands.length - 1));
    setPlayProgress(0);
  }, [pause]);

  const prevStep = useCallback(() => {
    pause();
    setCurrentStep((s) => Math.max(s - 1, 0));
    setPlayProgress(0);
  }, [pause]);

  // Keep currentStep in range if commands were added/removed while paused/stopped.
  useEffect(() => {
    if (commands.length === 0) {
      setCurrentStep(0);
      return;
    }
    if (currentStep > commands.length - 1) {
      setCurrentStep(commands.length - 1);
      setPlayProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands.length]);

  useEffect(() => () => pause(), [pause]);

  return {
    currentStep,
    isPlaying,
    playProgress,
    toggle,
    reset,
    goToStep,
    nextStep,
    prevStep,
    noPrev: currentStep === 0,
    noNext: currentStep >= commands.length - 1,
  };
}
