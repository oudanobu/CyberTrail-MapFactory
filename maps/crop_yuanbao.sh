#!/bin/bash
set -e
mkdir -p data

if [ ! -f "data/dandong.osm.pbf" ]; then
    echo "Dandong source missing, building from upstream..."
    sh maps/crop_dandong.sh
fi

echo "Cropping Yuanbao using explicit Bounding Box..."
# bbox: 124.36,40.13,124.43,40.22
osmium extract --bbox 124.36,40.13,124.43,40.22 data/dandong.osm.pbf -o data/yuanbao.osm.pbf --strategy=complete_ways --overwrite


