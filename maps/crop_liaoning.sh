#!/bin/bash
set -e
echo "Fetching Liaoning Geofabrik Dataset..."
wget -nc -O data/liaoning-latest.osm.pbf https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf

if [ -f "maps/admin_boundaries/liaoning.geojson" ]; then
    echo "Cropping Liaoning boundary..."
    osmium extract --polygon maps/admin_boundaries/liaoning.geojson data/liaoning-latest.osm.pbf -o data/liaoning.osm.pbf --strategy=complete_ways --overwrite
else
    echo "Using Geofabrik Liaoning scope as fallback."
    cp data/liaoning-latest.osm.pbf data/liaoning.osm.pbf
fi
