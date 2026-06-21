#!/bin/bash
set -e
mkdir -p data
# Dandong is a child of Liaoning
if [ ! -f "data/liaoning.osm.pbf" ]; then
    sh maps/crop_liaoning.sh
fi

echo "Cropping Dandong using explicit Bounding Box..."
# bbox: 123.38,39.73,125.70,41.20
osmium extract --bbox 123.38,39.73,125.70,41.20 data/liaoning.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways --overwrite

