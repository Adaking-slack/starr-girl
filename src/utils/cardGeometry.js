// Shared geometry for the tilted "photo card" look used on the Editor and
// Share pages. The tilt is applied via Konva's own rotation (a Group), not
// a CSS transform — Konva correctly accounts for ancestor rotation when
// hit-testing/dragging, so interactive layers (gele, star) stay perfectly
// under the cursor even while the whole card is visually tilted.

export const CARD_TILT_DEG = 6;
export const CARD_RADIUS = 22;

// Bounding box of a width x height rectangle rotated by CARD_TILT_DEG,
// needed so the Stage is sized large enough that the tilted card's corners
// never get clipped.
export function tiltedBounds(width, height, tiltDeg = CARD_TILT_DEG) {
  const rad = (Math.abs(tiltDeg) * Math.PI) / 180;
  const outerW = width * Math.cos(rad) + height * Math.sin(rad);
  const outerH = width * Math.sin(rad) + height * Math.cos(rad);
  return { outerW, outerH };
}

// Draws a rounded-rect path for Konva's clipFunc (raw canvas 2D API).
export function roundedRectPath(ctx, width, height, radius = CARD_RADIUS) {
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.arcTo(width, 0, width, radius, radius);
  ctx.lineTo(width, height - radius);
  ctx.arcTo(width, height, width - radius, height, radius);
  ctx.lineTo(radius, height);
  ctx.arcTo(0, height, 0, height - radius, radius);
  ctx.lineTo(0, radius);
  ctx.arcTo(0, 0, radius, 0, radius);
  ctx.closePath();
}
