import { useEffect, useRef } from "react";
import { Image as KonvaImage, Transformer, Shape } from "react-konva";

function angleDeg(cx, cy, px, py) {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}

// How far outward from the box's own edge the rotate handle extends. The
// handle's inner edge sits flush against the box (no gap), so holding and
// turning the visible boundary box itself is what rotates it — the padding
// is just extra touch-target margin beyond that edge, generous enough for a
// finger on mobile.
const ROTATE_HANDLE_THICKNESS = 32;

// Draws a rectangular "frame" (a rect with a rect-shaped hole in it) into a
// Konva Shape's context: an outer rect and an inner rect wound in opposite
// directions so the fill only covers the band between them, leaving the
// interior (over the image) untouched by hit-testing.
function drawFrame(ctx, innerW, innerH, thickness) {
  const ow = innerW / 2 + thickness;
  const oh = innerH / 2 + thickness;
  const iw = innerW / 2;
  const ih = innerH / 2;
  ctx.beginPath();
  ctx.moveTo(-ow, -oh);
  ctx.lineTo(ow, -oh);
  ctx.lineTo(ow, oh);
  ctx.lineTo(-ow, oh);
  ctx.closePath();
  ctx.moveTo(-iw, -ih);
  ctx.lineTo(-iw, ih);
  ctx.lineTo(iw, ih);
  ctx.lineTo(iw, -ih);
  ctx.closePath();
}

// A single draggable / resizable / rotatable image layer (used for the gele).
// `image` is an already-loaded HTMLImageElement (or undefined while it's
// still loading) — loaded by the caller via useImage so it's fetched once
// and the caller can show its own loading state alongside it.
//
// Rotation is a custom handle shaped as a frame flush against the box's own
// boundary (see drawFrame above), not Konva Transformer's default single
// small handle-on-a-line — that one tiny hit target was hard to grab
// precisely and only worked from that one spot. The frame lets you rotate
// by holding and turning the boundary box itself, from any edge or corner
// that isn't already a resize anchor — important on mobile, where a thin
// ring far from the box is easy to miss entirely.
export default function EditableImage({ image, transform, onChange, isSelected, onSelect, name }) {
  const shapeRef = useRef(null);
  const trRef = useRef(null);
  const rotateStartRef = useRef(null);

  useEffect(() => {
    // Re-attach on every transform change too, not just on selection — after
    // a move/rotate/resize triggers a React re-render, react-konva's
    // reconciliation can leave the Transformer's internal node binding
    // stale (still watching the pre-update node state), silently breaking
    // the next resize attempt. Re-registering is cheap and idempotent.
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, transform]);

  const displayW = transform.width * transform.scaleX;
  const displayH = transform.height * transform.scaleY;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={transform.x}
        y={transform.y}
        width={transform.width}
        height={transform.height}
        offsetX={transform.width / 2}
        offsetY={transform.height / 2}
        scaleX={transform.scaleX}
        scaleY={transform.scaleY}
        rotation={transform.rotation}
        draggable
        name={name}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ ...transform, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          onChange({
            ...transform,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          });
        }}
      />

      {isSelected && (
        <>
          <Shape
            x={transform.x}
            y={transform.y}
            rotation={transform.rotation}
            sceneFunc={(ctx, shapeNode) => {
              drawFrame(ctx, displayW, displayH, ROTATE_HANDLE_THICKNESS);
              ctx.fillStrokeShape(shapeNode);
            }}
            fill="rgba(123, 47, 247, 0.06)"
            stroke="rgba(123, 47, 247, 0.35)"
            strokeWidth={1}
            dash={[4, 5]}
            draggable
            dragBoundFunc={() => ({ x: transform.x, y: transform.y })}
            onDragStart={(e) => {
              const stage = e.target.getStage();
              const pointer = stage.getPointerPosition();
              const center = shapeRef.current.getAbsolutePosition();
              rotateStartRef.current = {
                angle: angleDeg(center.x, center.y, pointer.x, pointer.y),
                rotation: transform.rotation,
              };
            }}
            onDragMove={(e) => {
              if (!rotateStartRef.current) return;
              const stage = e.target.getStage();
              const pointer = stage.getPointerPosition();
              const center = shapeRef.current.getAbsolutePosition();
              const angle = angleDeg(center.x, center.y, pointer.x, pointer.y);
              const delta = angle - rotateStartRef.current.angle;
              shapeRef.current.rotation(rotateStartRef.current.rotation + delta);
              shapeRef.current.getLayer().batchDraw();
            }}
            onDragEnd={() => {
              onChange({ ...transform, rotation: shapeRef.current.rotation() });
              rotateStartRef.current = null;
            }}
          />
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) return oldBox;
              return newBox;
            }}
          />
        </>
      )}
    </>
  );
}
