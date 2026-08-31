import { motion } from 'framer-motion';
import './DrawIndicator.css';

interface DrawIndicatorProps {
  current: number;
  total: number;
  dimmed?: boolean;
}

export function DrawIndicator({ current, total, dimmed = false }: DrawIndicatorProps) {
  return (
    <motion.div
      className={`draw-indicator ${dimmed ? 'draw-indicator--dimmed' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: dimmed ? 0.35 : 0.85 }}
      transition={{ duration: 0.4 }}
    >
      <span className="draw-indicator__label">DRAW</span>
      <span className="draw-indicator__count">
        {current} <span className="draw-indicator__sep">/</span> {total}
      </span>
    </motion.div>
  );
}
