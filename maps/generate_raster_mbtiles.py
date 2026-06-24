#!/usr/bin/env python3
import os
import sys
import math
import sqlite3
import argparse
import urllib.request
import urllib.error
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import io

# List of rotating modern browser User-Agents to prevent blocking
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
]

def deg2num(lat_deg, lon_deg, zoom):
    """
    Convert lat/lon to standard OSM tile X and Y coordinates.
    """
    try:
        lat_rad = math.radians(lat_deg)
        n = 1 << zoom
        xtile = int((lon_deg + 180.0) / 360.0 * n)
        lat_rad = max(-1.4844222291, min(1.4844222291, lat_rad))
        ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
        
        xtile = max(0, min(xtile, n - 1))
        ytile = max(0, min(ytile, n - 1))
        return xtile, ytile
    except Exception as e:
        print(f"[-] deg2num conversion error: {e}")
        return 0, 0

def get_tiles_for_bbox(bbox, min_zoom, max_zoom, max_tiles_per_zoom=4000):
    """
    Generate all tile coordinates (z, x, y) for a given bounding box.
    If a zoom level exceeds max_tiles_per_zoom, it automatically shrinks the bbox 
    around the center to capture the core high-resolution area (hiking focus).
    """
    lon_min, lat_min, lon_max, lat_max = bbox
    tiles = []
    
    # Calculate center of the bbox
    lon_center = (lon_min + lon_max) / 2.0
    lat_center = (lat_min + lat_max) / 2.0
    
    for z in range(min_zoom, max_zoom + 1):
        # 1. First project full bbox
        x_start, y_start = deg2num(lat_max, lon_min, z)
        x_end, y_end = deg2num(lat_min, lon_max, z)
        
        x_min, x_max = min(x_start, x_end), max(x_start, x_end)
        y_min, y_max = min(y_start, y_end), max(y_start, y_end)
        
        level_tiles = (x_max - x_min + 1) * (y_max - y_min + 1)
        
        # 2. If tile count is too massive, shrink the bbox to focus on the center
        if level_tiles > max_tiles_per_zoom and z >= 12:
            print(f"[!] Zoom {z} exceeds limits with {level_tiles} tiles. Focusing high-zoom on central mountaineering zone...")
            # We scale the bounding box down so it fits ~max_tiles_per_zoom
            # Aspect ratio of the original bbox
            lon_span = lon_max - lon_min
            lat_span = lat_max - lat_min
            
            # Binary search or math approximation to find suitable span fraction
            fraction = math.sqrt(max_tiles_per_zoom / level_tiles)
            shrunk_lon_min = lon_center - (lon_span * fraction / 2.0)
            shrunk_lon_max = lon_center + (lon_span * fraction / 2.0)
            shrunk_lat_min = lat_center - (lat_span * fraction / 2.0)
            shrunk_lat_max = lat_center + (lat_span * fraction / 2.0)
            
            x_start, y_start = deg2num(shrunk_lat_max, shrunk_lon_min, z)
            x_end, y_end = deg2num(shrunk_lat_min, shrunk_lon_max, z)
            
            x_min, x_max = min(x_start, x_end), max(x_start, x_end)
            y_min, y_max = min(y_start, y_end), max(y_start, y_end)
            level_tiles = (x_max - x_min + 1) * (y_max - y_min + 1)
            print(f"    - Focused bbox to [{shrunk_lon_min:.4f}, {shrunk_lat_min:.4f}, {shrunk_lon_max:.4f}, {shrunk_lat_max:.4f}] yielding {level_tiles} tiles.")
            
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                tiles.append((z, x, y))
                
    return tiles

def try_download_url(url, timeout=10):
    """
    Executes a web request to retrieve a tile image.
    """
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "image/webp,image/png,image/svg+xml,image/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.status
            content_type = response.headers.get("Content-Type", "")
            data = response.read()
            return data, status, content_type
    except Exception as e:
        return None, 500, str(e)

