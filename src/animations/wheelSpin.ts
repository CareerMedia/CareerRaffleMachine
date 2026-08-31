import gsap from 'gsap';
import { computeTargetRotation, getSegmentIndexAtPointer } from '../lib/wheelGeometry';
import {
  SPIN_MAX_ROTATIONS,
  SPIN_MIN_ROTATIONS,
  WINNER_PAUSE_DURATION,
} from './timings';

export interface SpinConfig {
  segmentCount: number;
  targetSegmentIndex: number;
  currentRotation: number;
  reducedMotion?: boolean;
}

export interface SpinCallbacks {
  onPhaseChange?: (phase: 'accelerating' | 'fullSpeed' | 'decelerating') => void;
  onSegmentPass?: () => void;
  onRotationUpdate?: (rotation: number) => void;
  onLocked?: () => void;
  onComplete?: () => void;
}

function applyRotation(el: HTMLElement, rotation: number) {
  gsap.set(el, { rotation });
  el.style.setProperty('--wheel-rotation', `${rotation}deg`);
}

export function createWheelSpinTimeline(
  wheelElement: HTMLElement,
  config: SpinConfig,
  callbacks: SpinCallbacks = {},
): gsap.core.Timeline {
  const { segmentCount, targetSegmentIndex, currentRotation, reducedMotion } = config;
  const fullRotations =
    SPIN_MIN_ROTATIONS +
    Math.floor(Math.random() * (SPIN_MAX_ROTATIONS - SPIN_MIN_ROTATIONS + 1));

  const targetRotation = computeTargetRotation(
    targetSegmentIndex,
    segmentCount,
    currentRotation,
    fullRotations,
    SPIN_MIN_ROTATIONS,
  );

  const tl = gsap.timeline({
    onComplete: callbacks.onComplete,
  });

  let lastSegment = getSegmentIndexAtPointer(currentRotation, segmentCount);
  const tracker = { rotation: currentRotation };

  const updateWheel = () => {
    applyRotation(wheelElement, tracker.rotation);
    callbacks.onRotationUpdate?.(tracker.rotation);

    const seg = getSegmentIndexAtPointer(tracker.rotation, segmentCount);
    if (seg !== lastSegment) {
      lastSegment = seg;
      callbacks.onSegmentPass?.();
    }
  };

  const duration = reducedMotion ? 1.5 : 6;

  tl.to(tracker, {
    rotation: targetRotation,
    duration,
    ease: reducedMotion ? 'power2.out' : 'power4.out',
    onStart: () => callbacks.onPhaseChange?.('accelerating'),
    onUpdate: updateWheel,
    onComplete: () => {
      callbacks.onPhaseChange?.('fullSpeed');
      callbacks.onPhaseChange?.('decelerating');
    },
  });

  tl.to({}, {
    duration: WINNER_PAUSE_DURATION,
    onComplete: () => {
      applyRotation(wheelElement, targetRotation);
      callbacks.onLocked?.();
    },
  });

  return tl;
}

export function getRotationFromElement(el: HTMLElement): number {
  const transform = gsap.getProperty(el, 'rotation') as number;
  return transform || 0;
}
