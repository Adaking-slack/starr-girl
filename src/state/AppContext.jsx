import { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

const DEFAULT_GELE = { x: 200, y: 130, scaleX: 1, scaleY: 1, rotation: 0, width: 400, height: 260 };
const DEFAULT_STAR = { x: 300, y: 220, scaleX: 1, scaleY: 1, rotation: 0, width: 120, height: 120 };

export function AppProvider({ children }) {
  const [photo, setPhoto] = useState(null); // { dataUrl, width, height }
  const [gele, setGele] = useState(DEFAULT_GELE);
  const [star, setStar] = useState(DEFAULT_STAR);
  const [topFive, setTopFive] = useState([]); // array of track ids, in chosen order

  const resetComposition = useCallback((imgWidth, imgHeight) => {
    // Re-center gele/star sensibly for the newly uploaded photo's dimensions.
    setGele({
      ...DEFAULT_GELE,
      x: imgWidth / 2,
      y: imgHeight * 0.22,
      width: imgWidth * 0.7,
      height: imgWidth * 0.7 * (260 / 400),
    });
    setStar({
      ...DEFAULT_STAR,
      x: imgWidth * 0.72,
      y: imgHeight * 0.4,
      width: imgWidth * 0.14,
      height: imgWidth * 0.14,
    });
  }, []);

  const value = {
    photo,
    setPhoto,
    gele,
    setGele,
    star,
    setStar,
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
