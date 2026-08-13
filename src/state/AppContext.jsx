import { createContext, useContext, useState, useCallback } from "react";
import { detectFaceLandmarks } from "../utils/faceDetect.js";
import { computeGeleTransformFromFace, loadImageNaturalSize } from "../utils/geleAutoFit.js";
import { FRAME_WINDOW, coverFit } from "../utils/cardGeometry.js";
import geleSrc from "../assets/gele-placeholder.svg";

const AppContext = createContext(null);

const DEFAULT_GELE = { x: 200, y: 130, scaleX: 1, scaleY: 1, rotation: 0, width: 400, height: 260 };

// Heuristic fallback when face detection isn't available (model load
// failure, no face found, etc) — a reasonable centered placement.
function heuristicGele(imgWidth, imgHeight) {
  return {
    ...DEFAULT_GELE,
    x: imgWidth / 2,
    y: imgHeight * 0.22,
    width: imgWidth * 0.7,
    height: imgWidth * 0.7 * (260 / 400),
    rotation: 0,
  };
}

// The Share page's frame has a fixed-size photo window — this is the
// default pan/zoom (cover-fit, centered) before the user adjusts anything.
function defaultPhotoAdjust(imgWidth, imgHeight) {
  const fit = coverFit(imgWidth, imgHeight, FRAME_WINDOW.width, FRAME_WINDOW.height);
  return { x: fit.offsetX, y: fit.offsetY, scale: fit.scale };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function AppProvider({ children }) {
  const [photo, setPhoto] = useState(null); // { dataUrl, width, height }
  const [gele, setGele] = useState(DEFAULT_GELE);
  const [photoAdjust, setPhotoAdjust] = useState(null); // { x, y, scale } — pan/zoom inside the Share frame's window
  const [topFive, setTopFive] = useState([]); // array of track ids, in chosen order

  // Runs face detection against the photo (given as a data URL) and places
  // the gele accordingly, falling back to a centered heuristic if no face
  // is found. Always resolves — never leaves the gele unset. Also resets
  // the Share-frame photo pan/zoom back to its centered cover-fit default.
  const resetComposition = useCallback(async (imgWidth, imgHeight, dataUrl) => {
    setGele(heuristicGele(imgWidth, imgHeight)); // immediate, reasonable default
    setPhotoAdjust(defaultPhotoAdjust(imgWidth, imgHeight));

    if (!dataUrl) return;
    try {
      const imgEl = await loadImage(dataUrl);
      const landmarks = await detectFaceLandmarks(imgEl);
      if (!landmarks) return;

      const geleSize = await loadImageNaturalSize(geleSrc);
      setGele(computeGeleTransformFromFace(landmarks, geleSize));
    } catch (err) {
      console.warn("Auto-fit failed, keeping default gele placement.", err);
    }
  }, []);

  const value = {
    photo,
    setPhoto,
    gele,
    setGele,
    photoAdjust,
    setPhotoAdjust,
    topFive,
    setTopFive,
    resetComposition,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
