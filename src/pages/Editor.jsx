import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useApp } from "../state/AppContext.jsx";
import EditableImage from "../components/EditableImage.jsx";
import useWindowSize from "../hooks/useWindowSize.js";
import geleSrc from "../assets/gele-placeholder.svg";
import starSrc from "../assets/Star.svg";
import dvdSrc from "../assets/DVD.svg";
import { CARD_TILT_DEG, CARD_RADIUS, tiltedBounds, roundedRectPath } from "../utils/cardGeometry.js";
import "./Editor.css";

export default function Editor() {
  const { photo, gele, setGele, star, setStar, resetComposition } = useApp();
  const navigate = useNavigate();
  const [photoImg] = useImage(photo?.dataUrl);
  const [selected, setSelected] = useState("gele"); // 'gele' | 'star' | null
  const [showGele, setShowGele] = useState(true);
  const [showStar, setShowStar] = useState(true);
  const containerRef = useRef(null);
  const { width: vw, height: vh } = useWindowSize();

  useEffect(() => {
    if (!photo) navigate("/", { replace: true });
  }, [photo, navigate]);

  if (!photo) return null;

  // The card is tilted using Konva's own rotation (a Group around the photo
  // + gele + star), not a CSS transform on the container. Konva's scene
  // graph correctly accounts for ancestor rotation when hit-testing and
  // dragging, so the star/gele stay perfectly under the cursor even while
  // visually tilted — a CSS-rotated container can't offer that, since Konva
  // computes pointer position from the container's untransformed bounding
  // box.
  const { outerW, outerH } = tiltedBounds(photo.width, photo.height);

  // Cap the stage to a comfortable size within the viewport — generous on
  // desktop, still fully contained on small screens.
  const maxStageWidth = Math.min(vw - 64, 720);
  const maxStageHeight = Math.min(vh * 0.6, 760);
  const scale = Math.min(maxStageWidth / outerW, maxStageHeight / outerH, 1);
  const stageWidth = outerW * scale;
  const stageHeight = outerH * scale;

  const deselectAll = (e) => {
    if (e.target === e.target.getStage()) setSelected(null);
  };

  return (
    <div className="editor-page">
      <header className="editor-header">
        <p className="editor-eyebrow">Step 2 of 4</p>
        <h1 className="editor-title">Add your gele + star</h1>
      </header>

      <div className="editor-layer-tabs" style={{ maxWidth: stageWidth }}>
        <button
          className={`layer-tab${selected === "gele" ? " active" : ""}`}
          onClick={() => {
            setShowGele(true);
            setSelected("gele");
          }}
        >
          Gele
        </button>
        <button
          className={`layer-tab${selected === "star" ? " active" : ""}`}
          onClick={() => {
            setShowStar(true);
            setSelected("star");
          }}
        >
          Star
        </button>
      </div>

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
              <Group
                x={outerW / 2}
                y={outerH / 2}
                offsetX={photo.width / 2}
                offsetY={photo.height / 2}
                rotation={CARD_TILT_DEG}
              >
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
                <Group
                  clipFunc={(ctx) => roundedRectPath(ctx, photo.width, photo.height, CARD_RADIUS)}
                >
                  <KonvaImage image={photoImg} width={photo.width} height={photo.height} />
                  {showGele && (
                    <EditableImage
                      src={geleSrc}
                      transform={gele}
                      onChange={setGele}
                      isSelected={selected === "gele"}
                      onSelect={() => setSelected("gele")}
                      name="gele"
                    />
                  )}
                  {showStar && (
                    <EditableImage
                      src={starSrc}
                      transform={star}
                      onChange={setStar}
                      isSelected={selected === "star"}
                      onSelect={() => setSelected("star")}
                      name="star"
                    />
                  )}
                </Group>
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      <div className="editor-actions" style={{ maxWidth: Math.max(stageWidth, 320) }}>
        <button
          className="btn-reset"
          onClick={() => {
            resetComposition(photo.width, photo.height);
            setShowGele(true);
            setShowStar(true);
          }}
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
