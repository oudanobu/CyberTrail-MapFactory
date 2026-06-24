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
    --bbox "$BBOX" \
    --minzoom "$MINZ" \
    --maxzoom "$MAXZ" \
    --output "$OUTPUT" \
    --concurrency "$CONCURRENCY" \
    --cache_dir "data/tile_cache"

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
  compile_and_optimize_mbtiles "world" "World Overview" "-180,-85,180,85" 0 5
fi

if [ "$TARGET" = "china" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "china" "China Overview" "73.66,18.16,135.05,53.56" 6 8
fi

if [ "$TARGET" = "dandong_overview" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "dandong_overview" "Dandong Overview" "123.38,39.73,125.70,41.20" 9 11
fi

if [ "$TARGET" = "dandong_detail" ] || [ "$TARGET" = "all" ]; then
  compile_and_optimize_mbtiles "dandong_detail" "Dandong Detailed" "123.38,39.73,125.70,41.20" 12 16
fi

echo ">>> [FINAL METRICS] Final built map packages:"
ls -lh dist/*.mbtiles || echo "No packages in dist/"

echo "=========================================================="
echo " [SUCCESS] CyberTrail Map Generation Pipeline Completed!"
echo "=========================================================="
