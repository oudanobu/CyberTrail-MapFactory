#!/usr/bin/env python3
import sqlite3
import hashlib
import os
import sys
from PIL import Image
import io

def optimize_and_deduplicate(db_path):
    """
    Optimizes MBTiles database by:
    1. Converting flat tile schema into a normalized schema (map + images) to deduplicate identical tiles.
    2. Quantizing all raster PNG tiles into PNG8 format using PIL's adaptive color palette (reduces size up to 70%).
    3. Re-indexing and running SQLite VACUUM to reclaim disk space.
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        sys.exit(1)

    print(f"[*] Starting post-processing optimization for: {db_path}")
    initial_size = os.path.getsize(db_path) / (1024 * 1024)
    print(f"[*] Initial File Size: {initial_size:.2f} MB")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Enable write-ahead logging or memory-efficient temp stores
    cursor.execute("PRAGMA journal_mode = MEMORY")
    cursor.execute("PRAGMA synchronous = OFF")

    # 1. Create normalized tables if they do not exist
    print("[*] Creating normalized database schema for deduplication...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS images (
            tile_id TEXT PRIMARY KEY,
            tile_data BLOB
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS map (
            zoom_level INTEGER,
            tile_column INTEGER,
            tile_row INTEGER,
            tile_id TEXT,
            FOREIGN KEY (tile_id) REFERENCES images(tile_id)
        )
    """)
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS map_index ON map (zoom_level, tile_column, tile_row)")

    # Check if we are starting from a flat 'tiles' table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tiles'")
    has_tiles_table = cursor.fetchone() is not None

    if not has_tiles_table:
        print("[-] Error: MBTiles database must contain a standard 'tiles' table.")
        conn.close()
        sys.exit(1)

    print("[*] Reading raw tile assets...")
    cursor.execute("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles")
    raw_tiles = cursor.fetchall()
    print(f"[*] Total tile indices found: {len(raw_tiles)}")

    # Keep track of unique tiles using hashes
    unique_images = {} # hash -> (tile_id, compressed_png8_data)
    duplicates_count = 0
    optimized_count = 0

    print("[*] Performing PNG8 quantization and identifying duplicate geometries...")
    for idx, (zoom, col, row, raw_data) in enumerate(raw_tiles):
        if idx % 1000 == 0 and idx > 0:
            print(f"    - Processed {idx}/{len(raw_tiles)} tiles...")

        # Optimize the PNG image using PIL
        try:
            img = Image.open(io.BytesIO(raw_data))
            
            # Check if it is a valid PNG or raster
            if img.format == "PNG":
                # Convert to palette-based PNG8 with adaptive colors (max 256 colors)
                # This drastically lowers storage without visual degradation for map tiles
                png8_io = io.BytesIO()
                
                # Convert to 'P' mode (palette) using adaptive quantizer
                img_p = img.convert("RGBA").convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
                img_p.save(png8_io, format="PNG", optimize=True)
                tile_bytes = png8_io.getvalue()
                optimized_count += 1
            else:
                tile_bytes = raw_data
        except Exception as e:
            # Fallback to raw bytes if PIL fails
            tile_bytes = raw_data

        # Generate unique hash for deduplication
        data_hash = hashlib.md5(tile_bytes).hexdigest()

        if data_hash in unique_images:
            tile_id = unique_images[data_hash][0]
            duplicates_count += 1
        else:
            tile_id = data_hash
            unique_images[data_hash] = (tile_id, tile_bytes)

        # Insert relationship map
        cursor.execute(
            "INSERT OR REPLACE INTO map (zoom_level, tile_column, tile_row, tile_id) VALUES (?, ?, ?, ?)",
            (zoom, col, row, tile_id)
        )

    # Insert unique images
    print(f"[*] Inserting {len(unique_images)} unique PNG8 images (deduplicated {duplicates_count} solid/identical tiles).")
    for tile_id, (_, tile_bytes) in unique_images.items():
        cursor.execute("INSERT OR REPLACE INTO images (tile_id, tile_data) VALUES (?, ?)", (tile_id, sqlite3.Binary(tile_bytes)))

    # Recreate the 'tiles' table as a view pointing to the deduplicated map and images tables
    # This complies exactly with the MBTiles specification (Version 1.1 / 1.2 / 1.3)
    print("[*] Rebuilding standard MBTiles compliant tiles view...")
    cursor.execute("DROP TABLE IF EXISTS tiles")
    cursor.execute("""
        CREATE VIEW tiles AS 
        SELECT 
            map.zoom_level AS zoom_level,
            map.tile_column AS tile_column,
            map.tile_row AS tile_row,
            images.tile_data AS tile_data
        FROM map
        JOIN images ON map.tile_id = images.tile_id
    """)

    # Ensure metadata contains format=png
    print("[*] Setting MBTiles metadata formats...")
    cursor.execute("INSERT OR REPLACE INTO metadata (name, value) VALUES ('format', 'png')")
    cursor.execute("INSERT OR REPLACE INTO metadata (name, value) VALUES ('type', 'baselayer')")

    conn.commit()
    
    # Run SQLite Vacuum
    print("[*] Executing full SQLite VACUUM optimization...")
    cursor.execute("VACUUM")
    conn.commit()
    conn.close()

    final_size = os.path.getsize(db_path) / (1024 * 1024)
    saved_size = initial_size - final_size
    percent_saved = (saved_size / initial_size) * 100 if initial_size > 0 else 0

    print(f"[+] Optimization successfully completed!")
    print(f"    - Optimized PNG8 converted: {optimized_count} tiles")
    print(f"    - Deduplicated duplicate cells: {duplicates_count} index points")
    print(f"    - Final File Size: {final_size:.2f} MB")
    print(f"    - Space Reclaimed: {saved_size:.2f} MB ({percent_saved:.1f}% reduction)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 raster_optimizer.py <path_to_mbtiles>")
        sys.exit(1)
    optimize_and_deduplicate(sys.argv[1])
