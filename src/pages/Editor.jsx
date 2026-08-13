import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useApp } from "../state/AppContext.jsx";
import EditableImage from "../components/EditableImage.jsx";
import useWindowSize from "../hooks/useWindowSize.js";
import geleSrc from "../assets/gele-placeholder.webp";
import dvdSrc from "../assets/DVD.svg";
import { CARD_RADIUS, roundedRectPath } from "../utils/cardGeometry.js";
import "./Editor.css";

// Breathing room around the photo card so the gele's resize/rotate handles
// always have somewhere to render — without this, a gele sized close to the
// photo's own width (common on tight mobile portrait crops) pushes its
// handles right to (or past) the photo's edge, where they'd otherwise be
// clipped away along with the photo. The margin blends into the page: the
// Stage has no background of its own and .editor-page is solid white.
const STAGE_MARGIN_RATIO = 0.12;

export default function Editor() {
  const { photo, gele, setGele, resetComposition } = useApp();
  const navigate = useNavigate();
  const [photoImg] = useImage(photo?.dataUrl);
  const [geleImg, geleStatus] = useImage(geleSrc);
  const [selected, setSelected] = useState(true);
  const containerRef = useRef(null);
  const { width: vw, height: vh } = useWindowSize();

  useEffect(() => {
    if (!photo) navigate("/", { replace: true });
  }, [photo, navigate]);

  if (!photo) return null;

  // The photo is fixed: it is drawn once at its natural bounds and never
  // transformed. The gele is a fully independent overlay with its own
  // (x, y, scale, rotation) — dragging/resizing/rotating it only ever
  // updates that one object's transform, never the photo's.
  const marginX = photo.width * STAGE_MARGIN_RATIO;
  const marginY = photo.height * STAGE_MARGIN_RATIO;
  const contentWidth = photo.width + marginX * 2;
  const contentHeight = photo.height + marginY * 2;

  const maxStageWidth = Math.min(vw - 64, 720);
  const maxStageHeight = Math.min(vh * 0.6, 760);
  const scale = Math.min(maxStageWidth / contentWidth, maxStageHeight / contentHeight, 1);
  const stageWidth = contentWidth * scale;
  const stageHeight = contentHeight * scale;

  const deselectAll = (e) => {
    if (e.target === e.target.getStage()) setSelected(false);
  };

  return (
    <div className="editor-page">
      <header className="editor-header">
        <p className="editor-eyebrow">Step 2 of 4</p>
        <h1 className="editor-title">Add your gele</h1>
      </header>

      <div className="editor-card-wrap">
        <img className="editor-card-decor" src={dvdSrc} alt="" aria-hidden="true" />
        <div className="editor-stage-wrap" ref={containerRef}>
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={deselectAll}
            onTouchStart={deselectAll}
            className="editor-stage"
          >
            <Layer>
              <Group x={marginX} y={marginY}>
                <Rect
                  width={photo.width}
                  height={photo.height}
                  cornerRadius={CARD_RADIUS}
                  fill="#fff"
                  shadowColor="rgba(15,15,18,0.4)"
                  shadowBlur={44}
                  shadowOffsetY={20}
                  shadowOpacity={1}
                />
                {/* Layer 1 — the user's photo. Fixed: no x/y/rotation/scale
                    props, ever. Clipped to the card's rounded corners —
                    this clip applies to the photo's pixels only. */}
                <Group clipFunc={(ctx) => roundedRectPath(ctx, photo.width, photo.height, CARD_RADIUS)}>
                  <KonvaImage image={photoImg} width={photo.width} height={photo.height} />
                </Group>
                {/* Layer 2 — the gele. Independent overlay; only its own
                    transform object changes when the user drags/resizes/
                    rotates it. Deliberately outside the clip above, so its
                    resize handles and rotate ring stay reachable even when
                    they extend past the photo's edge into the margin. */}
                <EditableImage
                  image={geleImg}
                  transform={gele}
                  onChange={setGele}
                  isSelected={selected}
                  onSelect={() => setSelected(true)}
                  name="gele"
                />
              </Group>
            </Layer>
          </Stage>
          {geleStatus === "loading" && (
            <div className="editor-loading-overlay">
              <span className="editor-loading-spinner" aria-hidden="true" />
              Loading asset...
            </div>
          )}
        </div>
      </div>

      <div className="editor-actions" style={{ maxWidth: Math.max(stageWidth, 320) }}>
        <button
          className="btn-reset"
          onClick={() => resetComposition(photo.width, photo.height, photo.dataUrl)}
        >
          Reset
        </button>
        <button className="btn-view" onClick={() => navigate("/share")}>
          View
        </button>
      </div>
    </div>
  );
}
