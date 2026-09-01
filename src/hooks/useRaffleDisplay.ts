import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawResult, Raffle, RaffleStats } from '../types/raffle';
import {
  type DisplayEvent,
  type DisplayState,
  transitionDisplayState,
  isWinnerState,
  isSpinningState,
  isPreparingState,
} from '../state/displayStateMachine';
import { getRaffleService } from '../services';
import { sanitizeRaffleForDisplay } from '../services/storage/mergeAppState';
import {
  refreshPersistedStateFromGitHub,
  subscribeToStorageUpdates,
} from '../services/storage/persistentStore';
import { useReducedMotion } from './useReducedMotion';

export interface UseRaffleDisplayReturn {
  raffle: Raffle | null;
  stats: RaffleStats | null;
  displayState: DisplayState;
  drawResult: DrawResult | null;
  loading: boolean;
  isSyncing: boolean;
  dispatch: (event: DisplayEvent) => void;
  startSpin: () => Promise<DrawResult | null>;
  completeCelebration: () => void;
  dismissWinner: () => void;
  resetToIdle: () => void;
  abortSpin: () => void;
}

const DISPLAY_PULL_MS = 2500;
const POST_DISMISS_PULL_COOLDOWN_MS = 10000;

function buildStats(raffle: Raffle): RaffleStats {
  const eligible = raffle.participants.filter((participant) => participant.eligible);
  const prizesRemaining = Math.max(0, raffle.prizeCount - raffle.winners.length);

  return {
    inTheRunning: eligible.length,
    prizesRemaining,
    currentDraw: raffle.winners.length + 1,
    totalPrizes: raffle.prizeCount,
  };
}

function isDrawInProgress(state: DisplayState): boolean {
  return (
    isPreparingState(state) ||
    isSpinningState(state) ||
    state === 'winnerLocked' ||
    isWinnerState(state)
  );
}

export function useRaffleDisplay(raffleId: string | undefined): UseRaffleDisplayReturn {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [displayState, setDisplayState] = useState<DisplayState>('idle');
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const reducedMotion = useReducedMotion();
  const pendingDraw = useRef<DrawResult | null>(null);
  const pullInFlight = useRef(false);
  const displayStateRef = useRef<DisplayState>('idle');
  const suppressPullUntilRef = useRef(0);

  displayStateRef.current = displayState;

  const applyRaffleSnapshot = useCallback((data: Raffle | null) => {
    if (!data) {
      setRaffle(null);
      setStats(null);
      return;
    }

    const sanitized = sanitizeRaffleForDisplay(data);
    setRaffle(sanitized);
    setStats(buildStats(sanitized));
  }, []);

  const refreshData = useCallback(async () => {
    if (!raffleId) {
      applyRaffleSnapshot(null);
      return;
    }

    const data = await getRaffleService().getRaffle(raffleId);
    applyRaffleSnapshot(data);
  }, [applyRaffleSnapshot, raffleId]);

  const pullLatest = useCallback(async () => {
    if (pullInFlight.current) return;
    if (Date.now() < suppressPullUntilRef.current) return;
    if (isDrawInProgress(displayStateRef.current)) return;

    pullInFlight.current = true;
    setIsSyncing(true);
    try {
      await refreshPersistedStateFromGitHub();
      await refreshData();
    } finally {
      pullInFlight.current = false;
      setIsSyncing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    setLoading(true);
    pullLatest().finally(() => setLoading(false));
  }, [pullLatest]);

  useEffect(() => {
    const onFocus = () => {
      pullLatest();
    };

    const unsubscribe = subscribeToStorageUpdates(() => {
      if (isDrawInProgress(displayStateRef.current)) return;
      refreshData();
    });

    const pullId = window.setInterval(() => {
      pullLatest();
    }, DISPLAY_PULL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') pullLatest();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(pullId);
      unsubscribe();
    };
  }, [pullLatest, refreshData]);

  const dispatch = useCallback((event: DisplayEvent) => {
    setDisplayState((prev) => transitionDisplayState(prev, event));
  }, []);

  const startSpin = useCallback(async (): Promise<DrawResult | null> => {
    if (!raffleId || displayState !== 'idle') return null;

    dispatch({ type: 'START_SPIN' });

    const service = getRaffleService();
    const result = await service.drawWinner(raffleId);
    pendingDraw.current = result;
    setDrawResult(result);

    return result;
  }, [displayState, dispatch, raffleId, reducedMotion]);

  const completeCelebration = useCallback(() => {
    dispatch({ type: 'CELEBRATION_COMPLETE' });
  }, [dispatch]);

  const dismissWinner = useCallback(async () => {
    if (!raffleId) return;
    const result = pendingDraw.current ?? drawResult;
    if (!result) {
      dispatch({ type: 'DISMISS_WINNER' });
      return;
    }

    suppressPullUntilRef.current = Date.now() + POST_DISMISS_PULL_COOLDOWN_MS;

    setRaffle((current) => {
      if (!current) return current;

      const alreadyRecorded = current.winners.some(
        (winner) => winner.participantId === result.winner.id,
      );

      const nextRaffle = sanitizeRaffleForDisplay({
        ...current,
        participants: current.participants.map((participant) =>
          participant.id === result.winner.id
            ? { ...participant, eligible: false }
            : participant,
        ),
        winners: alreadyRecorded
          ? current.winners
          : [
              ...current.winners,
              {
                id: `winner-pending-${result.winner.id}`,
                participantId: result.winner.id,
                participantName: result.winner.name,
                drawNumber: result.drawNumber,
                wonAt: new Date().toISOString(),
              },
            ],
      });

      setStats(buildStats(nextRaffle));
      return nextRaffle;
    });

    try {
      const service = getRaffleService();
      await service.removeWinnerFromPool(raffleId, result.winner.id);
      await refreshData();
    } finally {
      dispatch({ type: 'DISMISS_WINNER' });
      setDrawResult(null);
      pendingDraw.current = null;
    }
  }, [dispatch, drawResult, raffleId, refreshData]);

  const resetToIdle = useCallback(() => {
    dispatch({ type: 'RESET_COMPLETE' });
    setDrawResult(null);
    pendingDraw.current = null;
  }, [dispatch]);

  const abortSpin = useCallback(() => {
    dispatch({ type: 'SPIN_ABORT' });
    setDrawResult(null);
    pendingDraw.current = null;
  }, [dispatch]);

  return {
    raffle,
    stats,
    displayState,
    drawResult,
    loading,
    isSyncing,
    dispatch,
    startSpin,
    completeCelebration,
    dismissWinner,
    resetToIdle,
    abortSpin,
  };
}
