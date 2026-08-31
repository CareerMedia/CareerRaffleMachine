import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AmbientBackground } from './AmbientBackground';
import { BrandLockup } from './BrandLockup';
import { StatusCapsule } from './StatusCapsule';
import { RaffleWheel, type RaffleWheelHandle } from './RaffleWheel';
import { WinnerReveal } from './WinnerReveal';
import { StageFloor } from './StageFloor';
import { OrbitDecor } from './OrbitDecor';
import { CornerTags } from './CornerTags';
import { useRaffleDisplay } from '../../hooks/useRaffleDisplay';
import { useViewportScale } from '../../hooks/useViewportScale';
import { useRaffleSounds } from '../../hooks/useRaffleSounds';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  createWheelSpinTimeline,
  getRotationFromElement,
} from '../../animations/wheelSpin';
import gsap from 'gsap';
import { SPIN_PREP_DURATION, CELEBRATION_DURATION } from '../../animations/timings';
import {
  isInteractiveState,
  isPreparingState,
  isSpinningState,
  isWinnerState,
  shouldDimUI,
} from '../../state/displayStateMachine';
import './RaffleDisplay.css';

interface RaffleDisplayProps {
  raffleId?: string;
}

export function RaffleDisplay({ raffleId }: RaffleDisplayProps) {
  const {
    raffle,
    stats,
    displayState,
    drawResult,
    loading,
    dispatch,
    startSpin,
    completeCelebration,
    dismissWinner,
    abortSpin,
  } = useRaffleDisplay(raffleId);

  const scale = useViewportScale();
  const reducedMotion = useReducedMotion();
  const sounds = useRaffleSounds();
  const wheelRef = useRef<RaffleWheelHandle>(null);
  const spinTimelineRef = useRef<{ kill: () => void } | null>(null);
  const prepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pointerTick, setPointerTick] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const eligibleParticipants =
    raffle?.participants.filter((p) => p.eligible) ?? [];

  const cancelSpin = useCallback(() => {
    if (prepTimerRef.current) {
      clearTimeout(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    spinTimelineRef.current?.kill();
    spinTimelineRef.current = null;
    sounds.handleSpinCancelled();
    abortSpin();
  }, [abortSpin, sounds]);

  const handleSpin = useCallback(async () => {
    if (!isInteractiveState(displayState)) return;

    if (eligibleParticipants.length === 0) return;

    const wheelEl = wheelRef.current?.getWheelElement();
    if (!wheelEl) return;

    let result;
    try {
      result = await startSpin();
    } catch {
      cancelSpin();
      return;
    }

    if (!result) return;

    try {
      await sounds.prepareForSpin();

      const initialRotation = getRotationFromElement(wheelEl);
      sounds.handleRotationUpdate(initialRotation);

      prepTimerRef.current = setTimeout(() => {
        dispatch({ type: 'PREP_COMPLETE' });
      }, reducedMotion ? 100 : SPIN_PREP_DURATION * 1000);

      spinTimelineRef.current?.kill();
      spinTimelineRef.current = createWheelSpinTimeline(
        wheelEl,
        {
          segmentCount: eligibleParticipants.length,
          targetSegmentIndex: result.segmentIndex,
          currentRotation: initialRotation,
          reducedMotion,
        },
        {
          onPhaseChange: (phase) => {
            if (phase === 'decelerating') {
              dispatch({ type: 'SPIN_PHASE_CHANGE', phase: 'decelerating' });
            }
          },
          onRotationUpdate: sounds.handleRotationUpdate,
          onSegmentPass: () => {
            setPointerTick((t) => t + 1);
            sounds.handleSegmentPass();
          },
          onLocked: () => {
            sounds.handleWheelLocked();
            dispatch({ type: 'WHEEL_LOCKED' });
            setTimeout(() => {
              setShowConfetti(true);
              completeCelebration();
            }, reducedMotion ? 200 : CELEBRATION_DURATION * 200);
          },
        },
      );
    } catch {
      cancelSpin();
    }
  }, [
    displayState,
    startSpin,
    dispatch,
    reducedMotion,
    eligibleParticipants.length,
    completeCelebration,
    sounds,
    cancelSpin,
  ]);

  const handleDismissWinner = useCallback(async () => {
    if (displayState !== 'celebrating') return;
    await dismissWinner();
    setShowConfetti(false);
    const wheelEl = wheelRef.current?.getWheelElement();
    if (wheelEl) {
      gsap.set(wheelEl, { rotation: 0 });
      wheelEl.style.setProperty('--wheel-rotation', '0deg');
    }
    setPointerTick(0);
  }, [displayState, dismissWinner]);

  useEffect(() => {
    if (displayState === 'celebrating') {
      const timer = setTimeout(() => {
        handleDismissWinner();
      }, reducedMotion ? 2000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [displayState, handleDismissWinner, reducedMotion]);

  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
      spinTimelineRef.current?.kill();
      sounds.handleSpinCancelled();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only
  }, []);

  useEffect(() => {
    if (displayState === 'celebrating') {
      sounds.handleWinnerReveal();
    }
  }, [displayState, sounds]);

  useEffect(() => {
    if (showConfetti) {
      sounds.handleConfetti();
    }
  }, [showConfetti, sounds]);

  if (loading || !raffle || !stats) {
    return (
      <div className="raffle-display raffle-display--loading">
        <AmbientBackground />
        <div className="raffle-display__loader">Loading…</div>
      </div>
    );
  }

  const dimmed = shouldDimUI(displayState);
  const wheelAnimating =
    isSpinningState(displayState) ||
    isPreparingState(displayState) ||
    displayState === 'winnerLocked';
  const preparing = isPreparingState(displayState);
  const hubHidden =
    isSpinningState(displayState) || displayState === 'winnerLocked';
  const showWinner = displayState === 'celebrating';
  const canSpin = isInteractiveState(displayState);

  return (
    <div className="raffle-display">
      <AmbientBackground energized={isSpinningState(displayState)} />
      <OrbitDecor />
      <StageFloor />

      <div
        className="raffle-display__stage"
        style={{ transform: `scale(${scale})` }}
      >
        <header className="raffle-display__header">
          <Link
            to="/admin/raffles"
            className="raffle-display__brand-link"
            aria-label="Open raffle admin"
            title="Open raffle admin"
          >
            <BrandLockup subdued={dimmed} />
          </Link>
          <StatusCapsule
            inTheRunning={stats.inTheRunning}
            prizesRemaining={stats.prizesRemaining}
            currentDraw={stats.currentDraw}
            totalPrizes={stats.totalPrizes}
            dimmed={dimmed}
          />
        </header>

        <main className="raffle-display__main">
          <motion.div
            className="raffle-display__wheel-wrap"
            animate={{
              opacity:
                isWinnerState(displayState) && displayState !== 'winnerDisplay'
                  ? 0.25
                  : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <RaffleWheel
              ref={wheelRef}
              participants={eligibleParticipants}
              winningIndex={drawResult?.segmentIndex ?? null}
              pointerTick={pointerTick}
              isSpinning={wheelAnimating}
              isPreparing={preparing}
              highlightWinner={displayState === 'winnerLocked'}
              hubHidden={hubHidden}
              onSpinClick={handleSpin}
              canSpin={canSpin}
            />
          </motion.div>
        </main>

        <CornerTags dimmed={dimmed} raffleTitle={raffle?.title} />
      </div>

      <WinnerReveal
        visible={showWinner}
        showConfetti={showConfetti}
        winnerName={drawResult?.winner.name ?? ''}
        drawNumber={drawResult?.drawNumber ?? stats.currentDraw}
        totalDraws={stats.totalPrizes}
        raffleTitle={raffle.title}
        onContinue={handleDismissWinner}
      />
    </div>
  );
}
