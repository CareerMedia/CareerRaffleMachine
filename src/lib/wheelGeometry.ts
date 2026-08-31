/** Pointer reference: 12 o'clock in wheel coordinates (degrees clockwise from top). */
export const POINTER_REFERENCE = 0;

export const WHEEL_DIAMETER_PX = 800;
export const LABEL_RADIUS_RATIO = 0.66;
export const HUB_RADIUS_RATIO = 0.22;

export const SEGMENT_COLORS = [
  { fill: '#e82c47', light: false },
  { fill: '#f5b52e', light: false },
  { fill: '#793fe8', light: false },
  { fill: '#526feb', light: false },
  { fill: '#ce4caf', light: false },
  { fill: '#f8f0f2', light: true },
  { fill: '#b56ce6', light: false },
  { fill: '#d22030', light: false },
] as const;

export function getSegmentAngle(segmentCount: number): number {
  return 360 / segmentCount;
}

export function getWinnerCenterAngle(index: number, segmentCount: number): number {
  const angle = getSegmentAngle(segmentCount);
  return index * angle + angle / 2;
}

export function getLabelPosition(
  index: number,
  segmentCount: number,
  radiusRatio = LABEL_RADIUS_RATIO,
): { left: number; top: number; midAngle: number } {
  const midAngle = getWinnerCenterAngle(index, segmentCount);
  const rad = (midAngle * Math.PI) / 180;
  const left = 50 + 50 * Math.sin(rad) * radiusRatio;
  const top = 50 - 50 * Math.cos(rad) * radiusRatio;
  return { left, top, midAngle };
}

/**
 * Align text along the wedge bisector — the imaginary line from
 * wheel center through the middle of the segment to the rim.
 * midAngle is clockwise from 12 o'clock; CSS rotation is clockwise from 3 o'clock.
 */
export function getLabelRotation(midAngle: number): number {
  return midAngle - 90;
}

/**
 * Compute final rotation so winner segment center aligns with pointer at 12 o'clock.
 */
export function computeTargetRotation(
  targetIndex: number,
  segmentCount: number,
  currentRotation: number,
  fullSpins: number,
  minSpins = 5,
): number {
  const winnerCenter = getWinnerCenterAngle(targetIndex, segmentCount);
  const alignMod = ((POINTER_REFERENCE - winnerCenter) % 360 + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = fullSpins * 360 + alignMod - currentMod;
  if (delta <= 0) delta += 360;
  if (delta < 360 * minSpins) delta += 360 * minSpins;
  return currentRotation + delta;
}

export function getSegmentIndexAtPointer(rotation: number, segmentCount: number): number {
  const angle = getSegmentAngle(segmentCount);
  const normalized = ((rotation % 360) + 360) % 360;
  const pointerRelative = ((POINTER_REFERENCE - normalized) % 360 + 360) % 360;
  return Math.floor(pointerRelative / angle) % segmentCount;
}

export function verifyWinnerAlignment(
  rotation: number,
  targetIndex: number,
  segmentCount: number,
): boolean {
  return getSegmentIndexAtPointer(rotation, segmentCount) === targetIndex;
}
