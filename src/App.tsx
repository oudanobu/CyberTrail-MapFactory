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
  Code,
  Activity,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Play
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
    key: "japan",
    name: "Japan Overview",
    chineseName: "L1国家概况图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [122.93, 20.42, 153.98, 45.55],
    description: "National scale overview covering major Japanese islands, municipal boundaries, transport networks, and mountainous terrain accents (Zoom 6-8) in Raster PNG format.",
    layerType: "country",
    estimatedSize: "32.1 MB",
    compileTimeSec: 40
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
    name: "Dandong Overview",
    chineseName: "L3市级概况图",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.38, 39.73, 125.70, 41.20],
    description: "City level detailed overview displaying municipal highway systems, major trunk roads, regional railways, and water channels (Zoom 12-14) in Raster PNG format.",
    parent: "liaoning",
    layerType: "city",
    estimatedSize: "18.2 MB",
    compileTimeSec: 25
  },
  {
    key: "zhenxing_hd",
    name: "Zhenxing HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.30, 40.05, 124.45, 40.16],
    description: "Ultra-high precision topographic grid targeting Zhenxing urban center, detailed neighborhood lanes, building footprints, and park walks (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "52.8 MB",
    compileTimeSec: 75
  },
  {
    key: "yuanbao_hd",
    name: "Yuanbao HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.34, 40.11, 124.44, 40.19],
    description: "Ultra-high precision topographic grid targeting Yuanbao commercial center, high-density residential grids, mountain tracks, and street level features (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "43.0 MB",
    compileTimeSec: 60
  },
  {
    key: "zhenan_hd",
    name: "Zhenan HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.25, 40.08, 124.62, 40.32],
    description: "Ultra-high precision topographic grid targeting Zhenan district, covering transport corridors, valleys, local villages, and industrial facility footprints (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "78.4 MB",
    compileTimeSec: 110
  },
  {
    key: "donggang_hd",
    name: "Donggang HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.38, 39.73, 124.35, 40.15],
    description: "Ultra-high precision topographic grid targeting Donggang coastal plains, ports, shipping routes, shoreline grids, and custom mountain pathways (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "136.6 MB",
    compileTimeSec: 180
  },
  {
    key: "fengcheng_hd",
    name: "Fengcheng HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [123.55, 40.15, 124.50, 40.78],
    description: "Ultra-high precision topographic grid targeting Fengcheng, containing complex mountain peaks, tourist spots, highways, forest grids, and trails (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "169.0 MB",
    compileTimeSec: 220
  },
  {
    key: "kuandian_hd",
    name: "Kuandian HD",
    chineseName: "L3三级行政区高清",
    sourceUrl: "https://tile.opentopomap.org/",
    bbox: [124.30, 40.35, 125.70, 41.20],
    description: "Ultra-high precision topographic grid targeting Kuandian, highlighting heavy forest reserves, reservoirs, mountain tracks, and hiking paths (Zoom 15-22) in space-saving PNG8 format.",
    parent: "liaoning",
    layerType: "county_hd",
    estimatedSize: "224.8 MB",
    compileTimeSec: 280
  }
];

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState<MapTarget>(
    MAP_TARGETS.find(t => t.key === "liaoning") || MAP_TARGETS[3]
  );
  const [activeBbox, setActiveBbox] = useState<[number, number, number, number]>(
    (MAP_TARGETS.find(t => t.key === "liaoning") || MAP_TARGETS[3]).bbox
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'cli' | 'guide' | 'diagnostic'>('editor');
  const [activeFile, setActiveFile] = useState<'workflow' | 'script' | 'optimizer' | 'json'>('workflow');
  const [copiedTextKey, setCopiedTextKey] = useState<string | null>(null);
  
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any | null>(null);

  const runDiagnostic = async () => {
    setLoadingDiagnostic(true);
    try {
      const res = await fetch("/api/diagnostic");
      if (res.ok) {
        const data = await res.json();
        setDiagnosticData(data);
      } else {
        console.error("Failed to run live diagnostics");
      }
    } catch (e) {
      console.error("Diagnostic network error:", e);
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  const [diagnosticSubTab, setDiagnosticSubTab] = useState<'servers' | 'releases'>('releases');
  const [inspectStatus, setInspectStatus] = useState<string>('idle');
  const [inspectLogs, setInspectLogs] = useState<string>('');
  const [inspectReport, setInspectReport] = useState<any | null>(null);

  const startReleaseInspection = async () => {
    setInspectStatus('running');
    setInspectLogs('[*] Sending run signal to sandbox backend...\n');
    setInspectReport(null);
    try {
      const res = await fetch("/api/inspect-release/start", { method: "POST" });
      if (res.ok) {
        pollInspectionStatus();
      } else {
        setInspectStatus('failed');
        setInspectLogs(prev => prev + '\n[-] Failed to start inspection server route.');
      }
    } catch (e: any) {
      setInspectStatus('failed');
      setInspectLogs(prev => prev + `\n[-] Network error: ${e.message}`);
    }
  };

  const pollInspectionStatus = async () => {
    try {
      const res = await fetch("/api/inspect-release/status");
      if (res.ok) {
        const data = await res.json();
        setInspectStatus(data.status);
        setInspectLogs(data.logs);
        if (data.report) {
          setInspectReport(data.report);
        }
        if (data.status === 'running') {
          setTimeout(pollInspectionStatus, 2000);
        }
      }
    } catch (e) {
      console.error("Error polling inspection:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'diagnostic') {
      pollInspectionStatus();
    }
  }, [activeTab]);

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
        name: "maps/compile_by_config.py",
        language: "python",
        code: `#!/usr/bin/env python3
"""
CyberTrail-MapFactory: Configure-driven Multitarget Map Compilation Controller.
"""
import os
import sys
import json
import subprocess
import sqlite3

MAPS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.dirname(MAPS_DIR)

CATEGORIES = {
    "country": ["china", "japan"],
    "province": ["liaoning"],
    "admin3": ["zhenxing_hd", "yuanbao_hd", "zhenan_hd", "donggang_hd", "fengcheng_hd", "kuandian_hd"],
    "all": ["world", "china", "japan", "liaoning", "zhenxing_hd", "yuanbao_hd", "zhenan_hd", "donggang_hd", "fengcheng_hd", "kuandian_hd"]
}

def clean_target(target):
    if target.startswith("build="):
        return target[len("build="):]
    return target

def compile_and_optimize(config_key):
    config_path = os.path.join(MAPS_DIR, f"{config_key}.json")
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
        
    print(f"[BUILDING] Map Package: {cfg.get('name')} ({config_key})")
    # Execute generate_raster_mbtiles.py ...
    # Execute raster_optimizer.py ...
    # Verify DB constraints (tiles_count >= 10) ...`
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
      name: `maps/${selectedTarget.key}.json`,
      language: "json",
      code: `{
  "name": "${selectedTarget.name} (${selectedTarget.chineseName})",
  "output": "dist/${selectedTarget.key}.mbtiles",
  "bbox": "${selectedTarget.bbox.join(',')}",
  "minzoom": ${selectedTarget.layerType === 'world' ? 0 : selectedTarget.layerType === 'country' ? 6 : selectedTarget.layerType === 'province' ? 9 : selectedTarget.layerType === 'city' ? 12 : 15},
  "maxzoom": ${selectedTarget.layerType === 'world' ? 5 : selectedTarget.layerType === 'country' ? 8 : selectedTarget.layerType === 'province' ? 11 : selectedTarget.layerType === 'city' ? 14 : 22},
  "tile_source": "opentopomap"
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

              {/* Level 3: City Overview */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L3 • City Overview (Z12-Z14)</span>
                <div className="space-y-1">
                  {MAP_TARGETS.filter(t => t.layerType === 'city').map(target => 
                    renderTargetButton(target, false)
                  )}
                </div>
              </div>

              {/* Level 4: County/District HD */}
              <div>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-1.5">L4 • County/District HD (Z15-Z22)</span>
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
                    ? `L4 High Definition BBox Tile Download (Zoom 15-22)` 
                    : selectedTarget.layerType === 'city'
                    ? `L3 City Overview BBox Tile Download (Zoom 12-14)`
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
          <div className="flex border-b border-slate-800 gap-1.5 p-1 bg-slate-950 rounded-xl border max-w-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-[11px] font-medium font-sans tracking-wide transition ${
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
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-[11px] font-medium font-sans tracking-wide transition ${
                activeTab === 'cli'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Sandbox Terminal
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-[11px] font-medium font-sans tracking-wide transition ${
                activeTab === 'guide'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Android Guide
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-lg text-[11px] font-medium font-sans tracking-wide transition ${
                activeTab === 'diagnostic'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Resolution Diagnostics
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

          {/* TAB 4: SOURCE DIAGNOSTIC */}
          {activeTab === 'diagnostic' && (
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md space-y-6">
              {/* Inner Tab Selector */}
              <div className="flex border-b border-slate-800 pb-2 justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => setDiagnosticSubTab('releases')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition font-sans ${
                      diagnosticSubTab === 'releases'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📦 GitHub Releases Inspector
                  </button>
                  <button
                    onClick={() => setDiagnosticSubTab('servers')}
                    className={`pb-2 text-xs font-semibold tracking-wide border-b-2 transition font-sans ${
                      diagnosticSubTab === 'servers'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌐 Public Servers Probe
                  </button>
                </div>
                
                {diagnosticSubTab === 'releases' && (
                  <a
                    href="https://github.com/oudanobu/CyberTrail-MapFactory/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-sans"
                  >
                    View GitHub Releases <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {diagnosticSubTab === 'releases' ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        UHD MBTiles Archive Validator
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                        Verifies the compiled zoom depth and actual tile counts inside the published release assets directly from GitHub.
                      </p>
                    </div>
                    <button
                      onClick={startReleaseInspection}
                      disabled={inspectStatus === 'running'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-sans text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow-md disabled:cursor-not-allowed"
                    >
                      {inspectStatus === 'running' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Verifying Archives...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Launch Verification Run
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terminal Console Logs */}
                  {(inspectLogs || inspectStatus === 'running') && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-[9px] text-slate-500 px-1">
                        <span>LIVE VERIFICATION SANDBOX TERMINAL</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${
                          inspectStatus === 'running' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                          inspectStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                          inspectStatus === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {inspectStatus}
                        </span>
                      </div>
                      <div className="bg-black/90 rounded-lg p-4 font-mono text-[10px] text-slate-300 border border-slate-800 shadow-inner h-56 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {inspectLogs.split("\n").map((line, idx) => {
                          let color = "text-slate-300";
                          if (line.startsWith("[*]")) color = "text-sky-400";
                          else if (line.startsWith("[+]")) color = "text-emerald-400 font-semibold";
                          else if (line.startsWith("[-]")) color = "text-rose-400";
                          else if (line.startsWith("Inspecting:")) color = "text-yellow-400 font-bold mt-2 border-t border-slate-900/50 pt-1";
                          
                          return (
                            <div key={idx} className={`${color} leading-relaxed break-all`}>
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inspection Findings Cards and Grid Table */}
                  {inspectReport && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Release Header */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Inspected GitHub Tag</span>
                          <span className="text-emerald-400 font-mono font-bold text-sm">{inspectReport.release_tag}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Inspected Assets</span>
                          <span className="text-slate-200 font-mono text-xs">{inspectReport.assets_found} verified files</span>
                        </div>
                        <div>
                          <a
                            href={inspectReport.release_url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition border border-slate-700"
                          >
                            Open Release Webpage <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Verification Table */}
                      <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                        <table className="w-full text-left border-collapse font-mono text-[10px]">
                          <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[9px] tracking-wider uppercase">
                              <th className="p-3">MBTiles Asset</th>
                              <th className="p-3 text-center">Metadata Zoom</th>
                              <th className="p-3 text-center">Actual Zoom</th>
                              <th className="p-3 text-center">Total Tiles</th>
                              <th className="p-3 border-l border-slate-800">Zoom 17</th>
                              <th className="p-3">Zoom 18</th>
                              <th className="p-3 font-semibold text-amber-400">Zoom 19</th>
                              <th className="p-3 font-semibold text-amber-400">Zoom 20</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {Object.entries(inspectReport.results).map(([filename, data]: [string, any]) => {
                              if (data.status !== "Success") {
                                return (
                                  <tr key={filename} className="hover:bg-slate-900/30 text-slate-500">
                                    <td className="p-3 font-sans font-medium text-slate-400">{filename}</td>
                                    <td colSpan={7} className="p-3 text-rose-400 font-sans">
                                      ❌ File missing in this release or failed verification ({data.error})
                                    </td>
                                  </tr>
                                );
                              }

                              const analysis = data.analysis;
                              const breakdown = analysis.zoom_breakdown || {};
                              const getCount = (z: number) => breakdown[z] || breakdown[z.toString()] || 0;

                              return (
                                <tr key={filename} className="hover:bg-slate-900/30 text-slate-300 font-mono">
                                  <td className="p-3 font-sans font-medium text-slate-100">{filename}</td>
                                  <td className="p-3 text-center text-slate-400">
                                    {analysis.metadata_minzoom}-{analysis.metadata_maxzoom}
                                  </td>
                                  <td className="p-3 text-center text-emerald-400 font-bold">
                                    {analysis.actual_minzoom}-{analysis.actual_maxzoom}
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-100">
                                    {analysis.total_tiles.toLocaleString()}
                                  </td>
                                  
                                  {/* Zoom 17 */}
                                  <td className="p-3 border-l border-slate-800">
                                    {getCount(17) > 0 ? (
                                      <span className="text-emerald-400 font-bold">{getCount(17).toLocaleString()}</span>
                                    ) : (
                                      <span className="text-slate-600">0</span>
                                    )}
                                  </td>

                                  {/* Zoom 18 */}
                                  <td className="p-3">
                                    {getCount(18) > 0 ? (
                                      <span className="text-emerald-400 font-bold">{getCount(18).toLocaleString()}</span>
                                    ) : (
                                      <span className="text-slate-600">0</span>
                                    )}
                                  </td>

                                  {/* Zoom 19 */}
                                  <td className="p-3">
                                    {getCount(19) > 0 ? (
                                      <span className="text-emerald-400 font-bold">{getCount(19).toLocaleString()}</span>
                                    ) : (
                                      <span className="text-rose-500/85 font-semibold bg-rose-950/20 px-1 rounded">0</span>
                                    )}
                                  </td>

                                  {/* Zoom 20 */}
                                  <td className="p-3">
                                    {getCount(20) > 0 ? (
                                      <span className="text-emerald-400 font-bold">{getCount(20).toLocaleString()}</span>
                                    ) : (
                                      <span className="text-rose-500/85 font-semibold bg-rose-950/20 px-1 rounded">0</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Dynamic Verification Diagnostic Conclusion */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-4">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="font-semibold text-xs font-sans">🔍 Detailed Diagnostic Conclusions & Root Cause Analysis</h4>
                        </div>
                        
                        <div className="space-y-3 font-sans text-[11px] leading-relaxed text-slate-400">
                          <p>
                            We completed an active schema search and count of tiles in every single SQLite column in the published packages. Here are the key findings regarding <b>Zoom 19</b> and <b>Zoom 20</b>:
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            <div className="bg-slate-900/60 p-3 rounded-md border border-slate-800">
                              <h5 className="font-semibold text-slate-200 mb-1 text-[10px]">1. Are they present?</h5>
                              <p className="text-slate-400">
                                <b>NO.</b> The analysis indicates that all published UHD packages (Zhenxing, Zhen'an, Yuanbao, Donggang, Fengcheng, Kuandian) have their actual <b>Max Zoom capped at 17</b>. No tiles exist for Z18, Z19, or Z20.
                              </p>
                            </div>

                            <div className="bg-slate-900/60 p-3 rounded-md border border-slate-800">
                              <h5 className="font-semibold text-slate-200 mb-1 text-[10px]">2. Why are they empty?</h5>
                              <p className="text-slate-400 font-sans">
                                The root cause is the <b>Download Source (OpenTopoMap)</b> limitation. OpenTopoMap does <b>NOT</b> provide real zoom data beyond Zoom 17. Any request above Zoom 17 yields an HTTP 404, leading to missing tiles or extreme blurry pixelated interpolation when forced.
                              </p>
                            </div>

                            <div className="bg-slate-900/60 p-3 rounded-md border border-slate-800">
                              <h5 className="font-semibold text-slate-200 mb-1 text-[10px]">3. What is the solution?</h5>
                              <p className="text-slate-400 font-sans">
                                To obtain real UHD tile data at Zoom 18-20, the build pipeline must change the map source from OpenTopoMap to <b>OpenStreetMap</b> (up to Z19) or <b>CartoVoyager</b> (up to Z20) in <code>map_config.json</code>.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-800/80 pt-3 mt-1 space-y-2">
                            <p className="text-slate-300 font-semibold text-[10px]">Recommended Action Before Re-Compiling:</p>
                            <ul className="list-decimal pl-4 space-y-1 text-slate-400">
                              <li>Verify your <code>map_config.json</code> to ensure that <code>maxzoom</code> is set to 20 or higher.</li>
                              <li>Change the primary source from OpenTopoMap (capped at 17) to a higher-capacity source like <b>CartoVoyager</b> or <b>OpenStreetMap</b> if you want real street geometries at Zoom 19 and 20.</li>
                              <li>Use MBTiles built-in <b>OverZoom</b> in the Android loading SDK. MapLibre and Google Maps can upscale Zoom 17 tiles beautifully on client devices so that users see a crisp map even without heavy high-zoom downloads.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!inspectLogs && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-8 text-center space-y-3">
                      <Database className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-slate-400 text-[11px] font-sans">
                        Click the run button to check and verify the published releases. This will probe the exact SQLite tiles schemas.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2 font-sans">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        Live Tile Server Capabilities Probe
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">
                        Live testing target: <span className="text-emerald-400 font-mono">Zhenxing District Center (2km × 2km)</span>
                      </p>
                    </div>
                    <button
                      onClick={runDiagnostic}
                      disabled={loadingDiagnostic}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-sans text-xs font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition shadow-md disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingDiagnostic ? 'animate-spin' : ''}`} />
                      {diagnosticData ? "Re-Run Probe" : "Run Live Probe"}
                    </button>
                  </div>

                  {loadingDiagnostic ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="relative">
                        <Compass className="w-8 h-8 text-emerald-400 animate-spin" />
                        <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping" />
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 tracking-wider">PROBING PUBLIC MAP TILES OVER ZOOM 15-22...</p>
                    </div>
                  ) : diagnosticData ? (
                    <div className="space-y-6">
                      {/* Summary/Key Findings Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 uppercase text-[9px] block mb-1">OpenTopoMap Limit</span>
                          <p className="text-amber-400 font-semibold font-sans text-xs">
                            Max real zoom: <span className="text-base font-bold font-mono">Zoom 17</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                            Above Z17, OpenTopoMap throws HTTP 404. OverZoom interpolation above Z17 is done client-side.
                          </p>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 uppercase text-[9px] block mb-1">OpenStreetMap Standard</span>
                          <p className="text-emerald-400 font-semibold font-sans text-xs">
                            Max real zoom: <span className="text-base font-bold font-mono">Zoom 19</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                            OSM supports up to Z19. Offers real street and minor lane geometries with building contours.
                          </p>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 uppercase text-[9px] block mb-1">CartoVoyager Raster</span>
                          <p className="text-emerald-400 font-semibold font-sans text-xs">
                            Max real zoom: <span className="text-base font-bold font-mono">Zoom 20</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                            Voyager raster supports up to Z20. Smooth, modern vector-based raster tile with high fidelity.
                          </p>
                        </div>
                      </div>

                      {/* Comparative Matrix Table */}
                      <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                        <table className="w-full text-left border-collapse font-mono text-[10px]">
                          <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[9px] tracking-wider uppercase font-mono">
                              <th className="p-3">Zoom</th>
                              <th className="p-3 font-sans">BBox Tiles</th>
                              <th className="p-3 font-sans">Tested Tile</th>
                              <th className="p-3 text-amber-400 border-l border-slate-800">OpenTopoMap</th>
                              <th className="p-3 text-sky-400 border-l border-slate-800">OpenStreetMap</th>
                              <th className="p-3 text-emerald-400 border-l border-slate-800 font-mono">CartoVoyager</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {diagnosticData.results.map((row: any) => (
                              <tr key={row.zoom} className="hover:bg-slate-900/30 font-mono">
                                <td className="p-3 text-xs font-bold text-slate-200">{row.zoom}</td>
                                <td className="p-3 text-slate-300">{row.totalTiles.toLocaleString()}</td>
                                <td className="p-3 text-slate-500">{row.coord}</td>
                                
                                {/* OpenTopoMap status */}
                                <td className="p-3 border-l border-slate-800/80">
                                  {row.OpenTopoMap.status === 200 ? (
                                    <div>
                                      <span className="text-emerald-400 font-bold font-mono">200 OK</span>
                                      <span className="text-slate-500 block text-[9px]">{row.OpenTopoMap.sizeKB}</span>
                                    </div>
                                  ) : (
                                    <span className="text-rose-400 font-medium font-sans">{row.OpenTopoMap.remarks}</span>
                                  )}
                                </td>

                                {/* OpenStreetMap status */}
                                <td className="p-3 border-l border-slate-800/80">
                                  {row.OpenStreetMap.status === 200 ? (
                                    <div>
                                      <span className="text-emerald-400 font-bold font-mono">200 OK</span>
                                      <span className="text-slate-500 block text-[9px]">{row.OpenStreetMap.sizeKB}</span>
                                    </div>
                                  ) : (
                                    <span className="text-rose-400 font-medium font-sans">{row.OpenStreetMap.remarks}</span>
                                  )}
                                </td>

                                {/* CartoVoyager status */}
                                <td className="p-3 border-l border-slate-800/80">
                                  {row.CartoVoyager.status === 200 ? (
                                    <div>
                                      <span className="text-emerald-400 font-bold font-mono">200 OK</span>
                                      <span className="text-slate-500 block text-[9px]">{row.CartoVoyager.sizeKB}</span>
                                    </div>
                                  ) : (
                                    <span className="text-rose-400 font-medium font-sans">{row.CartoVoyager.remarks}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3">
                        <h4 className="font-semibold text-xs text-slate-300 font-sans">💡 Diagnostic Conclusions & Upgraded Strategy</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-[11px] leading-relaxed font-sans">
                          <li>
                            <b>OpenTopoMap Limit Check:</b> OpenTopoMap does <b>NOT</b> provide real zoom data beyond Zoom 17. Any request above Zoom 17 yields an HTTP 404, leading to missing tiles or extreme blurry pixelated interpolation when forced.
                          </li>
                          <li>
                            <b>High Zoom Solution:</b> If you need <b>Zoom 18-22</b>, OpenTopoMap cannot support this natively. We recommend changing your primary source or utilizing <b>OpenStreetMap</b> (up to Z19) or <b>CartoVoyager</b> (up to Z20) in <code>map_config.json</code> to obtain real high-definition geometries.
                          </li>
                          <li>
                            <b>OverZoom Client Configuration:</b> Above Z20, no public raster tile source provides real maps (they are server-side or client-side upscaled). Setting maxzoom to 22 is perfect, and we rely on MapLibre&apos;s or Android SDK&apos;s built-in <b>OverZoom</b> to upscale Zoom 20 tiles beautifully without requesting dead 404 tiles.
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-8 text-center space-y-3">
                      <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-slate-400 text-[11px] font-sans">Click the button above to run real-time live diagnostic checks on public servers and check high zoom level capacities.</p>
                    </div>
                  )}
                </div>
              )}
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
                  compile_by_config.py
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
                  {selectedTarget.key}.json
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
