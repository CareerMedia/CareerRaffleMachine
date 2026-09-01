import { Users, Gift, Sparkles } from 'lucide-react';
import './StatusCapsule.css';

interface StatusCapsuleProps {
  inTheRunning: number;
  prizesRemaining: number;
  currentDraw: number;
  totalPrizes: number;
  dimmed?: boolean;
  syncing?: boolean;
}

function StatBlock({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="status-capsule__block">
      <Icon className="status-capsule__icon" size={16} strokeWidth={2} />
      <div className="status-capsule__text">
        <span className="status-capsule__value">{value}</span>
        <span className="status-capsule__label">{label}</span>
      </div>
    </div>
  );
}

export function StatusCapsule({
  inTheRunning,
  prizesRemaining,
  currentDraw,
  totalPrizes,
  dimmed = false,
  syncing = false,
}: StatusCapsuleProps) {
  const drawPadded = String(currentDraw).padStart(2, '0');

  return (
    <div
      className={`status-capsule ${dimmed ? 'status-capsule--dimmed' : ''}${
        syncing ? ' status-capsule--syncing' : ''
      }`}
    >
      <StatBlock
        icon={Users}
        value={inTheRunning.toLocaleString()}
        label="IN THE RUNNING"
      />
      <span className="status-capsule__divider" aria-hidden="true" />
      <StatBlock
        icon={Gift}
        value={String(prizesRemaining)}
        label="PRIZES TO BE WON"
      />
      <span className="status-capsule__divider" aria-hidden="true" />
      <StatBlock
        icon={Sparkles}
        value={`${drawPadded} / ${totalPrizes}`}
        label="CURRENT DRAW"
      />
    </div>
  );
}
