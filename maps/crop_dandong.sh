#!/usr/bin/env bash
# CyberTrail-MapFactory: Crop Dandong Region (Consolidated BBOX)
# Covers: Zhenxing, Yuanbao, Zhenan, Donggang, Fengcheng, and Kuandian

set -euo pipefail
mkdir -p data

# Ensure osmium is installed
if ! command -v osmium &> /dev/null; then
  echo "[!] Osmium-tool is not installed. Installing..."
  sudo apt-get update && sudo apt-get install -y osmium-tool
fi

# Crop using a complete consolidated boundary:
# covers Longitude [123.38, 125.70] and Latitude [39.73, 41.20]
BBOX="123.38,39.73,125.70,41.20"
LIAONING_PBF="data/liaoning.osm.pbf"
DANDONG_PBF="data/dandong.osm.pbf"

if [ ! -f "$LIAONING_PBF" ]; then
    echo "[*] Liaoning source missing. Downloading..."
    wget -c "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf" -O "$LIAONING_PBF"
fi

echo "[*] Slicing consolidated Dandong region from Liaoning dataset..."
echo "    - Target Coordinates: [${BBOX}]"
echo "    - Included Districts: Zhenxing, Yuanbao, Zhenan, Donggang, Fengcheng, Kuandian"

osmium extract --bbox "$BBOX" "$LIAONING_PBF" -o "$DANDONG_PBF" --strategy=complete_ways --overwrite

echo "[+] Slicing complete! Output written to: $DANDONG_PBF"
