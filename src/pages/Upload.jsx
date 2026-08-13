import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";
import { preloadFaceModels } from "../utils/faceDetect.js";
import addIconSrc from "../assets/Star.svg";
import "./Upload.css";

export default function Upload() {
  const { setPhoto, resetComposition } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
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
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setPhoto({ dataUrl: reader.result, width: img.width, height: img.height });
          resetComposition(img.width, img.height, reader.result);
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
        className={`upload-dropzone${isDragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="upload-dropzone-inner">
          <img className="upload-icon" src={addIconSrc} alt="" aria-hidden="true" />
          <p className="upload-cta">TAP TO UPLOAD YOUR PHOTO</p>
          <p className="upload-hint">Use a clear selfie or portrait — head &amp; face visible works best.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          hidden
        />
      </div>

      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
