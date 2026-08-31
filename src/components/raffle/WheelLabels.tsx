import { SEGMENT_COLORS, getLabelPosition, getLabelRotation } from '../../lib/wheelGeometry';
import './WheelLabels.css';

interface WheelLabelsProps {
  names: string[];
  winningIndex?: number | null;
  highlightWinner?: boolean;
}

function getMaxWidth(segmentCount: number): string {
  const angle = 360 / segmentCount;
  const chord = 2 * 0.66 * Math.sin((angle * Math.PI) / 360);
  return `${Math.floor(chord * 100)}%`;
}

export function WheelLabels({
  names,
  winningIndex = null,
  highlightWinner = false,
}: WheelLabelsProps) {
  const count = names.length;
  const maxWidth = getMaxWidth(count);

  return (
    <div className="wheel-labels" aria-hidden="true">
      {names.map((name, index) => {
        const { left, top, midAngle } = getLabelPosition(index, count);
        const labelRotation = getLabelRotation(midAngle);
        const colorDef = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
        const isWinner = highlightWinner && winningIndex === index;

        return (
          <span
            key={`${name}-${index}`}
            className={`wheel-labels__item ${isWinner ? 'wheel-labels__item--winner' : ''}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              maxWidth,
              color: colorDef.light ? 'var(--ink-primary)' : 'var(--text-light)',
              transform: `translate(-50%, -50%) rotate(${labelRotation}deg)`,
            }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}
