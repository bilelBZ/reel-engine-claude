#!/usr/bin/env python3
"""Dense face-tracked pan keyframes for vertical (9:16) reframing.

Detects the speaker's face across the clip (every 0.5s), picks the
largest/most-persistent face, smooths the face-center trajectory with a
moving average, and emits per-timestamp crop keyframes {t, x} that keep the
speaker horizontally centered in the 9:16 crop.

Fallback behavior: if no face is detected in some frames, the last known
position is carried forward; after a >3s gap it falls back to frame center.

Usage:
    python3 face_track_keyframes.py --clip /path/clip.mp4 --out /path/face.json

Output (face.json):
{
  "crop": {"x": 219, "y": 0, "w": 202, "h": 360},
  "crop_keyframes": [{"t": 0.0, "x": 219}, {"t": 0.5, "x": 221}, ...],
  "meta": {"samples": 77, "detections": 70, "fallback_to_center": false}
}
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import tempfile
import shutil


def get_video_info(path):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", "-show_format", "-select_streams", "v:0", path],
        capture_output=True, text=True, check=True,
    )
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    fmt = data.get("format", {})
    w = int(stream["width"])
    h = int(stream["height"])
    duration = float(fmt.get("duration", stream.get("duration", 0)))
    return w, h, duration


def main():
    ap = argparse.ArgumentParser(description="Dense face-tracked pan keyframes")
    ap.add_argument("--clip", required=True, help="Input clip file")
    ap.add_argument("--out", required=True, help="Output JSON file")
    ap.add_argument("--sample-interval", type=float, default=0.5,
                    help="Seconds between face detections (default 0.5)")
    ap.add_argument("--smooth-window", type=int, default=5,
                    help="Moving-average window in samples (default 5)")
    ap.add_argument("--gap-fallback-sec", type=float, default=3.0,
                    help="Fallback to center after this gap without detection")
    args = ap.parse_args()

    src_w, src_h, duration = get_video_info(args.clip)
    if duration <= 0:
        print(json.dumps({"error": "Could not determine clip duration"}))
        sys.exit(1)

    interval = args.sample_interval
    n_samples = max(2, int(duration / interval) + 1)

    tmpdir = tempfile.mkdtemp(prefix="facetrack_")
    try:
        # Extract all sample frames in one ffmpeg call (fast)
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", args.clip,
             "-vf", f"fps=1/{interval}", "-q:v", "2",
             os.path.join(tmpdir, "f_%04d.jpg")],
            capture_output=True, check=False,
        )
        frame_files = sorted(glob.glob(os.path.join(tmpdir, "f_*.jpg")))

        import cv2
        import numpy as np

        # Face detector: OpenCV Haar cascade (vendored model). Chosen over
        # mediapipe because mediapipe 1.x `solutions` is removed and the
        # `tasks` native runtime needs libEGL, which this VM lacks.
        script_dir = os.path.dirname(os.path.abspath(__file__))
        cascade_path = os.path.join(
            script_dir, "models", "haarcascade_frontalface_default.xml")
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            print(json.dumps({"error": f"Could not load Haar cascade: {cascade_path}"}))
            sys.exit(1)

        raw_cx = []  # normalized face-center x per sample (None = no detection)
        last_cx = None
        for i, fp in enumerate(frame_files):
            ts = i * interval
            if ts >= duration:
                break
            img = cv2.imread(fp)
            if img is None:
                raw_cx.append(last_cx)
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            h_img, w_img = gray.shape
            faces = face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=6,
                minSize=(w_img // 12, w_img // 12))
            if len(faces):
                rects = [(x, y, w, h) for (x, y, w, h) in faces]
                if last_cx is not None and len(rects) > 1:
                    # Prefer continuity: face closest to the previous one
                    def score(r):
                        x, y, w, h = r
                        cx = (x + w / 2) / w_img
                        return (abs(cx - last_cx), -(w * h))
                    best = min(rects, key=score)
                else:
                    best = max(rects, key=lambda r: r[2] * r[3])
                x, y, w, h = best
                cx = (x + w / 2) / w_img
                cx = max(0.0, min(1.0, cx))
                last_cx = cx
                raw_cx.append(cx)
            else:
                raw_cx.append(last_cx)  # carry forward

        n_det = sum(1 for c in raw_cx if c is not None)
        fallback_center = n_det == 0

        # Gap fallback: stretches of None longer than gap_fallback_sec -> center
        gap_limit = int(args.gap_fallback_sec / interval)
        filled = []
        gap = 0
        for c in raw_cx:
            if c is None:
                gap += 1
            else:
                gap = 0
            if gap > gap_limit:
                filled.append(0.5)
            else:
                filled.append(c if c is not None else (filled[-1] if filled else 0.5))
        filled = [0.5 if c is None else c for c in filled]

        # Moving-average smoothing (low-pass, no jitter)
        win = max(1, args.smooth_window)
        x = np.array(filled)
        if len(x) >= win and win > 1:
            kernel = np.ones(win) / win
            sm = np.convolve(x, kernel, mode="same")
            half = win // 2
            sm[:half] = x[:half]
            sm[-half:] = x[-half:]
        else:
            sm = x

        # 9:16 crop geometry (same as compute_reframe's face-track mode)
        crop_h = src_h
        crop_w = min(src_w, int(crop_h * 9 / 16))
        crop_y = 0

        keyframes = []
        for i, cx in enumerate(sm):
            t = round(i * interval, 2)
            if t > duration:
                break
            crop_x = int(cx * src_w - crop_w / 2)
            crop_x = max(0, min(crop_x, src_w - crop_w))
            keyframes.append({"t": t, "x": crop_x})

        # Ensure a keyframe at t=0 and at end
        if keyframes and keyframes[0]["t"] != 0.0:
            keyframes.insert(0, {"t": 0.0, "x": keyframes[0]["x"]})
        last_t = round(duration, 2)
        if keyframes and keyframes[-1]["t"] < last_t:
            keyframes.append({"t": last_t, "x": keyframes[-1]["x"]})

        static_x = keyframes[0]["x"] if keyframes else (src_w - crop_w) // 2

        out = {
            "crop": {"x": static_x, "y": crop_y, "w": crop_w, "h": crop_h},
            "crop_keyframes": keyframes,
            "meta": {
                "samples": len(filled),
                "detections": n_det,
                "fallback_to_center": bool(fallback_center),
                "source": os.path.basename(args.clip),
            },
        }
        with open(args.out, "w") as f:
            json.dump(out, f, indent=2)
        print(json.dumps({"status": "ok", "keyframes": len(keyframes),
                          "detections": n_det, "samples": len(filled),
                          "fallback_to_center": bool(fallback_center)}))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    main()
