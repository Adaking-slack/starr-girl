// Client-side face landmark detection (face-api.js), used to auto-place the
// gele over the detected head on upload. Runs entirely in the browser —
// nothing is uploaded anywhere.
//
// Models are the "tiny" variants (~270KB total) fetched once from
// /models on first use: tiny_face_detector + face_landmark_68_tiny.

import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

let loadPromise = null;

function loadModels() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);
  }
  return loadPromise;
}

// Returns the 68-point landmark set (in the image's natural pixel space) for
// the most prominent face in the image, or null if detection isn't possible
// (models fail to load, no face found, etc). Never throws — callers should
// fall back to a sensible default placement.
export async function detectFaceLandmarks(imgElement) {
  try {
    await loadModels();
    const result = await faceapi
      .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true); // true = use the tiny landmark net

    if (!result) return null;
    return result.landmarks.positions; // Point[] in natural image pixels
  } catch (err) {
    console.warn("Face detection unavailable, falling back to default gele placement.", err);
    return null;
  }
}
