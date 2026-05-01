#!/usr/bin/env python3
"""
Flask API server for Facial Emotion Recognition (FER).

POST /analyze  →  { "image": "<base64 JPEG>" }
             ←  { "emotions": {...7 scores...}, "face_detected": true, "box": [x,y,w,h] }

Start with:
    python api.py          (default port 5050)
    python api.py 5051     (custom port)
"""

import base64
import logging
import sys

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fer-api")

# ── App ──────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Load FER once at startup ─────────────────────────────────────────────────
log.info("Loading FER model …")
try:
    from fer import FER
    # Lower thresholds so we detect faces more reliably under typical webcam conditions:
    #   scale_factor=1.05  → smaller pyramid steps (slower but more sensitive)
    #   min_neighbors=3    → accept boxes with fewer confirmations (was 5)
    #   min_face_size=20   → allow smaller faces in frame (was 50)
    detector = FER(
        mtcnn=False,
        scale_factor=1.05,
        min_neighbors=3,
        min_face_size=20,
    )
    log.info("FER model loaded (Haar cascade, min_neighbors=3, min_face_size=20).")
except Exception as exc:
    log.error(f"Failed to load FER: {exc}")
    detector = None

# ── Helpers ───────────────────────────────────────────────────────────────────

def b64_to_bgr(b64_string: str) -> np.ndarray:
    """Decode a base64 image (data-URL or raw) into a BGR numpy array."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    raw = base64.b64decode(b64_string)
    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)   # always BGR
    return frame


def try_detect(frame: np.ndarray):
    """Run FER; return (results, None) or (None, error_string)."""
    try:
        results = detector.detect_emotions(frame)
        return results, None
    except Exception as exc:
        return None, str(exc)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "fer_loaded": detector is not None})


@app.post("/analyze")
def analyze():
    """
    Accepts a base64 image, returns emotion scores and face bounding box.

    On success:
        { "face_detected": true,
          "emotions": {"angry":0.01,"disgust":0.0,"fear":0.02,"happy":0.89,"sad":0.01,"surprise":0.04,"neutral":0.03},
          "box": [x, y, w, h] }

    No face:
        { "face_detected": false, "emotions": null, "box": null }
    """
    if detector is None:
        return jsonify({"error": "FER model not loaded"}), 503

    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "Missing 'image' field"}), 400

    # Decode
    try:
        frame = b64_to_bgr(data["image"])
    except Exception as exc:
        log.warning(f"Image decode error: {exc}")
        return jsonify({"error": f"Decode failed: {exc}"}), 422

    if frame is None or frame.size == 0:
        return jsonify({"error": "OpenCV could not decode the image"}), 422

    log.debug(f"Frame shape: {frame.shape}")

    # ── Attempt 1: original orientation ────────────────────────────────────
    results, err = try_detect(frame)

    # ── Attempt 2: horizontally flipped (mirrors are sometimes inverted) ────
    if not results:
        flipped = cv2.flip(frame, 1)
        results, err = try_detect(flipped)

    # ── Attempt 3: upscale small frames (sometimes webcam sends 320×240) ───
    if not results and min(frame.shape[:2]) < 360:
        bigger = cv2.resize(frame, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LINEAR)
        results, err = try_detect(bigger)
        if results:
            # Scale bounding box back to original coordinate space
            for r in results:
                r["box"] = [int(v / 2) for v in r["box"]]

    if err and not results:
        log.error(f"FER inference error: {err}")
        return jsonify({"error": f"Inference failed: {err}"}), 500

    if not results:
        log.info("No face detected in frame")
        return jsonify({"face_detected": False, "emotions": None, "box": None})

    best = results[0]
    emotions = best["emotions"]
    box      = [int(v) for v in best["box"]]   # [x, y, w, h]
    log.info(f"Face at {box}  emotions: { {k: round(v,2) for k,v in emotions.items()} }")
    return jsonify({"face_detected": True, "emotions": emotions, "box": box})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5050
    log.info(f"Starting FER API → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
