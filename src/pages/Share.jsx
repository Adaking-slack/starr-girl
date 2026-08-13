import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Image as KonvaImage, Group, Rect, Text } from "react-konva";
import useImage from "use-image";
import { useApp } from "../state/AppContext.jsx";
import TopFiveSheet from "../components/TopFiveSheet.jsx";
import { tracklist } from "../data/tracklist.js";
import useWindowSize from "../hooks/useWindowSize.js";
import geleSrc from "../assets/gele-placeholder.svg";
import starSrc from "../assets/Star.svg";
import dvdSrc from "../assets/DVD.svg";
import { CARD_TILT_DEG, CARD_RADIUS, tiltedBounds, roundedRectPath } from "../utils/cardGeometry.js";
import "./Share.css";

const TOPFIVE_BLOCK_RATIO = 0.6; // block height as a ratio of card width, when present

export default function Share() {
  const { photo, gele, star, topFive, setTopFive } = useApp();
  const navigate = useNavigate();
  const [photoImg] = useImage(photo?.dataUrl);
  const [geleImg] = useImage(geleSrc);
  const [starImg] = useImage(starSrc);
  const [dvdImg] = useImage(dvdSrc);
  const [sheetOpen, setSheetOpen] = useState(false);
  const stageRef = useRef(null);
  const { width: vw, height: vh } = useWindowSize();

  useEffect(() => {
    if (!photo) navigate("/", { replace: true });
  }, [photo, navigate]);

  const selectedTracks = useMemo(
    () => topFive.map((id) => tracklist.find((t) => t.id === id)).filter(Boolean),
    [topFive]
  );

  if (!photo) return null;

  // Tilted photo card — same Konva-rotation approach as the Editor page (see
  // src/utils/cardGeometry.js): the tilt/shadow/rounding are drawn inside
  // the canvas itself so the exported share image includes them exactly as
  // shown on screen, DVD badge included.
  const { outerW: cardW, outerH: cardH } = tiltedBounds(photo.width, photo.height);
  const hasTopFive = selectedTracks.length === 5;
  const topFiveHeight = hasTopFive ? cardW * TOPFIVE_BLOCK_RATIO : 0;

  const stageContentWidth = cardW;
  const stageContentHeight = cardH + topFiveHeight;

  const maxStageWidth = Math.min(vw - 64, 560);
  const maxStageHeight = Math.min(vh * 0.72, 820);
  const scale = Math.min(maxStageWidth / stageContentWidth, maxStageHeight / stageContentHeight, 1);
  const stageWidth = stageContentWidth * scale;
  const stageHeight = stageContentHeight * scale;

  const dvdSize = cardW * 0.55;
  const pad = cardW * 0.07;
  const headerFont = cardW * 0.05;
  const rowFont = cardW * 0.04;
  const rowGap = cardW * 0.095;

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
        <Stage ref={stageRef} width={stageWidth} height={stageHeight} scaleX={scale} scaleY={scale}>
          <Layer>
            <KonvaImage
              image={dvdImg}
              x={cardW * 0.86}
              y={cardH * 0.5}
              width={dvdSize}
              height={dvdSize}
              offsetX={dvdSize / 2}
              offsetY={dvdSize / 2}
            />

            <Group
              x={cardW / 2}
              y={cardH / 2}
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
              <Group clipFunc={(ctx) => roundedRectPath(ctx, photo.width, photo.height, CARD_RADIUS)}>
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
                <KonvaImage
                  image={starImg}
                  x={star.x}
                  y={star.y}
                  width={star.width}
                  height={star.height}
                  offsetX={star.width / 2}
                  offsetY={star.height / 2}
                  scaleX={star.scaleX}
                  scaleY={star.scaleY}
                  rotation={star.rotation}
                />
              </Group>
            </Group>

            {hasTopFive && (
              <Group x={0} y={cardH}>
                <Rect
                  width={stageContentWidth}
                  height={topFiveHeight}
                  cornerRadius={CARD_RADIUS}
                  fill="#F6F6F7"
                />
                <Text
                  text="MY AYRA STARR"
                  x={pad}
                  y={pad}
                  fontSize={headerFont * 0.46}
                  fontFamily="Nunito, sans-serif"
                  fontStyle="700"
                  fill="#91198F"
                  letterSpacing={1.5}
                />
                <Text
                  text="TOP 5"
                  x={pad}
                  y={pad + headerFont * 0.7}
                  fontSize={headerFont}
                  fontFamily="Comic Neue, sans-serif"
                  fontStyle="bold"
                  fill="#0F0F12"
                />
                {selectedTracks.map((track, i) => (
                  <Text
                    key={track.id}
                    text={`${i + 1}.  ${track.title}`}
                    x={pad}
                    y={pad + headerFont * 1.9 + i * rowGap}
                    fontSize={rowFont}
                    fontFamily="Nunito, sans-serif"
                    fill="#0F0F12"
                  />
                ))}
              </Group>
            )}
          </Layer>
        </Stage>
      </div>

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
