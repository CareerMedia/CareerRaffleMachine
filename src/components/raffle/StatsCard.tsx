import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import './StatsCard.css';

interface StatsCardProps {
  value: number;
  label: string;
  dimmed?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return <span ref={ref} className="stats-card__value">{value.toLocaleString()}</span>;
}

export function StatsCard({ value, label, dimmed = false }: StatsCardProps) {
  return (
    <motion.div
      className={`stats-card ${dimmed ? 'stats-card--dimmed' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: dimmed ? 0.4 : 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatedNumber value={value} />
      <span className="stats-card__label">{label}</span>
    </motion.div>
  );
}
