# CyberTrail-MapFactory 🗺️

Automated offline map compilation pipeline for the **CyberTrail Offline Tracker**.

This repository leverages a custom multi-threaded Python downloading pipeline to fetch raster tiles, perform on-the-fly **PNG8 color quantization**, and package them into optimized SQLite `.mbtiles` containers. This eliminates the heavy Java dependencies previously required by Planetiler and directly builds ready-to-use maps for mobile usage.

---

## 🚀 How to Compile Maps

To trigger map compilation manually using GitHub Actions, follow these simple steps:

1. **Navigate to GitHub Actions**
   - Head to your repository page on GitHub and select the **Actions** tab at the top.

2. **Select the Workflow**
   - Click on the **Compile Raster PNG Map Pipeline** workflow from the sidebar on the left.

3. **Open the Execution Panel**
   - Look for the **Run workflow** dropdown menu button on the right side of the workflow page.

4. **Select Target and Trigger**
   - Under the selection parameter **Compile Target** (`map_target`), choose your desired level:
     - `dandong_detail` (Zoom 12-16 high-resolution coverage)
     - `dandong_overview` (Zoom 9-11 regional coverage)
     - `china` (Zoom 6-8 national expressways)
     - `world` (Zoom 0-5 global basemap)
     - `all` (Default - Compiles all four targets)
   - Click the green **Run workflow** button.

5. **Wait for Compilation to Complete**
   - The runner will launch an 8-thread Python process to download requested bounds from the configured map tile source, optimize colors for memory savings, and build your targeted offline database.

6. **Retrieve Your MBTiles from Releases**
   - Upon successful compilation, a timestamped release is automatically published (e.g., `maps-raster-YYYYMMDD-HHMM`).
   - Navigate to the **Releases** section on the right side of the repository home page to download files such as `dandong_detail.mbtiles` or `china.mbtiles`.

---

## 🛠️ Compilation Pipeline Architecture

The pipeline uses `maps/map_config.json` to define remote sources (`opentopomap`, `local`, `selfhosted`).

- **World Overview (0-5)**:
  - Output: `world.mbtiles`
- **China Overview (6-8)**:
  - Output: `china.mbtiles`
- **Dandong Overview (9-11)**:
  - Output: `dandong_overview.mbtiles`
- **Dandong Detailed (12-16)**:
  - Output: `dandong_detail.mbtiles`

All generated outputs are converted into a normalized schema with **PNG8 indexed compression** and aggressive deduplication, often reducing final file sizes by 40-60%.
