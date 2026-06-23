#!/usr/bin/env bash
# CyberTrail-MapFactory: Build and Optimize Offline Raster PNG MBTiles
set -euo pipefail

TARGET=${1:-"all"}
CONCURRENCY=16

echo "=========================================================="
echo " CyberTrail MapFactory: Initiating Map Generation Pipeline"
echo " Target Package: $TARGET"
echo " Concurrency: $CONCURRENCY"
echo "=========================================================="

mkdir -p dist data

# 1. TileServer-GL Health & Setup Check
echo "[*] Checking for local TileServer-GL instance at http://localhost:8080..."

# Query a sample tile to inspect headers, content-type and size
SAMPLE_URL="http://localhost:8080/styles/basic/0/0/0.png"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$SAMPLE_URL" || echo "offline")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[-] Critical Error: TileServer-GL is OFFLINE or failed to render basic style sample. (HTTP Status: $HTTP_STATUS)"
  echo "[-] Active styles and endpoints are required for offline map compiling. Aborting workflow."
  exit 1
fi

# Fetch sample tile metadata to log Content-Type and exact bytes returned
HEADER_FILE=$(mktemp)
curl -s -D "$HEADER_FILE" -o /dev/null "$SAMPLE_URL"
CONTENT_TYPE=$(grep -i "content-type" "$HEADER_FILE" | awk '{print $2}' | tr -d '\r\n')
CONTENT_LENGTH=$(grep -i "content-length" "$HEADER_FILE" | awk '{print $2}' | tr -d '\r\n')
rm -f "$HEADER_FILE"

echo "[+] TileServer-GL Health Diagnostics:"
echo "    - Sample URL: $SAMPLE_URL"
echo "    - HTTP Status: $HTTP_STATUS"
echo "    - Content-Type: $CONTENT_TYPE"
echo "    - Returns size: $CONTENT_LENGTH bytes"

# Verify content-type is image/png
if [[ "$CONTENT_TYPE" != *"image/png"* ]]; then
  echo "[-] Critical Error: TileServer-GL is online but returned invalid non-PNG format: '$CONTENT_TYPE'"
  exit 1
fi

TILESERVER_URL="http://localhost:8080/styles/basic/{z}/{x}/{y}.png"

# Helper function to generate, optimize and verify a target map package
compile_and_optimize_mbtiles() {
  local KEY=$1
  local NAME=$2
  local BBOX=$3
  local MINZ=$4
  local MAXZ=$5
  local OUTPUT="dist/${KEY}.mbtiles"

  echo "----------------------------------------------------------"
  echo ">>> [BUILDING] Map Package: $NAME (${KEY})"
  echo "    - Target File: $OUTPUT"
  echo "    - Coordinates: $BBOX"
  echo "    - Zooms: $MINZ - $MAXZ"
  echo "----------------------------------------------------------"

  # Run Python download and compilation (must connect to TILESERVER_URL)
  python3 maps/generate_raster_mbtiles.py \
    --bbox "$BBOX" \
    --minzoom "$MINZ" \
    --maxzoom "$MAXZ" \
    --output "$OUTPUT" \
    --url "$TILESERVER_URL" \
    --concurrency "$CONCURRENCY"

  # Run python raster optimizer (PNG8 quantization, deduplication, SQLite vacuum)
  python3 maps/raster_optimizer.py "$OUTPUT"

  # Verify the database schema and content metrics
  echo ">>> [VERIFYING] MBTiles SQLite Structural Integrity check:"
  if [ -f "$OUTPUT" ]; then
    local TILES_COUNT=$(sqlite3 "$OUTPUT" "SELECT COUNT(*) FROM tiles;")
    
    echo "    - SQLite tiles count: $TILES_COUNT"
    echo "    - SQLite zoom range representation:"
    sqlite3 "$OUTPUT" "SELECT MIN(zoom_level), MAX(zoom_level) FROM tiles;"
    
    echo "    - SQLite tiles count grouped by zoom level:"
    sqlite3 "$OUTPUT" "SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level;"
    
    echo "    - Metadata format & type verification:"
    sqlite3 "$OUTPUT" "SELECT name, value FROM metadata WHERE name IN ('format', 'type');"
    
    # Assert tiles count >= 100
    if [ "$TILES_COUNT" -lt 100 ]; then
      echo "[-] Critical Error: 地图生成异常：瓦片数量过少 (Total tiles: $TILES_COUNT < 100)"
      exit 1
    fi
  else
    echo "[-] Error: Output file $OUTPUT was not generated!"
    exit 1
  fi
  echo "[+] Finished processing: $KEY"
}

# Run selection logic
if [ "$TARGET" = "world" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "world" "World Basemap" "-180,-85,180,85" 0 5
fi

if [ "$TARGET" = "china_overview" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "china" "China Overview" "73.66,18.16,135.05,53.56" 6 8
fi

if [ "$TARGET" = "liaoning" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "liaoning" "Liaoning Province" "118.84,38.71,125.79,43.43" 9 11
fi

if [ "$TARGET" = "dandong" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "dandong" "Consolidated Dandong Region" "123.38,39.73,125.70,41.20" 12 16
fi

echo ">>> [FINAL METRICS] Final built map packages:"
ls -lh dist/*.mbtiles

echo "=========================================================="
echo " [SUCCESS] CyberTrail Map Generation Pipeline Completed!"
echo "=========================================================="
