#!/bin/bash
set -e
echo "Fetching China Geofabrik Dataset..."
wget -nc -O data/china-latest.osm.pbf https://download.geofabrik.de/asia/china-latest.osm.pbf

if [ -f "maps/admin_boundaries/china.geojson" ]; then
    echo "Cropping China boundary..."
    osmium extract --polygon maps/admin_boundaries/china.geojson data/china-latest.osm.pbf -o data/china.osm.pbf --strategy=complete_ways --overwrite
else
    echo "Using Geofabrik China scope as fallback."
    cp data/china-latest.osm.pbf data/china.osm.pbf
fi
