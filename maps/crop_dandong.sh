#!/bin/bash
set -e
# Dandong is a child of Liaoning
sh maps/crop_liaoning.sh

if [ -f "maps/admin_boundaries/dandong.geojson" ]; then
    echo "Cropping Dandong boundary..."
    osmium extract --polygon maps/admin_boundaries/dandong.geojson data/liaoning.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways --overwrite
else
    echo "GeoJSON maps/admin_boundaries/dandong.geojson not found! Ensure boundaries are added."
    exit 1
fi
