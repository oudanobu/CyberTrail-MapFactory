#!/bin/bash
set -e
# Zhenxing is a child of Dandong
sh maps/crop_dandong.sh

if [ -f "maps/admin_boundaries/zhenxing.geojson" ]; then
    echo "Cropping Zhenxing boundary..."
    osmium extract --polygon maps/admin_boundaries/zhenxing.geojson data/dandong.osm.pbf -o data/zhenxing.osm.pbf --strategy=complete_ways --overwrite
else
    echo "GeoJSON maps/admin_boundaries/zhenxing.geojson not found! Ensure boundaries are added."
    exit 1
fi
