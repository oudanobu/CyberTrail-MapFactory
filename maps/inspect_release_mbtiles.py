#!/usr/bin/env python3
import os
import sys
import json
import sqlite3
import urllib.request
import urllib.error

# List of files we want to verify
TARGET_FILES = [
    "zhenxing_hd.mbtiles",
    "zhenan_hd.mbtiles",
    "yuanbao_hd.mbtiles",
    "donggang_hd.mbtiles",
    "fengcheng_hd.mbtiles",
    "kuandian_hd.mbtiles"
]

REPO = "oudanobu/CyberTrail-MapFactory"

def fetch_latest_release():
    url = f"https://api.github.com/repos/{REPO}/releases"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberTrailMapFactoryInspector/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            releases = json.loads(res.read().decode('utf-8'))
            if not releases:
                print("[-] No releases found in repository.")
                return None
            
            # Find latest release that has assets
            for r in releases:
                if r.get("assets"):
                    return r
            return releases[0]
    except Exception as e:
        print(f"[-] Error fetching releases from GitHub: {e}")
        return None

def inspect_mbtiles(filepath):
    results = {}
    try:
        conn = sqlite3.connect(filepath)
        cursor = conn.cursor()
        
        # 1. Metadata values
        metadata = {}
        try:
            cursor.execute("SELECT name, value FROM metadata")
            for name, val in cursor.fetchall():
                metadata[name] = val
        except Exception as e:
            metadata["error"] = str(e)
        
        results["metadata_minzoom"] = metadata.get("minzoom", "N/A")
        results["metadata_maxzoom"] = metadata.get("maxzoom", "N/A")
        results["bounds"] = metadata.get("bounds", metadata.get("bbox", "N/A"))
        results["raw_metadata"] = metadata

        # 2. Inquire the tiles table
        try:
            cursor.execute("SELECT MIN(zoom_level), MAX(zoom_level), COUNT(*) FROM tiles")
            actual_min, actual_max, total_count = cursor.fetchone()
            results["actual_minzoom"] = actual_min if actual_min is not None else "N/A"
            results["actual_maxzoom"] = actual_max if actual_max is not None else "N/A"
            results["total_tiles"] = total_count if total_count is not None else 0
        except sqlite3.OperationalError:
            # Maybe the table is named 'map' or something else
            try:
                cursor.execute("SELECT MIN(zoom_level), MAX(zoom_level), COUNT(*) FROM map")
                actual_min, actual_max, total_count = cursor.fetchone()
                results["actual_minzoom"] = actual_min if actual_min is not None else "N/A"
                results["actual_maxzoom"] = actual_max if actual_max is not None else "N/A"
                results["total_tiles"] = total_count if total_count is not None else 0
            except Exception as e:
                results["actual_minzoom"] = "Error"
                results["actual_maxzoom"] = "Error"
                results["total_tiles"] = 0
                results["tiles_error"] = str(e)

        # 3. Zoom level tile breakdown
        zoom_breakdown = {}
        try:
            cursor.execute("SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level ORDER BY zoom_level")
            for z, count in cursor.fetchall():
                zoom_breakdown[int(z)] = count
        except sqlite3.OperationalError:
            try:
                cursor.execute("SELECT zoom_level, COUNT(*) FROM map GROUP BY zoom_level ORDER BY zoom_level")
                for z, count in cursor.fetchall():
                    zoom_breakdown[int(z)] = count
            except Exception:
                pass
        
        results["zoom_breakdown"] = zoom_breakdown
        conn.close()
    except Exception as e:
        results["error"] = str(e)
    
    return results

def download_file(url, local_path):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberTrailMapFactoryInspector/1.0"}
    )
    print(f"[*] Downloading {url} to {local_path}...")
    try:
        with urllib.request.urlopen(req, timeout=60) as response, open(local_path, 'wb') as out_file:
            # Use chunks to avoid keeping the whole file in memory
            meta = response.info()
            file_size = int(meta.get("Content-Length", 0))
            print(f"[*] Size: {file_size / (1024*1024):.2f} MB")
            
            downloaded = 0
            block_size = 8192
            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                downloaded += len(buffer)
                out_file.write(buffer)
                if file_size:
                    percent = downloaded * 100.0 / file_size
                    # print(f"\rDownloading... {percent:.2f}%", end="")
            print("\n[+] Download completed.")
            return True
    except Exception as e:
        print(f"\n[-] Error downloading file: {e}")
        return False