def download_and_optimize_tile(z, x, y, primary_pattern, backup_pattern, cache_dir, rate_limit_delay=0.05):
    """
    Checks cache first, otherwise downloads from primary (OpenTopoMap) or backup (OSM standard),
    optimizes image to PNG8 on-the-fly, and caches it locally.
    """
    # 1. Local Cache Check
    tile_cache_path = os.path.join(cache_dir, str(z), str(x), f"{y}.png")
    if os.path.exists(tile_cache_path):
        try:
            with open(tile_cache_path, "rb") as f:
                cached_data = f.read()
            if len(cached_data) > 100:
                # Cache hit! Return cached tile
                return z, x, y, cached_data, 200, "image/png", "LOCAL_CACHE"
        except Exception:
            pass
            
    # 2. Gentle delay to prevent server-side blocking
    if rate_limit_delay > 0:
        time.sleep(rate_limit_delay + random.uniform(0.01, 0.05))

    # 3. Load Balance subdomains (a, b, c)
    subdomain = random.choice(["a", "b", "c"])
    
    # Format primary URL
    # Replace optional {s} or subdomains
    url = primary_pattern.replace("{s}", subdomain).format(z=z, x=x, y=y)
    
    # Attempt Primary Download
    data, status, info = try_download_url(url)
    source_used = "PRIMARY"
    
    # 4. Fallback if Primary fails or is throttled/blocked
    if data is None or status != 200 or len(data) < 100:
        # Retry with a delay
        time.sleep(1.5)
        data, status, info = try_download_url(url)
        
        if data is None or status != 200 or len(data) < 100:
            # Fall back to backup pattern
            backup_sub = random.choice(["a", "b", "c"])
            backup_url = backup_pattern.replace("{s}", backup_sub).format(z=z, x=x, y=y)
            # print(f"    - [FALLBACK] z={z}, x={x}, y={y} from backup source: {backup_url}")
            data, status, info = try_download_url(backup_url)
            source_used = "BACKUP"
            
    # 5. Image Quantization & Local Caching
    if data is not None and status == 200 and len(data) > 100:
        try:
            # Convert to PNG8 adaptive palette color quantization on the fly
            img = Image.open(io.BytesIO(data))
            img_rgba = img.convert("RGBA")
            img_p = img_rgba.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
            
            png8_io = io.BytesIO()
            img_p.save(png8_io, format="PNG", optimize=True)
            optimized_data = png8_io.getvalue()
            
            # Save to Local Cache Directory
            os.makedirs(os.path.dirname(tile_cache_path), exist_ok=True)
            with open(tile_cache_path, "wb") as f:
                f.write(optimized_data)
                
            return z, x, y, optimized_data, status, "image/png", source_used
        except Exception as e:
            # If optimization fails, save and return original raw data
            try:
                os.makedirs(os.path.dirname(tile_cache_path), exist_ok=True)
                with open(tile_cache_path, "wb") as f:
                    f.write(data)
            except Exception:
                pass
            return z, x, y, data, status, info, source_used
            
    return z, x, y, None, status, info, source_used

