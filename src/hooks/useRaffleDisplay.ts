import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawResult, Raffle, RaffleStats } from '../types/raffle';
import {
  type DisplayEvent,
  type DisplayState,
  transitionDisplayState,
} from '../state/displayStateMachine';
import { getRaffleService } from '../services';
import { subscribeToStorageUpdates } from '../services/storage/persistentStore';
import { useReducedMotion } from './useReducedMotion';

export interface UseRaffleDisplayReturn {
  raffle: Raffle | null;
  stats: RaffleStats | null;
  displayState: DisplayState;
  drawResult: DrawResult | null;
  loading: boolean;
  dispatch: (event: DisplayEvent) => void;
  startSpin: () => Promise<DrawResult | null>;
  completeCelebration: () => void;
  dismissWinner: () => void;
  resetToIdle: () => void;
  abortSpin: () => void;
}

export function useRaffleDisplay(raffleId: string | undefined): UseRaffleDisplayReturn {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [displayState, setDisplayState] = useState<DisplayState>('idle');
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();
  const pendingDraw = useRef<DrawResult | null>(null);

  const refreshData = useCallback(async () => {
    if (!raffleId) {
      setRaffle(null);
      setStats(null);
      return;
    }
    const service = getRaffleService();
    const [r, s] = await Promise.all([
      service.getRaffle(raffleId),
      service.getStats(raffleId),
    ]);
    setRaffle(r);
    setStats(s);
  }, [raffleId]);

  useEffect(() => {
    setLoading(true);
    refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  useEffect(() => {
    const onFocus = () => {
      refreshData();
    };
    window.addEventListener('focus', onFocus);
    const unsubscribe = subscribeToStorageUpdates(() => {
      refreshData();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
      unsubscribe();
    };
  }, [refreshData]);

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
    if (result) {
      const service = getRaffleService();
      await service.removeWinnerFromPool(raffleId, result.winner.id);
      await refreshData();
    }
    dispatch({ type: 'DISMISS_WINNER' });
  }, [drawResult, dispatch, raffleId, refreshData]);

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
    dispatch,
    startSpin,
    completeCelebration,
    dismissWinner,
    resetToIdle,
    abortSpin,
  };
}
