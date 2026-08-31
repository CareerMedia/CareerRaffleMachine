export type DisplayState =
  | 'idle'
  | 'preparing'
  | 'spinning'
  | 'decelerating'
  | 'winnerLocked'
  | 'celebrating'
  | 'winnerDisplay'
  | 'resetting';

export type DisplayEvent =
  | { type: 'START_SPIN' }
  | { type: 'PREP_COMPLETE' }
  | { type: 'SPIN_PHASE_CHANGE'; phase: 'accelerating' | 'fullSpeed' | 'decelerating' }
  | { type: 'WHEEL_LOCKED' }
  | { type: 'CELEBRATION_COMPLETE' }
  | { type: 'DISMISS_WINNER' }
  | { type: 'RESET_COMPLETE' }
  | { type: 'SPIN_ABORT' };

const TRANSITIONS: Record<DisplayState, Partial<Record<DisplayEvent['type'], DisplayState>>> = {
  idle: { START_SPIN: 'preparing' },
  preparing: { PREP_COMPLETE: 'spinning', SPIN_ABORT: 'idle' },
  spinning: {
    SPIN_PHASE_CHANGE: 'spinning',
    WHEEL_LOCKED: 'winnerLocked',
    SPIN_ABORT: 'idle',
  },
  decelerating: { WHEEL_LOCKED: 'winnerLocked', SPIN_ABORT: 'idle' },
  winnerLocked: { CELEBRATION_COMPLETE: 'celebrating' },
  celebrating: { DISMISS_WINNER: 'idle' },
  winnerDisplay: { DISMISS_WINNER: 'idle', START_SPIN: 'resetting' },
  resetting: { RESET_COMPLETE: 'idle' },
};

export function transitionDisplayState(
  current: DisplayState,
  event: DisplayEvent,
): DisplayState {
  if (event.type === 'SPIN_PHASE_CHANGE' && event.phase === 'decelerating') {
    if (current === 'spinning') return 'decelerating';
    return current;
  }

  const next = TRANSITIONS[current]?.[event.type];
  return next ?? current;
}

export function isInteractiveState(state: DisplayState): boolean {
  return state === 'idle';
}

export function isSpinningState(state: DisplayState): boolean {
  return state === 'spinning' || state === 'decelerating';
}

export function isPreparingState(state: DisplayState): boolean {
  return state === 'preparing';
}

export function isWinnerState(state: DisplayState): boolean {
  return (
    state === 'winnerLocked' ||
    state === 'celebrating' ||
    state === 'winnerDisplay'
  );
}

export function shouldDimUI(state: DisplayState): boolean {
  return (
    state === 'preparing' ||
    isSpinningState(state) ||
    state === 'winnerLocked'
  );
}
