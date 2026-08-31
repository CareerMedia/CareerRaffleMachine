import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import './SpinButton.css';

interface SpinButtonProps {
  onClick: () => void;
  disabled?: boolean;
  visible?: boolean;
}

export function SpinButton({ onClick, disabled = false, visible = true }: SpinButtonProps) {
  if (!visible) return null;

  return (
    <motion.button
      className="spin-button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, scale: 0.92 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96, y: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label="Start spin"
    >
      <span className="spin-button__glow" aria-hidden="true" />
      <span className="spin-button__edge" aria-hidden="true" />
      <span className="spin-button__content">
        <Play className="spin-button__icon" size={22} fill="currentColor" />
        <span className="spin-button__text">START SPIN</span>
      </span>
    </motion.button>
  );
}
