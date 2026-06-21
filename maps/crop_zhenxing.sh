#!/bin/bash
set -e
mkdir -p data maps/admin_boundaries

if [ ! -f "data/dandong.osm.pbf" ]; then
    echo "Dandong source missing, building from upstream..."
    sh maps/crop_dandong.sh
fi

if [ ! -f "maps/admin_boundaries/zhenxing.geojson" ]; then
    echo "Fetching Zhenxing boundary from Overpass API..."
    curl -s -g -X POST -d '[out:json][timeout:60];relation["name"="振兴区"]["admin_level"="8"];out geom;' https://overpass-api.de/api/interpreter > maps/admin_boundaries/zhenxing.json
    echo "Converting to GeoJSON..."
    npx -y osmtogeojson maps/admin_boundaries/zhenxing.json > maps/admin_boundaries/zhenxing.geojson
fi

echo "Cropping Zhenxing..."
osmium extract --polygon maps/admin_boundaries/zhenxing.geojson data/dandong.osm.pbf -o data/zhenxing.osm.pbf --strategy=complete_ways --overwrite

