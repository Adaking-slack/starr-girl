import { useEffect, useState } from "react";

// Tracks viewport size so canvas-based layers (Konva stages) can be resized
// responsively — Konva needs explicit pixel width/height, it can't rely on
// CSS alone the way regular DOM layout can.
export default function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 480,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    let frame = null;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
        frame = null;
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return size;
}
