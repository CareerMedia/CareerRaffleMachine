import { motion, AnimatePresence } from 'framer-motion';
import { BrandLockup } from './BrandLockup';
import { ParticleField } from './ParticleField';
import './WinnerReveal.css';

interface WinnerRevealProps {
  visible: boolean;
  showConfetti?: boolean;
  winnerName: string;
  drawNumber: number;
  totalDraws: number;
  raffleTitle?: string;
  onContinue?: () => void;
}

export function WinnerReveal({
  visible,
  showConfetti = false,
  winnerName,
  drawNumber,
  totalDraws,
  raffleTitle,
  onContinue,
}: WinnerRevealProps) {
  const drawPadded = String(drawNumber).padStart(2, '0');
  const totalPadded = String(totalDraws).padStart(2, '0');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="winner-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onContinue}
          role="button"
          tabIndex={0}
          aria-label="Dismiss winner announcement"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onContinue?.();
            }
          }}
        >
          <div className="winner-reveal__backdrop" aria-hidden="true" />
          <ParticleField active={showConfetti} className="particle-field--winner" />
          <div className="winner-reveal__glow" aria-hidden="true" />
          <motion.div
            className="winner-reveal__content"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <BrandLockup />
            {raffleTitle && (
              <p className="winner-reveal__event">{raffleTitle}</p>
            )}
            <motion.h2
              className="winner-reveal__heading"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.5 }}
            >
              WINNER
            </motion.h2>
            <motion.p
              className="winner-reveal__name"
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {winnerName}
            </motion.p>
            <motion.p
              className="winner-reveal__draw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              DRAW {drawPadded} OF {totalPadded}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
