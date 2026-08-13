import { useEffect, useState } from "react";
import { tracklist, REQUIRED_TOP_FIVE } from "../data/tracklist.js";
import "./TopFiveSheet.css";

export default function TopFiveSheet({ open, initialSelected, onClose, onConfirm }) {
  const [selected, setSelected] = useState(initialSelected || []);

  useEffect(() => {
    if (open) setSelected(initialSelected || []);
  }, [open, initialSelected]);

  if (!open) return null;

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= REQUIRED_TOP_FIVE) return prev;
      return [...prev, id];
    });
  };

  const isComplete = selected.length === REQUIRED_TOP_FIVE;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h2>Pick your Top 5</h2>
          <p>
            Choose the 5 songs you think will be your favorites.{" "}
            <span className="sheet-count">
              {selected.length}/{REQUIRED_TOP_FIVE}
            </span>
          </p>
          <p className="sheet-track-count">{tracklist.length} songs</p>
        </div>

        <div className="sheet-list">
          {tracklist.map((track) => {
            const pickIndex = selected.indexOf(track.id);
            const isSelected = pickIndex !== -1;
            const disabled = !isSelected && selected.length >= REQUIRED_TOP_FIVE;
            return (
              <button
                key={track.id}
                className={`track-row${isSelected ? " selected" : ""}${disabled ? " disabled" : ""}`}
                onClick={() => toggle(track.id)}
                disabled={disabled}
              >
                <span className="track-number">{track.number}</span>
                <img className="track-art" src={track.artUrl} alt="" />
                <span className="track-meta">
                  <span className="track-title">{track.title}</span>
                  <span className="track-artist">{track.artist}</span>
                </span>
                <span className={`track-check${isSelected ? " on" : ""}`}>
                  {isSelected ? pickIndex + 1 : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="sheet-footer">
          <button
            className="btn btn-primary btn-full"
            disabled={!isComplete}
            onClick={() => onConfirm(selected)}
          >
            {isComplete ? "Confirm Top 5" : `Select ${REQUIRED_TOP_FIVE - selected.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
}
