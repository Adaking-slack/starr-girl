import { useEffect, useRef } from "react";
import { Image as KonvaImage, Transformer, Ring } from "react-konva";
import useImage from "use-image";

function angleDeg(cx, cy, px, py) {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}

// A single draggable / resizable / rotatable image layer (used for the gele).
//
// Rotation is a custom full-ring handle (drag anywhere in a circle around
// the shape), not Konva Transformer's default single small handle-on-a-line
// — that one tiny hit target was hard to grab precisely and only worked
// from that one spot. The ring lets you start rotating from any angle
// around the shape, wherever's convenient.
export default function EditableImage({ src, transform, onChange, isSelected, onSelect, name }) {
  const [img] = useImage(src);
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
  const ringInner = Math.hypot(displayW, displayH) / 2 + 10;
  const ringOuter = ringInner + 34;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
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
          <Ring
            x={transform.x}
            y={transform.y}
            innerRadius={ringInner}
            outerRadius={ringOuter}
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
