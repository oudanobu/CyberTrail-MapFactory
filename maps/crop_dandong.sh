#!/bin/bash
set -e
mkdir -p data maps/admin_boundaries

if [ ! -f "data/liaoning.osm.pbf" ]; then
    echo "Liaoning source missing, building from upstream..."
    sh maps/crop_liaoning.sh
fi

if [ ! -f "maps/admin_boundaries/dandong.geojson" ]; then
    echo "Fetching Dandong boundary from Overpass API..."
    curl -s -g -X POST -d '[out:json][timeout:60];relation["name"="丹东市"]["admin_level"="6"];out geom;' https://overpass-api.de/api/interpreter > maps/admin_boundaries/dandong.json
    echo "Converting to GeoJSON..."
    npx -y osmtogeojson maps/admin_boundaries/dandong.json > maps/admin_boundaries/dandong.geojson
fi

echo "Cropping Dandong..."
osmium extract --polygon maps/admin_boundaries/dandong.geojson data/liaoning.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways --overwrite

