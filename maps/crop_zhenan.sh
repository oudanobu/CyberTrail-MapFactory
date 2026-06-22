#!/bin/bash
set -e
mkdir -p data

if [ ! -f "data/dandong.osm.pbf" ]; then
    echo "Dandong source missing, building from upstream..."
    sh maps/crop_dandong.sh
fi

echo "Cropping Zhenan using explicit Bounding Box..."
# bbox: 124.23,40.12,124.60,40.40
osmium extract --bbox 124.23,40.12,124.60,40.40 data/dandong.osm.pbf -o data/zhenan.osm.pbf --strategy=complete_ways --overwrite


