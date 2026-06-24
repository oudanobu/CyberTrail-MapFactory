#!/usr/bin/env bash
# CyberTrail-MapFactory: Build and Optimize Offline Raster PNG MBTiles
set -euo pipefail

# Delegate directly to our robust, configure-driven Python script
python3 "$(dirname "$0")/compile_by_config.py" "$@"
