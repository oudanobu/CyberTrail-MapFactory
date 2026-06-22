#!/bin/bash
set -e
mkdir -p data

if [ ! -f "data/liaoning.osm.pbf" ]; then
    echo "Liaoning source missing, building from upstream..."
    sh maps/crop_liaoning.sh
fi

echo "Cropping Dandong using explicit Bounding Box..."
# bbox: 123.38,39.73,125.70,41.20
osmium extract --bbox 123.38,39.73,125.70,41.20 data/liaoning.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways --overwrite

