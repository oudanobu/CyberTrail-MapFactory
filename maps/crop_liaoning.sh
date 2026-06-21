#!/bin/bash
set -e
echo "Fetching Liaoning Geofabrik Dataset..."
mkdir -p data
wget -nc -O data/liaoning-latest.osm.pbf https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf

echo "Using Geofabrik Liaoning scope as fallback."
cp data/liaoning-latest.osm.pbf data/liaoning.osm.pbf

