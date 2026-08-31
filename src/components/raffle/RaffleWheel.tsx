import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Participant } from '../../types/raffle';
import { WheelSegment } from './WheelSegment';
import { WheelLabels } from './WheelLabels';
import { WheelPointer } from './WheelPointer';
import { WheelHub } from './WheelHub';
import './RaffleWheel.css';

export interface RaffleWheelHandle {
  getWheelElement: () => HTMLDivElement | null;
}

interface RaffleWheelProps {
  participants: Participant[];
  winningIndex?: number | null;
  pointerTick?: number;
  isSpinning?: boolean;
  isPreparing?: boolean;
  highlightWinner?: boolean;
  hubHidden?: boolean;
  onSpinClick?: () => void;
  canSpin?: boolean;
}

export const RaffleWheel = forwardRef<RaffleWheelHandle, RaffleWheelProps>(
  function RaffleWheel(
    {
      participants,
      winningIndex = null,
      pointerTick = 0,
      isSpinning = false,
      isPreparing = false,
      highlightWinner = false,
      hubHidden = false,
      onSpinClick,
      canSpin = true,
    },
    ref,
  ) {
    const spinLayerRef = useRef<HTMLDivElement>(null);
    const svgRadius = 380;
    const svgSize = svgRadius * 2;

    useImperativeHandle(ref, () => ({
      getWheelElement: () => spinLayerRef.current,
    }));

    const names = participants.map((p) => p.name);

    return (
      <div
        className={`wheel-shell ${isSpinning ? 'wheel-shell--spinning' : ''} ${
          isPreparing ? 'wheel-shell--preparing' : ''
        } ${highlightWinner ? 'wheel-shell--dimmed' : ''}`}
      >
        <div className="wheel-shell__bloom" aria-hidden="true" />

        <div className="wheel-shell__acrylic-outer" aria-hidden="true">
          <div className="wheel-shell__acrylic-highlight" />
        </div>

        <div className="wheel-shell__face">
          <div
            ref={spinLayerRef}
            className="wheel-shell__spin-layer"
            style={{ '--wheel-rotation': '0deg' } as React.CSSProperties}
          >
            <svg
              viewBox={`${-svgSize / 2} ${-svgSize / 2} ${svgSize} ${svgSize}`}
              className="wheel-shell__segments"
              aria-hidden="true"
            >
              {participants.map((p, i) => (
                <WheelSegment
                  key={p.id}
                  index={i}
                  total={participants.length}
                  radius={svgRadius}
                  highlight={highlightWinner && winningIndex === i}
                  dimmed={highlightWinner && winningIndex !== i}
                />
              ))}
            </svg>
            <WheelLabels
              names={names}
              winningIndex={winningIndex}
              highlightWinner={highlightWinner}
            />
          </div>

          <div className="wheel-shell__inner-rim" aria-hidden="true" />
        </div>

        <div className="wheel-shell__illuminated-ring" aria-hidden="true" />

        <WheelPointer tick={pointerTick} active={isSpinning} />

        <WheelHub
          onClick={onSpinClick}
          disabled={!canSpin || hubHidden || isPreparing}
          isPreparing={isPreparing}
          hidden={hubHidden}
        />

        <div className="wheel-shell__floor-glow" aria-hidden="true" />
      </div>
    );
  },
);
