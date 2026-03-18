#!/bin/bash

URL="http://localhost:5173/themes"
WIDTH=780
HEIGHT=800
OUTPUT="public/themes.png"
TEMP_FILE="temp-themes.png"
RADIUS=20

cd "$(dirname "$0")/.."

curl -s "$URL" >/dev/null || {
  echo "❌ Dev server not running"
  exit 1
}

function mkround {
  local r="$RADIUS"
  magick "${1:?MISS}" \
    \( +clone -alpha extract \
    -draw "fill black polygon 0,0 0,$r $r,0 fill white circle $r,$r $r,0" \
    \( +clone -flip \) -compose Multiply -composite \
    \( +clone -flop \) -compose Multiply -composite \
    \) -alpha off -compose CopyOpacity -composite "${1:?MISS}"
}

echo "📸 Capturing themes page screenshot..."
chromium \
  --headless --disable-gpu \
  --virtual-time-budget=2000 \
  --hide-scrollbars \
  --window-size=${WIDTH},${HEIGHT} \
  --screenshot="$TEMP_FILE" \
  "$URL" 2>/dev/null

echo "✂️ Cropping to remove empty space..."
magick "$TEMP_FILE" -trim +repage "$TEMP_FILE"

echo "🎨 Adding rounded corners..."
mkround "$TEMP_FILE"

mv "$TEMP_FILE" "$OUTPUT"
echo "✅ Generated: $OUTPUT"
