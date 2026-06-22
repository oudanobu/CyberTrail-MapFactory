#!/bin/bash
set -e
mkdir -p data

if [ ! -f "data/liaoning-latest.osm.pbf" ]; then
    echo "Downloading Liaoning Geofabrik Dataset..."
    wget -nc -O data/liaoning-latest.osm.pbf https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf
fi

echo "Using Geofabrik Liaoning scope..."
cp data/liaoning-latest.osm.pbf data/liaoning.osm.pbf


