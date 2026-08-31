import { SEGMENT_COLORS } from '../../lib/wheelGeometry';

interface WheelSegmentProps {
  index: number;
  total: number;
  radius: number;
  highlight?: boolean;
  dimmed?: boolean;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const [x1, y1] = polarToCartesian(cx, cy, r, endAngle);
  const [x2, y2] = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2} Z`;
}

export function WheelSegment({
  index,
  total,
  radius,
  highlight = false,
  dimmed = false,
}: WheelSegmentProps) {
  const angle = 360 / total;
  const startAngle = index * angle;
  const endAngle = (index + 1) * angle;
  const colorDef = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
  const innerR = radius * 0.2;

  const path = describeArc(0, 0, radius, startAngle, endAngle);

  return (
    <g
      className={`wheel-segment ${highlight ? 'wheel-segment--highlight' : ''} ${
        dimmed ? 'wheel-segment--dimmed' : ''
      }`}
    >
      <defs>
        <radialGradient
          id={`seg-grad-${index}`}
          cx="50%"
          cy="30%"
          r="75%"
        >
          <stop offset="0%" stopColor={colorDef.fill} stopOpacity={highlight ? 1 : 0.92} />
          <stop offset="100%" stopColor={colorDef.fill} stopOpacity={highlight ? 0.88 : 0.78} />
        </radialGradient>
      </defs>
      <path
        d={path}
        fill={`url(#seg-grad-${index})`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.2}
      />
      <path
        d={describeArc(0, 0, innerR, startAngle, endAngle)}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.5}
      />
    </g>
  );
}
