// src/utils/clampUtil.ts

export function generateClamp(
  minSizePx: number,
  maxSizePx: number,
  minWidthPx: number,
  maxWidthPx: number
): string {
  const slope = ((maxSizePx - minSizePx) / (maxWidthPx - minWidthPx)) * 100;
  const basePx = minSizePx - slope * (minWidthPx / 100);

  const minRem = (minSizePx / 16).toFixed(3);
  const maxRem = (maxSizePx / 16).toFixed(3);
  const baseRem = (basePx / 16).toFixed(3);
  const slopeStr = slope.toFixed(3);

  return `clamp(${minRem}rem, ${slopeStr}vw + ${baseRem}rem, ${maxRem}rem)`;
}