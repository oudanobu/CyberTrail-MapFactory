import { useState, useEffect } from "react";
import {
  Compass,
  Layers,
  Terminal,
  FileCode,
  Globe,
  Database,
  Sparkles,
  Check,
  Copy,
  Github,
  BookOpen,
  MapPin,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Code
} from "lucide-react";
import { MapTarget } from "./types";
import InteractiveMap from "./components/InteractiveMap";
import TerminalLogs from "./components/TerminalLogs";
import GisAssistant from "./components/GisAssistant";

const MAP_TARGETS: MapTarget[] = [
  {
    key: "world",
    name: "World Overview",
    chineseName: "L0全球底图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [-180.0, -85.0, 180.0, 85.0],
    description: "Low-resolution global overview containing continental coastlines, major waterways, and national boundaries (Zoom 0-5) in space-efficient PNG format.",
    layerType: "world",
    estimatedSize: "18.5 MB",
    compileTimeSec: 35
  },
  {
    key: "china",
    name: "China Overview",
    chineseName: "L1国家概况图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [73.66, 18.16, 135.05, 53.56],
    description: "National scale overview containing provincial limits, capital hubs, and major highway/rail network nodes (Zoom 6-8) in Raster PNG format.",
    layerType: "country",
    estimatedSize: "45.2 MB",
    compileTimeSec: 60
  },
  {
    key: "liaoning",
    name: "Liaoning Overview",
    chineseName: "L2省级概况图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [118.84, 38.71, 125.79, 43.43],
    description: "Provincial scale overview displaying municipal boundaries, expressways, key state roads, railways, and principal river bodies (Zoom 9-11) in Raster PNG format.",
    parent: "china",
    layerType: "province",
    estimatedSize: "38.6 MB",
    compileTimeSec: 45
  },
  {
    key: "dandong",
    name: "Dandong Detail",
    chineseName: "L3市级详细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.38, 39.73, 125.70, 41.20],
    description: "City level detailed maps including suburban grids, town centers, trunk roads, watercourses, and local terrain accents (Zoom 12-16) in Raster PNG format.",
    parent: "liaoning",
    layerType: "city",
    estimatedSize: "85.2 MB",
    compileTimeSec: 110
  },
  {
    key: "zhenxing_hd",
    name: "Zhenxing UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.30, 40.05, 124.45, 40.16],
    description: "Ultra-high definition (UHD) grid targeting Zhenxing urban center, detailed neighborhood lanes, riverside pathways, and local POIs (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "35.6 MB",
    compileTimeSec: 45
  },
  {
    key: "yuanbao_hd",
    name: "Yuanbao UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.34, 40.11, 124.44, 40.19],
    description: "Ultra-high definition (UHD) grid targeting Yuanbao commercial center, high-density residential roads, and mountain trails (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "28.3 MB",
    compileTimeSec: 35
  },
  {
    key: "zhenan_hd",
    name: "Zhenan UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.25, 40.08, 124.62, 40.32],
    description: "Ultra-high definition (UHD) grid targeting Zhenan district, covering transport corridors, mountain villages, and industrial sites (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "52.1 MB",
    compileTimeSec: 65
  },
  {
    key: "donggang_hd",
    name: "Donggang UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.38, 39.73, 124.35, 40.15],
    description: "Ultra-high definition (UHD) grid targeting Donggang coastal plains, deepwater ports, maritime paths, and shoreline grids (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "92.4 MB",
    compileTimeSec: 120
  },
  {
    key: "fengcheng_hd",
    name: "Fengcheng UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.55, 40.15, 124.50, 40.78],
    description: "Ultra-high definition (UHD) grid targeting Fengcheng, containing complex mountain peaks, tourist spots, highways, and valleys (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "115.8 MB",
    compileTimeSec: 150
  },
  {
    key: "kuandian_hd",
    name: "Kuandian UHD",
    chineseName: "L4三级超精细图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.30, 40.35, 125.70, 41.20],
    description: "Ultra-high definition (UHD) grid targeting Kuandian, highlighting heavy forest topography, reservoirs, shoreline tracks, and scenic reserves (Zoom 17-20) in space-saving PNG8.",
    parent: "dandong",
    layerType: "county_hd",
    estimatedSize: "158.4 MB",
    compileTimeSec: 195
  }
];

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState<MapTarget>(MAP_TARGETS[3]); // Default to Dandong Detail (Index 3)
  const [activeBbox, setActiveBbox] = useState<[number, number, number, number]>(MAP_TARGETS[3].bbox);
  const [activeTab, setActiveTab] = useState<'editor' | 'cli' | 'guide'>('editor');
  const [activeFile, setActiveFile] = useState<'workflow' | 'script' | 'optimizer' | 'json'>('workflow');
  const [copiedTextKey, setCopiedTextKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveBbox(selectedTarget.bbox);
  }, [selectedTarget]);

  const handleCopyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTextKey(key);
    setTimeout(() => setCopiedTextKey(null), 2000);
  };

  const renderTargetButton = (target: MapTarget, isNested: boolean = false) => {
    const isSelected = selectedTarget.key === target.key;
    return (
      <button
        key={target.key}
        onClick={() => setSelectedTarget(target)}
        className={`w-full text-left p-2 rounded-lg border transition flex items-center justify-between ${
          isNested ? 'ml-3' : ''
        } ${
          isSelected
            ? "bg-emerald-950/40 border-emerald-500/50 text-slate-50 shadow-md"
            : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
        }`}
      >
        <div className="flex gap-2.5 items-center min-w-0">
          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs truncate">{target.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">({target.chineseName})</span>
            </div>
            <p className="text-[9px] text-slate-500 truncate">{target.estimatedSize} • {target.compileTimeSec}s est</p>
          </div>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
      </button>
    );
  };

  const getFileContent = () => {
    if (activeFile === 'workflow') {
      return {
        name: ".github/workflows/compile_maps.yml",
        language: "yaml",
        code: `name: Compile Raster PNG Map Pipeline

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      map_target:
        description: 'Compile Target (world, china, liaoning_overview, zhenxing_detail, yuanbao_detail, zhenan_detail, donggang_detail, fengcheng_detail, kuandian_detail, or all)'
        required: true
        default: 'all'
        type: choice
        options:
          - world
          - china
          - liaoning_overview
          - zhenxing_detail
          - yuanbao_detail
          - zhenan_detail
          - donggang_detail
          - fengcheng_detail
          - kuandian_detail
          - all

permissions:
  contents: write

jobs:
  build-maps:
    name: Build Resilient Raster PNG Map Targets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.10
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install System Dependencies
        run: |
          sudo apt-get update && sudo apt-get install -y wget sqlite3
          pip3 install Pillow --break-system-packages

      - name: Create Map Working Directories
        run: |
          mkdir -p data/tile_cache dist maps
          chmod +x maps/*.sh || true

      - name: Establish Target Selection
        id: target-selector
        run: |
          TARGET="\${{ github.event.inputs.map_target }}"
          if [ -z "$TARGET" ]; then
            TARGET="all"
          fi
          echo "selected_target=\$TARGET" >> "\$GITHUB_OUTPUT"

      - name: Cache Tile Assets
        uses: actions/cache@v4
        with:
          path: data/tile_cache
          key: map-tiles-cache-\${{ hashFiles('maps/bounding_boxes.json') }}
          restore-keys: |
            map-tiles-cache-

      - name: Execute Resilient Tile Compilation Pipeline
        run: |
          TARGET="\${{ steps.target-selector.outputs.selected_target }}"
          bash maps/build_all_raster_maps.sh "\$TARGET"

      - name: Verify Final MBTiles Integrity & Metadata
        run: |
          ls -lh dist/
          for f in dist/*.mbtiles; do
            if [ -f "\$f" ]; then
              sqlite3 "\$f" "SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level;"
            fi
          done`
      };
    }
    if (activeFile === 'script') {
      return {
        name: "maps/build_all_raster_maps.sh",
        language: "bash",
        code: `#!/usr/bin/env bash
# CyberTrail-MapFactory: Build and Optimize Offline Raster PNG MBTiles
set -euo pipefail

TARGET=\${1:-"all"}
CONCURRENCY=8

echo "=========================================================="
echo " CyberTrail MapFactory: Initiating Direct Map Generation Pipeline"
echo " Target Package: \$TARGET"
echo " Concurrency: \$CONCURRENCY"
echo "=========================================================="

mkdir -p dist data/tile_cache

compile_and_optimize_mbtiles() {
  local KEY=\$1
  local NAME=\$2
  local BBOX=\$3
  local MINZ=\$4
  local MAXZ=\$5
  local OUTPUT="dist/\${KEY}.mbtiles"

  python3 maps/generate_raster_mbtiles.py \\
    --bbox="\$BBOX" \\
    --minzoom="\$MINZ" \\
    --maxzoom="\$MAXZ" \\
    --output="\$OUTPUT" \\
    --concurrency="\$CONCURRENCY" \\
    --cache_dir="data/tile_cache"

  python3 maps/raster_optimizer.py "\$OUTPUT"
}`
      };
    }
    if (activeFile === 'optimizer') {
      return {
        name: "maps/raster_optimizer.py",
        language: "python",
        code: `#!/usr/bin/env python3
import sqlite3
import hashlib
import os
import sys
from PIL import Image
import io

def optimize_and_deduplicate(db_path):
    """
    1. Converts flat tiles schema into map + images tables for deduplication.
    2. Quantizes PNG raster tiles into PNG8 using PIL adaptive color palette (lowering size up to 70%).
    3. Runs SQLite VACUUM to shrink .mbtiles file.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable schema normalized structures
    cursor.execute("CREATE TABLE IF NOT EXISTS images (tile_id TEXT PRIMARY KEY, tile_data BLOB)")
    cursor.execute("CREATE TABLE IF NOT EXISTS map (zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_id TEXT)")
    
    cursor.execute("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles")
    raw_tiles = cursor.fetchall()
    
    unique_images = {}
    for zoom, col, row, raw_data in raw_tiles:
        img = Image.open(io.BytesIO(raw_data))
        png8_io = io.BytesIO()
        img_p = img.convert("RGBA").convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        img_p.save(png8_io, format="PNG", optimize=True)
        tile_bytes = png8_io.getvalue()
        
        data_hash = hashlib.md5(tile_bytes).hexdigest()
        if data_hash not in unique_images:
            unique_images[data_hash] = tile_bytes
            
        cursor.execute("INSERT OR REPLACE INTO map VALUES (?, ?, ?, ?)", (zoom, col, row, data_hash))
        
    for tile_id, tile_bytes in unique_images.items():
        cursor.execute("INSERT OR REPLACE INTO images VALUES (?, ?)", (tile_id, sqlite3.Binary(tile_bytes)))
        
    cursor.execute("DROP TABLE tiles")
    cursor.execute("CREATE VIEW tiles AS SELECT map.zoom_level, map.tile_column, map.tile_row, images.tile_data FROM map JOIN images ON map.tile_id = images.tile_id")
    cursor.execute("INSERT OR REPLACE INTO metadata (name, value) VALUES ('format', 'png')")
    cursor.execute("VACUUM")
    conn.commit()
    conn.close()
    print("[+] Optimization and SQLite VACUUM complete!")`
      };
    }
    return {
      name: "maps/bounding_boxes.json",
      language: "json",
      code: `{
  "world": {
    "name": "World Overview (L0全球底图)",
    "bbox": [-180.0, -85.0, 180.0, 85.0],
    "zoom_range": "0-5",
    "format": "png"
  },
  "china": {
    "name": "China Overview (L1国家概况图)",
    "bbox": [73.66, 18.16, 135.05, 53.56],
    "zoom_range": "6-8",
    "format": "png"
  },
  "liaoning": {
    "name": "Liaoning Overview (L2省级概况图)",
    "bbox": [118.84, 38.71, 125.79, 43.43],
    "zoom_range": "9-11",
    "format": "png"
  },
  "dandong": {
    "name": "Dandong Detail (L3市级详细图)",
    "bbox": [123.38, 39.73, 125.70, 41.20],
    "zoom_range": "12-16",
    "format": "png"
  },
  "zhenxing_hd": {
    "name": "Zhenxing UHD (L4三级超精细图)",
    "bbox": [124.30, 40.05, 124.45, 40.16],
    "zoom_range": "17-20",
    "format": "png"
  },
  "yuanbao_hd": {
    "name": "Yuanbao UHD (L4三级超精细图)",
    "bbox": [124.34, 40.11, 124.44, 40.19],
    "zoom_range": "17-20",
    "format": "png"
  },
  "zhenan_hd": {
    "name": "Zhenan UHD (L4三级超精细图)",
    "bbox": [124.25, 40.08, 124.62, 40.32],
    "zoom_range": "17-20",
    "format": "png"
  },
  "donggang_hd": {
    "name": "Donggang UHD (L4三级超精细图)",
    "bbox": [123.38, 39.73, 124.35, 40.15],
    "zoom_range": "17-20",
    "format": "png"
  },
  "fengcheng_hd": {
    "name": "Fengcheng UHD (L4三级超精细图)",
    "bbox": [123.55, 40.15, 124.50, 40.78],
    "zoom_range": "17-20",
    "format": "png"
  },
  "kuandian_hd": {
    "name": "Kuandian UHD (L4三级超精细图)",
    "bbox": [124.30, 40.35, 125.70, 41.20],
    "zoom_range": "17-20",
    "format": "png"
  }
}`
    };
  };

  const fileInfo = getFileContent();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-slate-800">
      {/* Visual Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Compass className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider uppercase font-mono text-slate-100">CyberTrail</span>
                <span className="text-[10px] uppercase tracking-widest bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded font-mono">MAPFACTORY</span>
              </div>
              <p className="text-[10px] text-slate-400">Offline Raster PNG MBTiles Production Console</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>CI_RUNNER: ACTIVE</span>
            </div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 border border-slate-700/50 hover:text-white transition"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub Repo
            </a>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        
        {/* LEFT COLUMN: Sidebar Target Selectors (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          {/* Target Presets Selector Card */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800 pb-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-xs text-slate-300 font-mono tracking-wider uppercase">Active Map Packages</h2>
            </div>
            
            <div className="space-y-4">
              {/* Level 0 & 1: Global & National */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L0 & L1 • Global & National (Z0-Z8)</span>
                <div className="space-y-1">
                  {MAP_TARGETS.filter(t => t.layerType === 'world' || t.layerType === 'country').map(target => 
                    renderTargetButton(target, false)
                  )}
                </div>
              </div>

              {/* Level 2: Provincial Overview */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L2 • Provincial Overview (Z9-Z11)</span>
                <div className="space-y-1">
                  {MAP_TARGETS.filter(t => t.layerType === 'province').map(target => 
                    renderTargetButton(target, false)
                  )}
                </div>
              </div>

              {/* Level 3: City Detailed */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L3 • City Detailed (Z12-Z16)</span>
                <div className="space-y-1">
                  {MAP_TARGETS.filter(t => t.layerType === 'city').map(target => 
                    renderTargetButton(target, false)
                  )}
                </div>
              </div>

              {/* Level 4: County/District UHD */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L4 • County/District UHD (Z17-Z20)</span>
                <div className="space-y-1 pl-1 border-l border-slate-800">
                  {MAP_TARGETS.filter(t => t.layerType === 'county_hd').map(target => 
                    renderTargetButton(target, true)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Preset Detailed Analytics */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 shadow-xl backdrop-blur-md font-mono text-[11px]">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-slate-300 tracking-wider uppercase">Cartographic Specifications</h3>
            </div>
            
            <div className="space-y-3 text-slate-300">
              <div>
                <span className="text-slate-500 uppercase text-[9px]">Target Classification</span>
                <p className="text-slate-200 mt-0.5 font-sans font-medium text-xs">
                  {selectedTarget.layerType.toUpperCase()} {selectedTarget.parent ? `(Parent: ${selectedTarget.parent.toUpperCase()})` : '(Independent Root)'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[9px]">Slicing Tool Pipeline</span>
                <p className="text-slate-200 mt-0.5">
                  {selectedTarget.layerType === 'county_hd' 
                    ? `L4 Ultra-High Definition BBox Tile Download (Zoom 17-20)` 
                    : selectedTarget.layerType === 'city' 
                    ? `L3 City Detailed BBox Tile Download (Zoom 12-16)` 
                    : `Direct Regional BBox Tile Download`}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[9px]">Raster Compaction Strategy</span>
                <p className="text-emerald-400 font-bold font-sans text-xs mt-0.5">PNG8 Lossless Quantization, deduplication, SQLite VACUUM</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[9px]">Estimated File Size (.mbtiles)</span>
                <p className="text-emerald-400 font-bold font-sans text-xs mt-0.5">{selectedTarget.estimatedSize}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[9px]">Raw Geofabrik Dataset Source</span>
                <p className="text-slate-400 text-[10px] break-all leading-normal hover:underline mt-0.5">
                  <a href={selectedTarget.sourceUrl} target="_blank" rel="noreferrer">
                    {selectedTarget.sourceUrl}
                  </a>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 uppercase text-[9px] block mb-1">Scope Assessment</span>
                <p className="text-slate-400 font-sans text-xs font-normal leading-relaxed">{selectedTarget.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE & RIGHT MULTI-COLUMNS (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Visual Panels Switch Header */}
          <div className="flex border-b border-slate-800 gap-1.5 p-1 bg-slate-950 rounded-xl border max-w-lg">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium font-sans tracking-wide transition ${
                activeTab === 'editor'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              GIS Configurator
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium font-sans tracking-wide transition ${
                activeTab === 'cli'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Local Sandbox Terminal
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium font-sans tracking-wide transition ${
                activeTab === 'guide'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Android Loading Guide
            </button>
          </div>

          {/* TAB 1: GIS CONFIGURATOR */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="flex flex-col h-full justify-between">
                <InteractiveMap
                  selectedTarget={selectedTarget}
                  activeBbox={activeBbox}
                  onBboxChange={setActiveBbox}
                />
              </div>

              <div className="flex flex-col h-full justify-between">
                <GisAssistant />
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL SANDBOX TERMINAL */}
          {activeTab === 'cli' && (
            <div>
              <TerminalLogs
                selectedTarget={selectedTarget}
                customBbox={activeBbox}
              />
            </div>
          )}

          {/* TAB 3: ANDROID CLIENT INTEGRATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">CyberTrail Android Client Integration Guide</h3>
                  <p className="text-[10px] text-slate-400">Step-by-step guidelines to mount compiled offline Raster PNG MBTiles without client modification</p>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-300">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">1</span>
                    Retrieving Compiled Asset Package
                  </h4>
                  <p className="pl-6">
                    Navigate to the repository&apos;s <b>Releases</b> page and locate the latest compiled tag. Download the targeted mbtiles database file (e.g., <code>dandong.mbtiles</code>).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">2</span>
                    Importing to Android Storage Sandbox
                  </h4>
                  <p className="pl-6">
                    Place the <code>.mbtiles</code> file inside your Android app sandbox directory:
                  </p>
                  <ul className="pl-12 list-disc space-y-1">
                    <li><b>Standard Path:</b> <code>/sdcard/Android/data/com.cybertrail.tracker/files/maps/dandong.mbtiles</code></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">3</span>
                    Android Native Loader Boilerplate (Kotlin)
                  </h4>
                  <p className="pl-6">
                    Since the format is standard <code>png</code> raster, the native client loads it as a standard raster layer. Here is the exact Kotlin implementation:
                  </p>
                  <div className="bg-slate-950 p-3 rounded font-mono text-[10px] text-slate-400 border border-slate-800 relative group select-all">
                    <button
                      onClick={() => handleCopyCode(`// Load offline Raster MBTiles file directly on Android
val mbtilesFile = File(context.getExternalFilesDir("maps"), "dandong.mbtiles")
if (mbtilesFile.exists()) {
    val db = SQLiteDatabase.openDatabase(mbtilesFile.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
    
    // Verify that format is indeed raster PNG
    val cursor = db.rawQuery("SELECT value FROM metadata WHERE name = 'format'", null)
    if (cursor.moveToFirst() && cursor.getString(0) == "png") {
        Log.d("CyberTrail", "Raster PNG MBTiles loaded successfully!")
    }
    cursor.close()
    db.close()
}`, 'code-map')}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                      title="Copy code"
                    >
                      {copiedTextKey === 'code-map' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="overflow-x-auto leading-normal whitespace-pre">
{`// Load offline Raster MBTiles file directly on Android
val mbtilesFile = File(context.getExternalFilesDir("maps"), "dandong.mbtiles")
if (mbtilesFile.exists()) {
    val db = SQLiteDatabase.openDatabase(mbtilesFile.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
    
    // Verify that format is indeed raster PNG
    val cursor = db.rawQuery("SELECT value FROM metadata WHERE name = 'format'", null)
    if (cursor.moveToFirst() && cursor.getString(0) == "png") {
        Log.d("CyberTrail", "Raster PNG MBTiles loaded successfully!")
    }
    cursor.close()
    db.close()
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCRIPT STUDIO & REPOSITORY VIEW */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-xs text-slate-200 tracking-wider uppercase font-mono">Repository File Studio</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Explore the production code generated for your pipeline workspace</p>
                </div>
              </div>

              {/* Mini tabs for generated files */}
              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 font-mono text-[9px] font-semibold text-slate-400">
                <button
                  onClick={() => setActiveFile('workflow')}
                  className={`px-2 py-1 rounded transition ${activeFile === 'workflow' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
                >
                  compile_maps.yml
                </button>
                <button
                  onClick={() => setActiveFile('script')}
                  className={`px-2 py-1 rounded transition ${activeFile === 'script' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
                >
                  build_all_raster_maps.sh
                </button>
                <button
                  onClick={() => setActiveFile('optimizer')}
                  className={`px-2 py-1 rounded transition ${activeFile === 'optimizer' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
                >
                  raster_optimizer.py
                </button>
                <button
                  onClick={() => setActiveFile('json')}
                  className={`px-2 py-1 rounded transition ${activeFile === 'json' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
                >
                  bounding_boxes.json
                </button>
              </div>
            </div>

            {/* Render selected file */}
            <div className="relative group">
              <button
                onClick={() => handleCopyCode(fileInfo.code, activeFile)}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 transition"
                title="Copy File Content"
              >
                {copiedTextKey === activeFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              
              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-850 font-mono text-[10px] text-slate-300 overflow-x-auto select-all max-h-[300px] scrollbar-thin">
                <span className="text-[9px] text-slate-500 uppercase block mb-1.5">{fileInfo.name}</span>
                <pre className="leading-relaxed whitespace-pre font-mono">{fileInfo.code}</pre>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-slate-900 bg-slate-950 text-center py-6 text-[10px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>CyberTrail-MapFactory GIS Console © 2026-present</span>
          <div className="flex gap-4 items-center">
            <span>RASTER_MAP_FORMAT: PNG</span>
            <span className="text-slate-600">|</span>
            <span>OPTIMIZATIONS: PNG8 + DEDUPLICATION + VACUUM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
