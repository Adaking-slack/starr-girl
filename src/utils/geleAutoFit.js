// Computes the initial gele transform from detected face landmarks.
//
// The gele asset is much bigger than the face it sits on, so we never do
// `gele.center = face.center` — instead a calibrated anchor point *inside*
// the gele artwork (roughly where its inner opening sits) is aligned to the
// detected forehead/head position. See GELE_ANCHOR below.

// Fraction across (x) / down (y) the gele artwork's own bounding box where
// the wearer's forehead should land — calibrated by eye against the actual
// transparent gele asset (src/assets/gele-placeholder.svg): the fabric's
// inner opening sits a bit above center, roughly two-thirds of the way down.
export const GELE_ANCHOR = { x: 0.5, y: 0.68 };

// How much wider than the detected head the gele should render — the gele
// wraps well beyond the jawline (hair, ears, volume of the fabric).
const GELE_WIDTH_TO_HEAD_RATIO = 2.35;
// Jaw-point distance undershoots true head width (it excludes hair/ears).
const HEAD_WIDTH_FUDGE = 1.7;

function avg(points) {
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rotatePoint(x, y, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// landmarks: 68-point array from face-api.js (iBUG 300W layout), in the
// photo's natural pixel space. geleNaturalSize: { width, height } of the
// gele artwork's own source image. Returns a transform in the same
// {x, y, width, height, scaleX, scaleY, rotation} shape used elsewhere.
export function computeGeleTransformFromFace(landmarks, geleNaturalSize) {
  const rightEye = avg(landmarks.slice(36, 42));
  const leftEye = avg(landmarks.slice(42, 48));
  const browCenter = avg(landmarks.slice(17, 27));
  const chin = landmarks[8];
  const jawLeft = landmarks[0];
  const jawRight = landmarks[16];

  // Head tilt, from the eye line. Only ever applied to the gele.
  const rotation = clamp(
    (Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * 180) / Math.PI,
    -25,
    25
  );

  // Forehead ≈ extend up from the eyebrow line by half the brow→chin
  // distance (vector-based, so it stays correct under head tilt).
  const forehead = {
    x: browCenter.x + (browCenter.x - chin.x) * 0.5,
    y: browCenter.y + (browCenter.y - chin.y) * 0.5,
  };

  const headWidth = dist(jawLeft, jawRight) * HEAD_WIDTH_FUDGE;
  const width = headWidth * GELE_WIDTH_TO_HEAD_RATIO;
  const height = width * (geleNaturalSize.height / geleNaturalSize.width);

  // Where the anchor sits relative to the gele's own center, before rotation.
  const anchorLocalX = (GELE_ANCHOR.x - 0.5) * width;
  const anchorLocalY = (GELE_ANCHOR.y - 0.5) * height;
  const worldOffset = rotatePoint(anchorLocalX, anchorLocalY, rotation);

  return {
    x: forehead.x - worldOffset.x,
    y: forehead.y - worldOffset.y,
    width,
    height,
    scaleX: 1,
    scaleY: 1,
    rotation,
  };
}

export function loadImageNaturalSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}
