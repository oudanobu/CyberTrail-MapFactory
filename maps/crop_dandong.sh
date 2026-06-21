#!/usr/bin/env bash
# CyberTrail-MapFactory: Local Dandong Area Cropping Guide
# Dependencies: osmium-tool (apt install osmium-tool / brew install osmium-tool)
# Author: Senior GIS DevOps Engineer

set -eo pipefail

CWD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${CWD}/data"
mkdir -p "${DATA_DIR}"

LIAONING_URL="https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf"
LIAONING_PATH="${DATA_DIR}/liaoning-latest.osm.pbf"
DANDONG_PATH="${DATA_DIR}/dandong.osm.pbf"
LOG_PREFIX="[CyberTrail-Crop]"

# Bounding Box for Dandong: Longitude (123.38 to 125.70), Latitude (39.73 to 41.20)
BBOX="123.38,39.73,125.70,41.20"

echo "${LOG_PREFIX} Verifying osmium command existence..."
if ! command -v osmium &> /dev/null; then
  echo "❌ Error: 'osmium-tool' is not installed."
  echo "💡 Install it with: 'sudo apt install osmium-tool' (Ubuntu/Debian) or 'brew install osmium-tool' (macOS)"
  exit 1
fi

echo "${LOG_PREFIX} Downloading Liaoning osm.pbf dataset if not present..."
if [ ! -f "${LIAONING_PATH}" ]; then
  wget -O "${LIAONING_PATH}" "${LIAONING_URL}"
else
  echo "${LOG_PREFIX} Liaoning dataset already exists in ${LIAONING_PATH}"
fi

echo "${LOG_PREFIX} Slicing Dandong administrative boundaries..."
echo "${LOG_PREFIX} Boundary region: ${BBOX}"
osmium extract --bbox "${BBOX}" "${LIAONING_PATH}" -o "${DANDONG_PATH}" --strategy=complete_ways --overwrite

echo "✅ Slicing Complete!"
echo "📍 Extracted File: ${DANDONG_PATH}"
echo "🌟 Next: Compile into vector tiles using Planetiler:"
echo "   java -jar planetiler.jar --osm-path=${DANDONG_PATH} --output=${DATA_DIR}/dandong.mbtiles"
