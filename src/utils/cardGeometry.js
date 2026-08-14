// Shared geometry for the photo-card treatments used on the Editor and
// Share pages.

export const CARD_RADIUS = 22;

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

// Native geometry of public/Image/frame.svg, used on the Share page. The
// frame is a fixed-proportion asset — its border/dome/stars are baked into
// one image — so the photo window's own aspect ratio is fixed too; photos
// are cover-fit into it rather than the frame being stretched to match
// arbitrary photo dimensions.
//
// The SVG's own canvas is 360×697, but its visible shapes stop around
// y=498.38 (the rest is empty margin) — FRAME_WIDTH/FRAME_HEIGHT describe
// just the visible region; callers should crop the source image to this
// box (not scale the whole 697-tall canvas into it) to avoid squishing it.
export const FRAME_WIDTH = 360;
export const FRAME_HEIGHT = 498.38;

export const FRAME_WINDOW = {
  x: 43.7383,
  y: 54.4852,
  width: 316.262 - 43.7383,
  height: 443.894 - 54.4852,
};

// The dome's readable text region — below the "My starr 5" heading, above
// the pink dome's inner curve. Tuned empirically against the rendered frame.
export const FRAME_DOME_TEXT = {
  x: 68,
  y: 378,
  width: 226,
  headingY: 388,
  listY: 415,
};

// Precise boundary of the pink dome, pixel-sampled from the actual rendered
// frame.svg (not the raw bezier path — the dome is pointier at the top than
// a circle/ellipse, so approximating it with either let the highlight clip
// poke past the pink into the dark purple ring around it). Left edge points
// run top→bottom; right edge points run top→bottom too, mirroring left.
const DOME_LEFT_EDGE = [
  [164.25, 350], [141, 355], [127.25, 360], [108.25, 370], [94.5, 380],
  [84, 390], [75.25, 400], [68.5, 410], [63, 420], [58.5, 430],
  [55.25, 440], [52.5, 450], [51.25, 460], [50.5, 470],
];
const DOME_RIGHT_EDGE = [
  [198, 350], [221.25, 355], [235, 360], [254, 370], [267.75, 380],
  [278.25, 390], [287, 400], [293.75, 410], [299.25, 420], [303.75, 430],
  [307.25, 440], [309.75, 450], [311, 460], [311.75, 470],
];
const DOME_CENTER = { x: 181, y: 460 };
// Pull every boundary point a few px in toward the center — a fixed safety
// margin so anti-aliasing at the pink/purple edge never shows through.
const DOME_MARGIN = 4;

function inset([x, y], margin) {
  const dx = x - DOME_CENTER.x;
  const dy = y - DOME_CENTER.y;
  const dist = Math.hypot(dx, dy) || 1;
  const scale = Math.max(0, (dist - margin) / dist);
  return [DOME_CENTER.x + dx * scale, DOME_CENTER.y + dy * scale];
}

// Draws a clip path tightly (and safely) inside the pink dome's actual
// shape — used to keep decorative layers like the glossy highlight from
// ever bleeding onto the dark purple ring around it.
export function domeClipPath(ctx) {
  const left = DOME_LEFT_EDGE.map((p) => inset(p, DOME_MARGIN));
  const right = DOME_RIGHT_EDGE.map((p) => inset(p, DOME_MARGIN));
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const [x, y] of left.slice(1)) ctx.lineTo(x, y);
  ctx.lineTo(right[right.length - 1][0], right[right.length - 1][1]);
  for (let i = right.length - 2; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
}

// Standard "background-size: cover" fit: scales (srcW, srcH) up to
// completely fill (dstW, dstH), centered, cropping the overflow.
export function coverFit(srcW, srcH, dstW, dstH) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const scaledW = srcW * scale;
  const scaledH = srcH * scale;
  return {
    scale,
    offsetX: (dstW - scaledW) / 2,
    offsetY: (dstH - scaledH) / 2,
  };
}

// Keeps a cover-fit photo's pan offset from ever revealing empty space
// inside the window it's clipped to — the offset's valid range shrinks as
// scale grows, so this needs recomputing on every drag/zoom step.
export function clampPhotoOffset(offsetX, offsetY, scale, srcW, srcH, dstW, dstH) {
  const minX = dstW - srcW * scale;
  const minY = dstH - srcH * scale;
  return {
    x: Math.min(0, Math.max(minX, offsetX)),
    y: Math.min(0, Math.max(minY, offsetY)),
  };
}

// Changes scale while keeping the photo point under `point` (in the same
// local space as offsetX/offsetY) visually fixed — the standard "zoom to
// cursor/pinch point" formula — then re-clamps so the result stays valid.
export function zoomPhotoAt(offsetX, offsetY, scale, point, newScale, srcW, srcH, dstW, dstH) {
  const localX = (point.x - offsetX) / scale;
  const localY = (point.y - offsetY) / scale;
  const rawX = point.x - localX * newScale;
  const rawY = point.y - localY * newScale;
  return clampPhotoOffset(rawX, rawY, newScale, srcW, srcH, dstW, dstH);
}
