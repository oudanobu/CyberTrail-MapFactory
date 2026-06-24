#!/usr/bin/env bash
# CyberTrail-MapFactory: Build and Optimize Offline Raster PNG MBTiles
set -euo pipefail

TARGET=${1:-"all"}
CONCURRENCY=8

echo "=========================================================="
echo " CyberTrail MapFactory: Initiating Direct Map Generation Pipeline"
echo " Target Package: $TARGET"
echo " Concurrency: $CONCURRENCY"
echo "=========================================================="

mkdir -p dist data/tile_cache

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

  # Run Python direct download and compilation (writes to optimized SQLite file)
  # Notice: we no longer pass hardcoded URLs; python3 maps/generate_raster_mbtiles.py will automatically
  # read the active tile source configurations from maps/map_config.json!
  python3 maps/generate_raster_mbtiles.py \
    --bbox="$BBOX" \
    --minzoom="$MINZ" \
    --maxzoom="$MAXZ" \
    --output="$OUTPUT" \
    --concurrency="$CONCURRENCY" \
    --cache_dir="data/tile_cache"

  # Run python raster optimizer (Deduplication & SQLite VACUUM)
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
    sqlite3 "$OUTPUT" "SELECT name, value FROM metadata WHERE name IN ('format', 'type', 'tile_source');"
    
    # Assert tiles count >= 10
    # Note: For small high-zoom bounding boxes, we set the check to at least 10 tiles to be resilient
    if [ "$TILES_COUNT" -lt 10 ]; then
      echo "[-] Critical Error: 地图生成异常：瓦片数量过少 (Total tiles: $TILES_COUNT < 10)"
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
  compile_and_optimize_mbtiles "world" "World Overview" "-180,-85,180,85" 0 5
fi

if [ "$TARGET" = "china" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "china" "China Overview" "73.66,18.16,135.05,53.56" 6 8
fi

if [ "$TARGET" = "liaoning_overview" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "liaoning_overview" "Liaoning Overview" "118.84,38.71,125.79,43.43" 9 11
fi

if [ "$TARGET" = "zhenxing_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "zhenxing_detail" "Zhenxing Detail" "124.30,40.05,124.45,40.16" 12 17
fi

if [ "$TARGET" = "yuanbao_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "yuanbao_detail" "Yuanbao Detail" "124.34,40.11,124.44,40.19" 12 17
fi

if [ "$TARGET" = "zhenan_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "zhenan_detail" "Zhenan Detail" "124.25,40.08,124.62,40.32" 12 17
fi

if [ "$TARGET" = "donggang_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "donggang_detail" "Donggang Detail" "123.38,39.73,124.35,40.15" 12 17
fi

if [ "$TARGET" = "fengcheng_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "fengcheng_detail" "Fengcheng Detail" "123.55,40.15,124.50,40.78" 12 17
fi

if [ "$TARGET" = "kuandian_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "kuandian_detail" "Kuandian Detail" "124.30,40.35,125.70,41.20" 12 17
fi

echo ">>> [FINAL METRICS] Final built map packages:"
ls -lh dist/*.mbtiles || echo "No packages in dist/"

echo "=========================================================="
echo " [SUCCESS] CyberTrail Map Generation Pipeline Completed!"
echo "=========================================================="
