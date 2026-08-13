import { useEffect, useRef } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";

// A single draggable / resizable / rotatable image layer (used for the gele and the star).
export default function EditableImage({ src, transform, onChange, isSelected, onSelect, name }) {
  const [img] = useImage(src);
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

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
        <Transformer
          ref={trRef}
          rotateEnabled
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
      )}
    </>
  );
}
