import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";
import { preloadFaceModels } from "../utils/faceDetect.js";
import addIconSrc from "../assets/Star.svg";
import "./Upload.css";

// Safety net: resetComposition (face detection + gele placement) always
// resolves on its own, but if something unforeseen ever hangs, don't strand
// the user staring at a spinner forever — move on with whatever placement
// is ready by then (the heuristic default, at worst).
const AUTO_FIT_TIMEOUT_MS = 8000;

export default function Upload() {
  const { setPhoto, resetComposition } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Warm the face-detection models while the user is still choosing a
  // photo, so they're already loaded by the time resetComposition needs
  // them on the Editor page — no visible delay.
  useEffect(() => {
    preloadFaceModels();
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }
      setError("");
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onerror = () => {
        setIsProcessing(false);
        setError("That file couldn't be read. Try a different photo.");
      };
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => {
          setIsProcessing(false);
          setError("That image couldn't be loaded. Try a different photo.");
        };
        img.onload = async () => {
          setPhoto({ dataUrl: reader.result, width: img.width, height: img.height });
          // Stay on this screen (with the loading state visible) until the
          // gele's auto-placement is actually ready, so the Editor page
          // appears with everything already in place — no separate loading
          // moment there, no visible snap from a default to the real fit.
          await Promise.race([
            resetComposition(img.width, img.height, reader.result),
            new Promise((resolve) => setTimeout(resolve, AUTO_FIT_TIMEOUT_MS)),
          ]);
          navigate("/edit");
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    },
    [navigate, resetComposition, setPhoto]
  );

  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="upload-page">
      <div className="upload-hero">
        <p className="upload-eyebrow">My Ayra starr</p>
        <h1 className="upload-title">
          WEAR YOUR{" "}
          <span className="accent gele-word">
            GELE
            <img
              className="upload-hero-gele"
              src="/Image/small-gele.webp"
              alt=""
              aria-hidden="true"
            />
          </span>
          <br />
          CLAIM YOUR <span className="accent">TOP5</span>
        </h1>
        <p className="upload-subtitle">
          Upload a photo to build your own Ayra Starr look — gele, star, and your predicted
          album favorites, ready to share.
        </p>
      </div>

      <div
        className={`upload-dropzone${isDragging ? " dragging" : ""}${isProcessing ? " processing" : ""}`}
        onDragOver={(e) => {
          if (isProcessing) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-busy={isProcessing}
      >
        {isProcessing ? (
          <div className="upload-dropzone-inner">
            <span className="upload-spinner" aria-hidden="true" />
            <p className="upload-cta">SETTING UP YOUR GELE...</p>
            <p className="upload-hint">Finding your best fit — just a moment.</p>
          </div>
        ) : (
          <div className="upload-dropzone-inner">
            <img className="upload-icon" src={addIconSrc} alt="" aria-hidden="true" />
            <p className="upload-cta">TAP TO UPLOAD YOUR PHOTO</p>
            <p className="upload-hint">Use a clear selfie or portrait — head &amp; face visible works best.</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          hidden
          disabled={isProcessing}
        />
      </div>

      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
