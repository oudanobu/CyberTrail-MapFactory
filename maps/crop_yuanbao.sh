#!/bin/bash
set -e
mkdir -p data maps/admin_boundaries

if [ ! -f "data/dandong.osm.pbf" ]; then
    echo "Dandong source missing, building from upstream..."
    sh maps/crop_dandong.sh
fi

if [ ! -f "maps/admin_boundaries/yuanbao.geojson" ]; then
    echo "Fetching Yuanbao boundary from Overpass API..."
    curl -s -g -X POST -d '[out:json][timeout:60];relation["name"="元宝区"]["admin_level"="8"];out geom;' https://overpass-api.de/api/interpreter > maps/admin_boundaries/yuanbao.json
    echo "Converting to GeoJSON..."
    npx -y osmtogeojson maps/admin_boundaries/yuanbao.json > maps/admin_boundaries/yuanbao.geojson
fi

echo "Cropping Yuanbao..."
osmium extract --polygon maps/admin_boundaries/yuanbao.geojson data/dandong.osm.pbf -o data/yuanbao.osm.pbf --strategy=complete_ways --overwrite

