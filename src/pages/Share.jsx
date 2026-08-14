import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Image as KonvaImage, Group, Rect, Text } from "react-konva";
import useImage from "use-image";
import { useApp } from "../state/AppContext.jsx";
import TopFiveSheet from "../components/TopFiveSheet.jsx";
import { tracklist } from "../data/tracklist.js";
import useWindowSize from "../hooks/useWindowSize.js";
import geleSrc from "../assets/gele-placeholder.webp";
import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  FRAME_WINDOW,
  FRAME_DOME_TEXT,
  domeClipPath,
  coverFit,
  clampPhotoOffset,
  zoomPhotoAt,
  roundedRectPath,
} from "../utils/cardGeometry.js";
import "./Share.css";

const FRAME_SRC = "/Image/frame.svg";
const MAX_ZOOM_FACTOR = 3; // relative to the cover-fit minimum

export default function Share() {
  const { photo, gele, photoAdjust, setPhotoAdjust, topFive, setTopFive } = useApp();
  const navigate = useNavigate();
  const [photoImg] = useImage(photo?.dataUrl);
  const [geleImg, geleStatus] = useImage(geleSrc);
  const [frameImg] = useImage(FRAME_SRC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const stageRef = useRef(null);
  const photoGroupRef = useRef(null);
  const pinchRef = useRef(null); // { dist, scale } snapshot at gesture start
  const { width: vw, height: vh } = useWindowSize();

  useEffect(() => {
    if (!photo) navigate("/", { replace: true });
  }, [photo, navigate]);

  const selectedTracks = useMemo(
    () => topFive.map((id) => tracklist.find((t) => t.id === id)).filter(Boolean),
    [topFive]
  );

  if (!photo) return null;

  const hasTopFive = selectedTracks.length === 5;

  // The frame (public/Image/frame.svg) is a fixed-proportion asset — border,
  // dome, and both sparkle stars are baked into one image — so it's never
  // stretched to match a photo's aspect ratio. Instead the photo is
  // cover-fit (center-cropped) into the frame's own window by default, and
  // the user can drag to reposition / scroll or pinch to zoom from there —
  // it can never zoom out far enough to reveal empty space at the edges.
  const maxStageWidth = Math.min(vw - 64, 480);
  const maxStageHeight = Math.min(vh * 0.68, 700);
  const displayScale = Math.min(maxStageWidth / FRAME_WIDTH, maxStageHeight / FRAME_HEIGHT, 1);
  const stageWidth = FRAME_WIDTH * displayScale;
  const stageHeight = FRAME_HEIGHT * displayScale;

  const baseFit = coverFit(photo.width, photo.height, FRAME_WINDOW.width, FRAME_WINDOW.height);
  const adjust = photoAdjust || {
    x: baseFit.offsetX,
    y: baseFit.offsetY,
    scale: baseFit.scale,
  };
  const minZoom = baseFit.scale;
  const maxZoom = baseFit.scale * MAX_ZOOM_FACTOR;

  const trackText = selectedTracks.map((t) => t.title).join("     ");

  // Pointer/touch positions come back in the window's own local coordinate
  // space (same units as adjust.x/y) so they can feed straight into the
  // pan/zoom helpers.
  const toWindowLocal = (stageX, stageY) => ({
    x: stageX - FRAME_WINDOW.x,
    y: stageY - FRAME_WINDOW.y,
  });

  const applyZoom = (newScaleRaw, point) => {
    const newScale = Math.min(maxZoom, Math.max(minZoom, newScaleRaw));
    const next = zoomPhotoAt(
      adjust.x,
      adjust.y,
      adjust.scale,
      point,
      newScale,
      photo.width,
      photo.height,
      FRAME_WINDOW.width,
      FRAME_WINDOW.height
    );
    setPhotoAdjust({ x: next.x, y: next.y, scale: newScale });
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const point = toWindowLocal(pointer.x, pointer.y);
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    applyZoom(adjust.scale * (1 + dir * 0.08), point);
  };

  const handleTouchStart = (e) => {
    if (e.evt.touches.length >= 2) {
      photoGroupRef.current?.stopDrag();
      pinchRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    const touches = e.evt.touches;
    if (touches.length !== 2) return;
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const rect = stage.container().getBoundingClientRect();
    const [t0, t1] = touches;
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    const midClientX = (t0.clientX + t1.clientX) / 2;
    const midClientY = (t0.clientY + t1.clientY) / 2;
    const point = toWindowLocal(
      (midClientX - rect.left) / displayScale,
      (midClientY - rect.top) / displayScale
    );

    if (!pinchRef.current) {
      pinchRef.current = { dist, scale: adjust.scale };
      return;
    }
    const ratio = dist / pinchRef.current.dist;
    applyZoom(pinchRef.current.scale * ratio, point);
  };

  const handleTouchEnd = (e) => {
    if (e.evt.touches.length < 2) pinchRef.current = null;
  };

  const handleDragMove = (e) => {
    const node = e.target;
    const clamped = clampPhotoOffset(
      node.x(),
      node.y(),
      adjust.scale,
      photo.width,
      photo.height,
      FRAME_WINDOW.width,
      FRAME_WINDOW.height
    );
    node.position(clamped);
  };

  const handleDragEnd = (e) => {
    setPhotoAdjust({ x: e.target.x(), y: e.target.y(), scale: adjust.scale });
  };

  const handleExport = async () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });

    // Try native share first (mobile), fall back to download.
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "my-ayra-starr.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Ayra Starr",
          text: "This is my Starr look 🌟",
        });
        return;
      }
    } catch {
      // fall through to download
    }
    const link = document.createElement("a");
    link.download = "my-ayra-starr.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="share-page">
      <header className="share-header">
        <p className="share-eyebrow">Step 3 of 4</p>
        <h1 className="share-title">You are a starr</h1>
      </header>

      <div className="share-card-wrap">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={displayScale}
          scaleY={displayScale}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Layer>
            {/* Photo + gele, cover-fit cropped into the frame's window.
                Draggable to pan; wheel/pinch to zoom (see handlers above). */}
            <Group
              x={FRAME_WINDOW.x}
              y={FRAME_WINDOW.y}
              clipFunc={(ctx) => roundedRectPath(ctx, FRAME_WINDOW.width, FRAME_WINDOW.height, 0)}
            >
              <Group
                ref={photoGroupRef}
                x={adjust.x}
                y={adjust.y}
                scaleX={adjust.scale}
                scaleY={adjust.scale}
                draggable
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                <KonvaImage image={photoImg} width={photo.width} height={photo.height} />
                <KonvaImage
                  image={geleImg}
                  x={gele.x}
                  y={gele.y}
                  width={gele.width}
                  height={gele.height}
                  offsetX={gele.width / 2}
                  offsetY={gele.height / 2}
                  scaleX={gele.scaleX}
                  scaleY={gele.scaleY}
                  rotation={gele.rotation}
                />
              </Group>
            </Group>

            {/* Border, dome, and both sparkle stars — all baked into one asset.
                frame.svg's own canvas (360×697) is taller than its visible
                shapes (which stop around y=498) — crop to just that region
                so it isn't stretched/squished into the wrong aspect ratio. */}
            <KonvaImage
              image={frameImg}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              crop={{ x: 0, y: 0, width: FRAME_WIDTH, height: FRAME_HEIGHT }}
              listening={false}
            />

            {/* A soft diagonal sheen on the dome — the "glossy vinyl/DVD
                peeking out of its case" illusion. Clipped to the dome's
                actual pixel-sampled shape (see domeClipPath) — the dome is
                pointier than a circle/ellipse at the top, so approximating
                it let the sheen poke past the pink into the purple ring. */}
            <Group clipFunc={domeClipPath} listening={false}>
              <Rect
                x={181}
                y={410}
                width={340}
                height={100}
                offsetX={170}
                offsetY={50}
                rotation={-35}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: 100 }}
                fillLinearGradientColorStops={[
                  0, "rgba(255,255,255,0)",
                  0.5, "rgba(255,255,255,0.22)",
                  1, "rgba(255,255,255,0)",
                ]}
              />
            </Group>

            {hasTopFive && (
              <>
                <Text
                  text="My starr 5"
                  x={FRAME_DOME_TEXT.x}
                  y={FRAME_DOME_TEXT.headingY}
                  width={FRAME_DOME_TEXT.width}
                  align="center"
                  fontSize={17}
                  fontFamily="Comic Neue, sans-serif"
                  fontStyle="bold"
                  fill="#0F0F12"
                  listening={false}
                />
                <Text
                  text={trackText}
                  x={FRAME_DOME_TEXT.x}
                  y={FRAME_DOME_TEXT.listY}
                  width={FRAME_DOME_TEXT.width}
                  align="center"
                  wrap="word"
                  lineHeight={1.9}
                  fontSize={12}
                  fontFamily="Nunito, sans-serif"
                  fontStyle="600"
                  fill="#0F0F12"
                  listening={false}
                />
              </>
            )}
          </Layer>
        </Stage>
        {geleStatus === "loading" && (
          <div className="share-loading-overlay">
            <span className="share-loading-spinner" aria-hidden="true" />
            Loading asset...
          </div>
        )}
      </div>

      <p className="share-hint">Drag to reposition · scroll or pinch to zoom</p>

      <div className="share-actions" style={{ maxWidth: Math.max(stageWidth, 360) }}>
        <button className="btn-reset" onClick={() => setSheetOpen(true)}>
          {hasTopFive ? "Edit your top 5" : "Add your top 5"}
        </button>
        <button className="btn-view" onClick={handleExport}>
          Share your star
        </button>
      </div>

      <TopFiveSheet
        open={sheetOpen}
        initialSelected={topFive}
        onClose={() => setSheetOpen(false)}
        onConfirm={(selected) => {
          setTopFive(selected);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}
