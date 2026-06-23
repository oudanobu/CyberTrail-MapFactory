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
    name: "World Basemap",
    chineseName: "全球底图",
    sourceUrl: "https://download.geofabrik.de/index.html",
    bbox: [-180.0, -85.0, 180.0, 85.0],
    description: "Low-resolution global overview containing borders, major water bodies, and continental labels (Zoom 0-5) in Raster PNG format.",
    layerType: "country",
    estimatedSize: "35.4 MB",
    compileTimeSec: 45
  },
  {
    key: "china_overview",
    name: "China Overview",
    chineseName: "中国概况图",
    sourceUrl: "https://download.geofabrik.de/asia/china-latest.osm.pbf",
    bbox: [73.66, 18.16, 135.05, 53.56],
    description: "Medium-resolution national coverage containing administrative lines, national expressways, and primary capital nodes (Zoom 6-8) in Raster PNG format.",
    layerType: "country",
    estimatedSize: "125.8 MB",
    compileTimeSec: 120
  },
  {
    key: "liaoning",
    name: "Liaoning Province",
    chineseName: "辽宁全境图",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [118.84, 38.71, 125.79, 43.43],
    description: "Regional provincial scale containing key roads, primary transit lines, water bodies, and county-level boundaries (Zoom 9-11) in Raster PNG format.",
    parent: "china_overview",
    layerType: "province",
    estimatedSize: "412.5 MB",
    compileTimeSec: 260
  },
  {
    key: "dandong",
    name: "Consolidated Dandong",
    chineseName: "丹东全域详图",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [123.38, 39.73, 125.70, 41.20],
    description: "Consolidated high-resolution detailed tileset (Zoom 12-16, optional 12-17) covering Zhenxing, Yuanbao, Zhenan, Donggang, Fengcheng, and Kuandian merged into a single database.",
    parent: "liaoning",
    layerType: "city",
    estimatedSize: "1.12 GB",
    compileTimeSec: 480
  }
];

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState<MapTarget>(MAP_TARGETS[3]); // Default to Dandong
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

  const getFileContent = () => {
    if (activeFile === 'workflow') {
      return {
        name: ".github/workflows/compile_maps.yml",
        language: "yaml",
        code: `name: Compile Raster PNG Map Pipeline

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      map_target:
        description: 'Compile Target (world, china_overview, liaoning, dandong, or all)'
        required: true
        default: 'dandong'
        type: choice
        options:
          - world
          - china_overview
          - liaoning
          - dandong
          - all

permissions:
  contents: write

jobs:
  build-maps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install GIS Dependencies
        run: |
          sudo apt-get update && sudo apt-get install -y osmium-tool sqlite3
          pip3 install Pillow --break-system-packages

      - name: Slicing and Generating Raster MBTiles
        run: |
          mkdir -p dist data/sources maps
          # Run Slicing & optimization
          bash maps/crop_dandong.sh
          python3 maps/raster_optimizer.py dist/dandong.mbtiles`
      };
    }
    if (activeFile === 'script') {
      return {
        name: "maps/crop_dandong.sh",
        language: "bash",
        code: `#!/usr/bin/env bash
# CyberTrail-MapFactory: Crop Dandong Region (Consolidated BBOX)
# Covers: Zhenxing, Yuanbao, Zhenan, Donggang, Fengcheng, and Kuandian

set -euo pipefail
mkdir -p data

BBOX="123.38,39.73,125.70,41.20"
LIAONING_PBF="data/liaoning.osm.pbf"
DANDONG_PBF="data/dandong.osm.pbf"

if [ ! -f "$LIAONING_PBF" ]; then
    echo "[*] Liaoning source missing. Downloading..."
    wget -c "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf" -O "$LIAONING_PBF"
fi

echo "[*] Slicing consolidated Dandong region from Liaoning dataset..."
osmium extract --bbox "$BBOX" "$LIAONING_PBF" -o "$DANDONG_PBF" --strategy=complete_ways --overwrite
echo "[+] Slicing complete! Output written to: $DANDONG_PBF"`
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
    "name": "World (全球底图)",
    "bbox": [-180.0, -85.0, 180.0, 85.0],
    "zoom_range": "0-5",
    "format": "png"
  },
  "china_overview": {
    "name": "China Overview (中国概况底图)",
    "bbox": [73.66, 18.16, 135.05, 53.56],
    "zoom_range": "6-8",
    "format": "png"
  },
  "liaoning": {
    "name": "Liaoning Province (辽宁省概况底图)",
    "bbox": [118.84, 38.71, 125.79, 43.43],
    "zoom_range": "9-11",
    "format": "png"
  },
  "dandong": {
    "name": "Dandong Region Detail (丹东全境详图)",
    "bbox": [123.38, 39.73, 125.70, 41.20],
    "zoom_range": "12-16",
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
            
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase block mb-2">Production Layers (PNG Raster)</span>
            <div className="space-y-1.5">
              {MAP_TARGETS.map((target) => (
                <button
                  key={target.key}
                  onClick={() => setSelectedTarget(target)}
                  className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                    selectedTarget.key === target.key
                      ? "bg-emerald-950/40 border-emerald-500/50 text-slate-50 shadow-md"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex gap-2.5 items-center min-w-0">
                    <MapPin className={`w-4 h-4 shrink-0 ${selectedTarget.key === target.key ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs truncate">{target.name}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">({target.chineseName})</span>
                      </div>
                      <p className="text-[9px] text-slate-500 truncate">{target.estimatedSize} • {target.compileTimeSec}s est</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedTarget.key === target.key ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              ))}
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
                  {selectedTarget.key === 'dandong' ? `Osmium Slicing, BBox [123.38, 39.73, 125.70, 41.20]` : `Direct Regional Slicing & Extraction`}
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
                  crop_dandong.sh
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
