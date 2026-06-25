#!/usr/bin/env python3
import os
import math
import urllib.request
import urllib.error
import random
import time

# Zhenxing center test bbox (~2km x 2km)
# Center: 124.375°E, 40.110°N
BBOX = [124.365, 40.100, 124.385, 40.120]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 1 << zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    lat_rad = max(-1.4844222291, min(1.4844222291, lat_rad))
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return xtile, ytile

def get_tiles_count(bbox, zoom):
    lon_min, lat_min, lon_max, lat_max = bbox
    x_start, y_start = deg2num(lat_max, lon_min, zoom)
    x_end, y_end = deg2num(lat_min, lon_max, zoom)
    x_min, x_max = min(x_start, x_end), max(x_start, x_end)
    y_min, y_max = min(y_start, y_end), max(y_start, y_end)
    return (x_max - x_min + 1) * (y_max - y_min + 1), (x_min, x_max, y_min, y_max)

def try_download_url(url, timeout=8):
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "image/webp,image/png,image/*;q=0.8"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.status
            data = response.read()
            return data, status, None
    except urllib.error.HTTPError as e:
        return None, e.code, str(e.reason)
    except Exception as e:
        return None, 500, str(e)

def main():
    print("==================================================")
    print("   CyberTrail-MapFactory: OpenTopoMap Diagnostic  ")
    print("==================================================")
    print(f"Test Bounds: {BBOX} (~2km x 2km center of Zhenxing)")
    
    report = []
    report.append("# OpenTopoMap Resolution & Zoom Capacity Diagnostic Report\n")
    report.append(f"- **Test Center Area (2km x 2km)**: `[{BBOX[0]}, {BBOX[1]}, {BBOX[2]}, {BBOX[3]}]` (Zhenxing District Center, Dandong)\n")
    report.append("| Zoom Level | Total Tiles in 2km BBox | Tested Tile Coord (Z/X/Y) | OpenTopoMap HTTP Status | Byte Size | Remarks |")
    report.append("| :--- | :--- | :--- | :--- | :--- | :--- |")

    # We will test zoom 15 to 22
    for z in range(15, 23):
        count, coord_range = get_tiles_count(BBOX, z)
        x_min, x_max, y_min, y_max = coord_range
        # Pick central tile
        cx = (x_min + x_max) // 2
        cy = (y_min + y_max) // 2
        
        # Test OpenTopoMap
        url = f"https://a.tile.opentopomap.org/{z}/{cx}/{cy}.png"
        print(f"[*] Probing Zoom {z}: URL={url}, tile count={count}...")
        
        data, status, err = try_download_url(url)
        
        # Determine size and remarks
        size_str = "N/A"
        remarks = ""
        if status == 200 and data:
            size_str = f"{len(data) / 1024:.2f} KB"
            # Standard tile of OpenTopoMap has some unique features
            if len(data) < 1000:
                remarks = "Extremely small (potentially blank or empty tile)"
            else:
                remarks = "Valid tile image content fetched"
        elif status == 404:
            remarks = "Not Found (Max zoom level limit exceeded by OpenTopoMap)"
        else:
            remarks = f"Error: {status} ({err})"
            
        report.append(f"| Zoom {z} | {count:,} | {z}/{cx}/{cy} | {status} | {size_str} | {remarks} |")
        
        # Sleep a bit to prevent slamming the server
        time.sleep(0.5)

    report_str = "\n".join(report)
    print("\n" + report_str + "\n")
    
    report_file_path = "/maps/diagnostic_report.md"
    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write(report_str)
    print(f"[+] Diagnostic report written to {report_file_path}")

if __name__ == "__main__":
    main()
