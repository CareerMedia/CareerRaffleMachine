import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  disposeAudio,
  playConfettiPop,
  playFinalLock,
  playPointerTick,
  playWinnerSting,
  resumeAudio,
  setSoundMuted,
  startSpinSound,
  stopSpinSound,
  updateSpinIntensity,
} from '../audio/raffleSounds';
import { useReducedMotion } from './useReducedMotion';

export function useRaffleSounds() {
  const reducedMotion = useReducedMotion();
  const lastRotationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const mutedRef = useRef(reducedMotion);

  useEffect(() => {
    mutedRef.current = reducedMotion;
    setSoundMuted(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => () => disposeAudio(), []);

  const prepareForSpin = useCallback(async () => {
    if (mutedRef.current) return;
    await resumeAudio();
    lastRotationRef.current = 0;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    startSpinSound();
  }, []);

  const handleRotationUpdate = useCallback((rotation: number) => {
    if (mutedRef.current) return;
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    if (dt > 0.001) {
      const velocity = Math.abs(rotation - lastRotationRef.current) / dt;
      velocityRef.current = velocity;
      updateSpinIntensity(velocity);
      lastRotationRef.current = rotation;
      lastTimeRef.current = now;
    }
  }, []);

  const handleSegmentPass = useCallback(() => {
    if (mutedRef.current) return;
    const slowFactor = Math.max(0, 1 - velocityRef.current / 400);
    playPointerTick(0.6 + slowFactor * 0.8);
  }, []);

  const handleWheelLocked = useCallback(() => {
    if (mutedRef.current) return;
    stopSpinSound();
    playFinalLock();
  }, []);

  const handleWinnerReveal = useCallback(() => {
    if (mutedRef.current) return;
    playWinnerSting();
  }, []);

  const handleConfetti = useCallback(() => {
    if (mutedRef.current) return;
    playConfettiPop();
  }, []);

  const handleSpinCancelled = useCallback(() => {
    stopSpinSound(0.1);
  }, []);

  return useMemo(
    () => ({
      prepareForSpin,
      handleRotationUpdate,
      handleSegmentPass,
      handleWheelLocked,
      handleWinnerReveal,
      handleConfetti,
      handleSpinCancelled,
    }),
    [
      prepareForSpin,
      handleRotationUpdate,
      handleSegmentPass,
      handleWheelLocked,
      handleWinnerReveal,
      handleConfetti,
      handleSpinCancelled,
    ],
  );
}
