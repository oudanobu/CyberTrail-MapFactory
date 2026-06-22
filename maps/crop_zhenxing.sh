#!/bin/bash
set -e
mkdir -p data

if [ ! -f "data/dandong.osm.pbf" ]; then
    echo "Dandong source missing, building from upstream..."
    sh maps/crop_dandong.sh
fi

echo "Cropping Zhenxing using explicit Bounding Box..."
# bbox: 124.32,40.08,124.43,40.16
osmium extract --bbox 124.32,40.08,124.43,40.16 data/dandong.osm.pbf -o data/zhenxing.osm.pbf --strategy=complete_ways --overwrite


