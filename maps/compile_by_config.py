#!/usr/bin/env python3
"""
CyberTrail-MapFactory: Configure-driven Multitarget Map Compilation Controller.
Parses JSON config files, resolves build categories, and handles compilation/optimization/verification.
"""
import os
import sys
import json
import subprocess
import sqlite3

MAPS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.dirname(MAPS_DIR)

# Category definitions mapping to target JSON files (keys without .json extension)
CATEGORIES = {
    "country": ["china", "japan"],
    "province": ["liaoning"],
    "admin3": ["zhenxing_hd", "yuanbao_hd", "zhenan_hd", "donggang_hd", "fengcheng_hd", "kuandian_hd"],
    "all": ["world", "china", "japan", "liaoning", "zhenxing_hd", "yuanbao_hd", "zhenan_hd", "donggang_hd", "fengcheng_hd", "kuandian_hd"]
}

def clean_target(target):
    """
    Cleans target input (e.g. 'build=country' -> 'country', 'build=zhenxing_hd' -> 'zhenxing_hd')
    """
    if target.startswith("build="):
        return target[len("build="):]
    return target

def compile_and_optimize(config_key):
    """
    Compiles, optimizes, and verifies a single map target using its JSON configuration.
    """
    config_path = os.path.join(MAPS_DIR, f"{config_key}.json")
    if not os.path.exists(config_path):
        print(f"[-] Error: Configuration file for '{config_key}' not found at {config_path}")
        sys.exit(1)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        print(f"[-] Error parsing configuration JSON at {config_path}: {e}")
        sys.exit(1)

    name = cfg.get("name", config_key)
    output = cfg.get("output", f"dist/{config_key}.mbtiles")
    bbox = cfg.get("bbox", "")
    minzoom = cfg.get("minzoom", 0)
    maxzoom = cfg.get("maxzoom", 5)
    tile_source = cfg.get("tile_source", "opentopomap")

    # Ensure output directory exists (relative to workspace root)
    abs_output = os.path.join(WORKSPACE_ROOT, output)
    os.makedirs(os.path.dirname(abs_output), exist_ok=True)

    print("==========================================================")
    print(f">>> [BUILDING] Map Package: {name} ({config_key})")
    print(f"    - Target File: {output}")
    print(f"    - Coordinates: {bbox}")
    print(f"    - Zooms: {minzoom} - {maxzoom}")
    print(f"    - Tile Source: {tile_source}")
    print("==========================================================")

    # 1. Run Tile Compilation Pipeline (generate_raster_mbtiles.py)
    gen_cmd = [
        "python3", os.path.join(MAPS_DIR, "generate_raster_mbtiles.py"),
        "--bbox", str(bbox),
        "--minzoom", str(minzoom),
        "--maxzoom", str(maxzoom),
        "--output", abs_output,
        "--concurrency", "8",
        "--cache_dir", os.path.join(WORKSPACE_ROOT, "data", "tile_cache"),
        "--tile_source", str(tile_source)
    ]

    print(f"[*] Executing generator: {' '.join(gen_cmd)}")
    gen_res = subprocess.run(gen_cmd)
    if gen_res.returncode != 0:
        print(f"[-] Error: Generator exited with non-zero code {gen_res.returncode}")
        sys.exit(1)

    # 2. Run Raster Optimization and Deduplication (raster_optimizer.py)
    opt_cmd = [
        "python3", os.path.join(MAPS_DIR, "raster_optimizer.py"),
        abs_output
    ]
    print(f"[*] Executing optimizer: {' '.join(opt_cmd)}")
    opt_res = subprocess.run(opt_cmd)
    if opt_res.returncode != 0:
        print(f"[-] Warning: Optimizer exited with non-zero code {opt_res.returncode}")

    # 3. Verify Final MBTiles Structural Integrity
    print(f">>> [VERIFYING] MBTiles SQLite Structural Integrity check for: {config_key}")
    if not os.path.exists(abs_output):
        print(f"[-] Critical Error: Output file {output} was not generated!")
        sys.exit(1)

    try:
        conn = sqlite3.connect(abs_output)
        cursor = conn.cursor()
        
        # Verify total tiles count
        cursor.execute("SELECT COUNT(*) FROM tiles;")
        tiles_count = cursor.fetchone()[0]
        print(f"    - SQLite tiles count: {tiles_count}")

        # Verify zoom levels
        cursor.execute("SELECT MIN(zoom_level), MAX(zoom_level) FROM tiles;")
        zoom_min_db, zoom_max_db = cursor.fetchone()
        print(f"    - SQLite zoom range representation: Z{zoom_min_db} - Z{zoom_max_db}")

        # Detailed breakdown
        cursor.execute("SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level;")
        breakdown = cursor.fetchall()
        print("    - Tile distribution by zoom:")
        for zl, cnt in breakdown:
            print(f"        * Zoom {zl}: {cnt} tiles")

        # Verify metadata
        cursor.execute("SELECT name, value FROM metadata WHERE name IN ('format', 'type', 'tile_source');")
        metadata_vals = cursor.fetchall()
        print("    - Metadata values:")
        for m_name, m_val in metadata_vals:
            print(f"        * {m_name}: {m_val}")

        conn.close()

        # Enforce minimum tile constraints
        if tiles_count < 10:
            print(f"[-] Critical Error: 地图生成异常：瓦片数量过少 (Total tiles: {tiles_count} < 10)")
            sys.exit(1)

    except Exception as e:
        print(f"[-] Database verification failed: {e}")
        sys.exit(1)

    print(f"[+] Finished processing: {config_key}\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: compile_by_config.py <target_category_or_key>")
        sys.exit(1)

    raw_target = sys.argv[1]
    target = clean_target(raw_target)

    print("==========================================================")
    print(" CyberTrail-MapFactory: Configure-driven Map Compilation")
    print(f" Target Query: {raw_target} (resolved to: {target})")
    print("==========================================================")

    # Resolve target list
    targets_to_build = []
    if target in CATEGORIES:
        targets_to_build = CATEGORIES[target]
    else:
        # Check if single config file exists
        single_path = os.path.join(MAPS_DIR, f"{target}.json")
        if os.path.exists(single_path):
            targets_to_build = [target]
        else:
            print(f"[-] Error: Unknown target or category '{target}'.")
            print("    Valid categories: all, country, province, admin3")
            print(f"    Or any of these valid keys: {', '.join(CATEGORIES['all'])}")
            sys.exit(1)

    # Perform sequential building
    print(f"[*] Resolved build targets: {', '.join(targets_to_build)}")
    for t in targets_to_build:
        compile_and_optimize(t)

    print("==========================================================")
    print(" [SUCCESS] Map Generation Pipeline Completed successfully!")
    print("==========================================================")

if __name__ == "__main__":
    main()
