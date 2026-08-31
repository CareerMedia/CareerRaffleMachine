import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './AmbientBackground.css';

interface AmbientBackgroundProps {
  energized?: boolean;
}

export function AmbientBackground({ energized = false }: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`ambient-bg ${energized ? 'ambient-bg--energized' : ''}`}>
      <div className="ambient-bg__base" />
      <motion.div
        className="ambient-bg__bloom ambient-bg__bloom--red"
        animate={reducedMotion ? {} : { x: [0, 20, 0], y: [0, 10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-bg__bloom ambient-bg__bloom--violet"
        animate={reducedMotion ? {} : { x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-bg__bloom ambient-bg__bloom--blue"
        animate={reducedMotion ? {} : { x: [0, 10, 0], y: [0, -10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="ambient-bg__streak ambient-bg__streak--1" />
      <div className="ambient-bg__streak ambient-bg__streak--2" />
      <div className="ambient-bg__particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="ambient-bg__particle"
            style={{
              left: `${(i * 19 + 5) % 100}%`,
              top: `${(i * 27 + 10) % 100}%`,
              animationDelay: `${-(i * 1.4)}s`,
              animationDuration: `${16 + (i % 6) * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
