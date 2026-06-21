#!/bin/bash
set -e
# Yuanbao is a child of Dandong
sh maps/crop_dandong.sh

if [ -f "maps/admin_boundaries/yuanbao.geojson" ]; then
    echo "Cropping Yuanbao boundary..."
    osmium extract --polygon maps/admin_boundaries/yuanbao.geojson data/dandong.osm.pbf -o data/yuanbao.osm.pbf --strategy=complete_ways --overwrite
else
    echo "GeoJSON maps/admin_boundaries/yuanbao.geojson not found! Ensure boundaries are added."
    exit 1
fi
