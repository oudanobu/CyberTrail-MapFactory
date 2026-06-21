#!/bin/bash
set -e
echo "Fetching China Geofabrik Dataset..."
mkdir -p data
wget -nc -O data/china-latest.osm.pbf https://download.geofabrik.de/asia/china-latest.osm.pbf

echo "Using Geofabrik China scope as fallback."
cp data/china-latest.osm.pbf data/china.osm.pbf

