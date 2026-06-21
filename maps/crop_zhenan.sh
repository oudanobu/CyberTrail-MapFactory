#!/bin/bash
set -e
# Zhenan is a child of Dandong
sh maps/crop_dandong.sh

if [ -f "maps/admin_boundaries/zhenan.geojson" ]; then
    echo "Cropping Zhenan boundary..."
    osmium extract --polygon maps/admin_boundaries/zhenan.geojson data/dandong.osm.pbf -o data/zhenan.osm.pbf --strategy=complete_ways --overwrite
else
    echo "GeoJSON maps/admin_boundaries/zhenan.geojson not found! Ensure boundaries are added."
    exit 1
fi
