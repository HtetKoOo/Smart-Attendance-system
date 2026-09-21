export function mirrorOverlayX(
  canvasWidth: number,
  sourceX: number,
  boxWidth: number,
): number {
  return canvasWidth - sourceX - boxWidth;
}
