import { motion } from 'framer-motion';
import './WheelPointer.css';

interface WheelPointerProps {
  tick?: number;
  active?: boolean;
}

export function WheelPointer({ tick = 0, active = false }: WheelPointerProps) {
  return (
    <div className="wheel-pointer">
      <motion.div
        className={`wheel-pointer__body ${active ? 'wheel-pointer--active' : ''}`}
        animate={{ y: tick % 2 === 0 ? 0 : 3 }}
        transition={{
          type: 'spring',
          stiffness: 900,
          damping: 14,
          mass: 0.25,
        }}
      >
        <div className="wheel-pointer__gem">
          <div className="wheel-pointer__facet wheel-pointer__facet--left" />
          <div className="wheel-pointer__facet wheel-pointer__facet--center" />
          <div className="wheel-pointer__facet wheel-pointer__facet--right" />
          <div className="wheel-pointer__glow" />
        </div>
        <div className="wheel-pointer__tip" />
      </motion.div>
    </div>
  );
}
