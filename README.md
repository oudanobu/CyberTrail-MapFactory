# CyberTrail-MapFactory 🗺️

Automated offline map compilation pipeline for the **CyberTrail Offline Tracker**.

This repository leverages the high-performance [Planetiler](https://github.com/onthegomap/planetiler) mapping engine and [Osmium tool](https://osmcode.org/osmium-tool/) to compile extremely fast and ready-to-use vector `.mbtiles` packages from OpenStreetMap (OSM) data retrieved from Geofabrik.

---

## 🚀 How to Compile Maps

To trigger map compilation manually using GitHub Actions, follow these simple steps:

1. **Navigate to GitHub Actions**
   - Head to your repository page on GitHub and select the **Actions** tab at the top.

2. **Select the Workflow**
   - Click on the **Compile Map Pipeline** workflow from the sidebar on the left.

3. **Open the Execution Panel**
   - Look for the **Run workflow** dropdown menu button on the right side of the workflow page.

4. **Select Target and Trigger**
   - Under the selection parameter **Compile Target** (`map_target`), choose your desired level:
     - `dandong` (Default - automatically cropped from Liaoning OSM dataset)
     - `liaoning` (Liaoning Province)
     - `china` (Full China country dataset)
     - `all` (Compiles all three targets)
   - Click the green **Run workflow** button.

5. **Wait for Compilation to Complete**
   - The runner will establish a clean Java 21 environment, install `osmium-tool` for precise administrative boundary slicing, and run Planetiler stream compression to output your targeted offline database.

6. **Retrieve Your MBTiles from Releases**
   - Upon successful compilation, a timestamped release is automatically published (e.g., `maps-YYYYMMDD-HHMM`).
   - Navigate to the **Releases** section on the right side of the repository home page to download files such as `dandong.mbtiles` or `liaoning.mbtiles`.

---

## 🛠️ Compilation Pipeline Architecture

- **China Compilation**:
  - Raw PBF: [Geofabrik Asia / China](https://download.geofabrik.de/asia/china-latest.osm.pbf)
  - Output: `china.mbtiles`
- **Liaoning Compilation**:
  - Raw PBF: [Geofabrik Asia / China / Liaoning](https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf)
  - Output: `liaoning.mbtiles`
- **Dandong Slicing and Compilation**:
  - Source: Spliced directly from `liaoning-latest.osm.pbf` rather than simple renames to retain geographic accuracy.
  - Slicing tool: `osmium-tool`
  - Bounding Box: `123.38, 39.73, 125.70, 41.20` (Dandong boundaries)
  - Output: `dandong.mbtiles`

---

## 🔮 Future Expansions (Phase 2 Roadmap)
The pipeline is designed to be easily extensible. In Phase 2, additional administrative limits, towns, and international vectors can be seamlessly added:
- Local boundaries: `kuandian.mbtiles`, `shenyang.mbtiles`
- Overseas assets: `tokyo.mbtiles`, `japan.mbtiles`, `usa.mbtiles`