def main():
    print("[*] Contacting GitHub API to retrieve release assets...")
    release = fetch_latest_release()
    if not release:
        print("[-] Could not retrieve release details. Exiting.")
        sys.exit(1)
        
    tag_name = release.get("tag_name", "unknown")
    html_url = release.get("html_url", "")
    print(f"[+] Found release: {tag_name} ({html_url})")
    
    assets = release.get("assets", [])
    asset_map = {a["name"]: a["browser_download_url"] for a in assets}
    
    # Check which targets are available in the release
    available_targets = [f for f in TARGET_FILES if f in asset_map]
    print(f"[+] Available target assets in this release: {available_targets}")
    
    reports = []
    summary_data = {
        "release_tag": tag_name,
        "release_url": html_url,
        "assets_found": len(available_targets),
        "results": {}
    }
    
    temp_mbtiles = "/tmp/release_inspect_temp.mbtiles"
    
    for filename in TARGET_FILES:
        if filename not in asset_map:
            print(f"[-] Asset {filename} is NOT present in the latest release.")
            summary_data["results"][filename] = {
                "status": "Missing",
                "error": "Asset not found in release"
            }
            continue
            
        download_url = asset_map[filename]
        print(f"\n=========================================\nInspecting: {filename}\n=========================================")
        
        # Clean up temp file if exists
        if os.path.exists(temp_mbtiles):
            os.remove(temp_mbtiles)
            
        success = download_file(download_url, temp_mbtiles)
        if not success:
            summary_data["results"][filename] = {
                "status": "Download Failed",
                "error": "Failed to download asset from GitHub"
            }
            continue
            
        print(f"[*] Analyzing SQLite database schema and tile coordinates...")
        analysis = inspect_mbtiles(temp_mbtiles)
        
        # Clean up temp file after analysis to free up disk space
        if os.path.exists(temp_mbtiles):
            os.remove(temp_mbtiles)
            
        summary_data["results"][filename] = {
            "status": "Success",
            "analysis": analysis
        }
        
        # Format individual report
        report_lines = [
            f"### {filename}",
            f"- **Metadata Bounds (bbox)**: `{analysis.get('bounds', 'N/A')}`",
            f"- **Metadata Declared Zoom**: `Min={analysis.get('metadata_minzoom', 'N/A')}, Max={analysis.get('metadata_maxzoom', 'N/A')}`",
            f"- **Actual SQLite Stored Zoom**: `Min={analysis.get('actual_minzoom', 'N/A')}, Max={analysis.get('actual_maxzoom', 'N/A')}`",
            f"- **Total Tiles In Database**: `{analysis.get('total_tiles', 0):,}`",
            "- **Tile Count Breakdown per Zoom Level**:"
        ]
        
        breakdown = analysis.get("zoom_breakdown", {})
        if breakdown:
            for z in sorted(breakdown.keys()):
                report_lines.append(f"  - **Zoom {z}**: `{breakdown[z]:,}` tiles")
        else:
            report_lines.append("  - *No tiles found in database*")
            
        reports.append("\n".join(report_lines))
        
    # Write reports to diagnostic report files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_md_path = os.path.join(script_dir, "release_inspection_report.md")
    out_json_path = os.path.join(script_dir, "release_inspection_report.json")
    
    md_content = f"""# CyberTrail MapFactory Releases Inspection Report

- **Target Repository**: [{REPO}](https://github.com/{REPO})
- **Inspected Release Tag**: `{tag_name}`
- **Release Page**: [GitHub Release URL]({html_url})

---

## 📊 Individual MBTiles File Inspection Findings

{chr(10).join(reports)}

---

## 🔍 Critical Zoom Analysis (Zoom 17-20 Validation)

Based on the findings above, let's verify if zoom levels 17, 18, 19, and 20 are present:
"""

    # Add confirmation analysis lines
    analysis_lines = []
    for filename in TARGET_FILES:
        res_info = summary_data["results"].get(filename, {})
        if res_info.get("status") == "Success":
            analysis = res_info["analysis"]
            breakdown = analysis.get("zoom_breakdown", {})
            has_19 = 19 in breakdown or "19" in breakdown
            has_20 = 20 in breakdown or "20" in breakdown
            has_17_20 = all(z in breakdown for z in [17, 18, 19, 20])
            
            status_text = "✅ **Fully verified (Contains Z17-Z20)**" if has_17_20 else "⚠️ **Incomplete or missing high zoom levels!**"
            details = []
            for z in [17, 18, 19, 20]:
                cnt = breakdown.get(z, breakdown.get(str(z), 0))
                details.append(f"Z{z}: {cnt:,} tiles")
                
            analysis_lines.append(f"- **{filename}**: {status_text} ({', '.join(details)})")
        else:
            analysis_lines.append(f"- **{filename}**: ❌ Asset missing or failed download")
            
    md_content += "\n".join(analysis_lines)
    
    with open(out_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
        
    print(f"\n[+] Inspection reports successfully written to {out_md_path} and {out_json_path}")

if __name__ == "__main__":
    main()
