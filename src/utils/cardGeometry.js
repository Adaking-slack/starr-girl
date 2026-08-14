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

// The pink dome is a circle mostly hidden behind the card's bottom edge —
// only its top arc shows, like a disc sliding out of a sleeve. Derived from
// the inner dome path in frame.svg (roughly x:50.5→312.3, y:349→472.7):
// diameter ≈ width of that span, so center/radius follow from it. Used to
// clip the glossy highlight layer to the dome's actual circular shape.
// Radius is intentionally a bit smaller than the raw path math — the pink
// area isn't a perfect circle, so the full math radius let the highlight
// poke past the pink into the dark purple ring around it; this keeps it
// safely inside the pink.
export const DOME_CENTER = { x: 181, y: 483 };
export const DOME_RADIUS = 115;

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