def main():
    parser = argparse.ArgumentParser(description="CyberTrail Resilient Raster Tile Downloader")
    parser.add_argument("--bbox", type=str, required=True, help="Bounding box: lon_min,lat_min,lon_max,lat_max")
    parser.add_argument("--minzoom", type=int, required=True, help="Minimum zoom level")
    parser.add_argument("--maxzoom", type=int, required=True, help="Maximum zoom level")
    parser.add_argument("--output", type=str, required=True, help="Output .mbtiles file path")
    parser.add_argument("--url", type=str, default="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", help="Primary raster URL pattern")
    parser.add_argument("--backup_url", type=str, default="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png", help="Backup raster URL pattern")
    parser.add_argument("--concurrency", type=int, default=8, help="Parallel download thread count")
    parser.add_argument("--cache_dir", type=str, default="data/tile_cache", help="Disk cache directory")
    parser.add_argument("--tile_source", type=str, default=None, help="The active tile source: opentopomap, local, selfhosted")
    
    # Load configuration from maps/map_config.json
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "map_config.json")
    config_tile_source = "opentopomap"
    config_url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
    config_backup_url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png"
    
    if os.path.exists(config_path):
        import json
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                config_tile_source = cfg.get("tile_source", "opentopomap")
                sources = cfg.get("sources", {})
                if config_tile_source in sources:
                    config_url = sources[config_tile_source].get("url", config_url)
                    config_backup_url = sources[config_tile_source].get("backup_url", config_backup_url)
        except Exception as ce:
            print(f"[!] Warning reading map_config.json: {ce}")

    args = parser.parse_args()
    
    selected_source = args.tile_source if args.tile_source is not None else config_tile_source
    
    if args.tile_source and os.path.exists(config_path):
        import json
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                sources = cfg.get("sources", {})
                if args.tile_source in sources:
                    config_url = sources[args.tile_source].get("url", config_url)
                    config_backup_url = sources[args.tile_source].get("backup_url", config_backup_url)
        except Exception:
            pass

    primary_url = args.url if args.url != "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" else config_url
    backup_url = args.backup_url if args.backup_url != "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png" else config_backup_url
    
    try:
        bbox = [float(v) for v in args.bbox.split(",")]
    except Exception as e:
        print(f"[-] Invalid bbox format. Must be 4 comma-separated floats: {e}")
        sys.exit(1)
        
    print(f"[*] Target Region Coordinate Bounds: {bbox}")
    print(f"[*] Zoom Levels: {args.minzoom} to {args.maxzoom}")
    print(f"[*] Selected Tile Source: {selected_source}")
    print(f"[*] Primary Tile Source URL: {primary_url}")
    print(f"[*] Backup Fallback Source URL: {backup_url}")
    print(f"[*] Local Cache Path: {args.cache_dir}")
    
    # 1. Identify tiles inside bbox (limit dense high-zooms dynamically to protect build server and tile hosts)
    tiles_to_download = get_tiles_for_bbox(bbox, args.minzoom, args.maxzoom, max_tiles_per_zoom=4000)
    total_tiles = len(tiles_to_download)
    print(f"[*] Identified {total_tiles} total tiles inside selected boundary (applying zoom scale focusing if needed)")
    
    if total_tiles == 0:
        print("[-] Error: Bounding box contains 0 tiles for specified zooms.")
        sys.exit(1)
        
    # 2. Setup SQLite DB
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    if os.path.exists(args.output):
        try:
            os.remove(args.output)
        except OSError:
            pass
            
    conn = sqlite3.connect(args.output)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS tiles (zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB)")
    cursor.execute("CREATE TABLE IF NOT EXISTS metadata (name TEXT, value TEXT)")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS tile_index ON tiles (zoom_level, tile_column, tile_row)")
    conn.commit()
    
    metadata = {
        "name": os.path.basename(args.output).replace(".mbtiles", ""),
        "type": "baselayer",
        "version": "1.0.0",
        "description": f"CyberTrail offline terrain raster map for bounds {args.bbox} using source {selected_source}",
        "format": "png",
        "bounds": args.bbox,
        "minzoom": str(args.minzoom),
        "maxzoom": str(args.maxzoom),
        "tile_source": selected_source
    }
    
    for k, v in metadata.items():
        cursor.execute("INSERT OR REPLACE INTO metadata (name, value) VALUES (?, ?)", (k, v))
    conn.commit()
    
    success_count = 0
    failure_count = 0
    cache_hits = 0
    primary_downloads = 0
    backup_downloads = 0
    
    print(f"[*] Commencing download pipeline with concurrency={args.concurrency} threads...")
    
    # Rate limit delay: slightly higher for high threads to avoid slamming servers
    delay = 0.08 if args.concurrency > 4 else 0.04
    
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = {
            executor.submit(
                download_and_optimize_tile, 
                z, x, y, 
                primary_url, 
                backup_url, 
                args.cache_dir, 
                delay
            ): (z, x, y)
            for z, x, y in tiles_to_download
        }
        
        for idx, future in enumerate(as_completed(futures)):
            z, x, y, data, status, content_type, source = future.result()
            
            if data is not None:
                # MBTiles standard: tile_row is y-flipped!
                tile_row = (1 << z) - 1 - y
                cursor.execute(
                    "INSERT OR REPLACE INTO tiles (zoom_level, tile_column, tile_row, tile_data) VALUES (?, ?, ?, ?)",
                    (z, x, tile_row, sqlite3.Binary(data))
                )
                success_count += 1
                
                if source == "LOCAL_CACHE":
                    cache_hits += 1
                elif source == "PRIMARY":
                    primary_downloads += 1
                elif source == "BACKUP":
                    backup_downloads += 1
            else:
                failure_count += 1
                
            if (idx + 1) % 200 == 0 or (idx + 1) == total_tiles:
                print(f"    - Progress: {idx + 1}/{total_tiles} (Success: {success_count}, Fail: {failure_count}, Cache Hits: {cache_hits}, Primary Down: {primary_downloads}, Backup Down: {backup_downloads})")
                
    conn.commit()
    
    # Check total rows
    cursor.execute("SELECT COUNT(*) FROM tiles")
    tiles_written = cursor.fetchone()[0]
    conn.close()
    
    print("\n[+] Verification Diagnostics:")
    print(f"    - Total tiles stored inside MBTiles database: {tiles_written}")
    print(f"    - Total Cache hits (skipped network request): {cache_hits}")
    print(f"    - Downloaded from primary OpenTopoMap source: {primary_downloads}")
    print(f"    - Downloaded from resilient fallback source: {backup_downloads}")
    print(f"    - Unresolved tile failures: {failure_count}")
    
    if tiles_written < 100:
        print("[-] Warning: Very few tiles written. Something went wrong.")
        sys.exit(1)
        
    print(f"[+] Raster MBTiles compilation complete: {args.output}\n")

if __name__ == "__main__":
    main()
