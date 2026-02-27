#!/usr/bin/env bash
# Build a ~15s MP4 from frames in ./frames/
# Requires: brew install ffmpeg
# Usage: ./build-video.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMES_DIR="${SCRIPT_DIR}/frames"
OUTPUT="${SCRIPT_DIR}/strydeos-demo-15s.mp4"

if ! command -v ffmpeg &>/dev/null; then
  echo "ffmpeg is required. Install with: brew install ffmpeg"
  exit 1
fi

# Order: 01-login, 02-dashboard, 03-features (add more if you have 04, 05, ...)
FRAMES=("01-login.png" "02-dashboard.png" "03-features.png")
for f in "${FRAMES[@]}"; do
  if [[ ! -f "${FRAMES_DIR}/${f}" ]]; then
    echo "Missing frame: ${FRAMES_DIR}/${f}"
    exit 1
  fi
done

# ~15s total: 5s per frame for 3 frames
DURATION_PER_FRAME=5
TOTAL_FRAMES=${#FRAMES[@]}
# Build concat list: each image shown for DURATION_PER_FRAME seconds at 1 fps for that segment
CONCAT_LIST=$(mktemp)
trap 'rm -f "$CONCAT_LIST"' EXIT

for f in "${FRAMES[@]}"; do
  echo "file '${FRAMES_DIR}/${f}'" >> "$CONCAT_LIST"
  echo "duration ${DURATION_PER_FRAME}" >> "$CONCAT_LIST"
done
# Last file needs to be listed again for concat demuxer
LAST_FRAME="${FRAMES[$((TOTAL_FRAMES-1))]}"
echo "file '${FRAMES_DIR}/${LAST_FRAME}'" >> "$CONCAT_LIST"

ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" \
  -c:v libx264 -pix_fmt yuv420p -r 30 \
  "$OUTPUT"

echo "Done: $OUTPUT"
