#!/bin/bash
set -e
mkdir -p data maps/admin_boundaries

if [ ! -f "data/liaoning-latest.osm.pbf" ]; then
    echo "Downloading Liaoning Geofabrik Dataset..."
    wget -nc -O data/liaoning-latest.osm.pbf https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf
fi

if [ ! -f "maps/admin_boundaries/liaoning.geojson" ]; then
    echo "Fetching Liaoning boundary from Overpass API..."
    curl -s -g -X POST -d '[out:json][timeout:60];relation["name"="辽宁省"]["admin_level"="4"];out geom;' https://overpass-api.de/api/interpreter > maps/admin_boundaries/liaoning.json
    echo "Converting to GeoJSON..."
    npx -y osmtogeojson maps/admin_boundaries/liaoning.json > maps/admin_boundaries/liaoning.geojson
fi

echo "Cropping Liaoning..."
osmium extract --polygon maps/admin_boundaries/liaoning.geojson data/liaoning-latest.osm.pbf -o data/liaoning.osm.pbf --strategy=complete_ways --overwrite

