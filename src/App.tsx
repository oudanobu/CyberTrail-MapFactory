import { useState, useEffect } from "react";
import {
  Compass,
  Layers,
  Terminal,
  FileCode,
  Globe,
  Database,
  Calendar,
  Sparkles,
  Info,
  Sliders,
  Play,
  Check,
  Copy,
  PlusCircle,
  Code,
  Github,
  BookOpen,
  FolderArchive,
  Workflow,
  MapPin,
  Map,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileText,
  WorkflowIcon
} from "lucide-react";
import { MapTarget } from "./types";
import InteractiveMap from "./components/InteractiveMap";
import TerminalLogs from "./components/TerminalLogs";
import GisAssistant from "./components/GisAssistant";

const MAP_TARGETS: MapTarget[] = [
  // Phase 1 scope
  {
    key: "dandong",
    name: "Dandong City",
    chineseName: "辽宁省丹东市",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [123.38, 39.73, 125.7, 41.2],
    description: "Dynamic localized border municipality. Slices boundaries from Liaoning parent dataset.",
    parent: "liaoning",
    layerType: "city",
    estimatedSize: "11.6 MB",
    compileTimeSec: 45
  },
  {
    key: "liaoning",
    name: "Liaoning Province",
    chineseName: "辽宁省",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [118.84, 38.71, 125.79, 43.43],
    description: "Provincial target scope covering Northeast regional transport grids directly.",
    parent: "china",
    layerType: "province",
    estimatedSize: "148 MB",
    compileTimeSec: 280
  },
  {
    key: "china_overview",
    name: "China Overview",
    chineseName: "中国概况底图",
    sourceUrl: "https://download.geofabrik.de/asia/china-latest.osm.pbf",
    bbox: [73.66, 18.16, 135.05, 53.56],
    description: "Country-wide overview map (zoom 0-6). Contains admin boundaries, major cities, water, and highways. Not for navigation.",
    layerType: "country",
    estimatedSize: "55 MB",
    compileTimeSec: 150
  },
  // Phase 2 scope
  {
    key: "kuandian",
    name: "Kuandian County",
    chineseName: "宽甸满族自治县",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [124.35, 40.35, 125.72, 41.15],
    description: "Autonomous county nested under Dandong. Future high-resolution subcrop target.",
    parent: "liaoning",
    layerType: "county",
    estimatedSize: "2.1 MB",
    compileTimeSec: 18
  },
  {
    key: "shenyang",
    name: "Shenyang City",
    chineseName: "辽宁省沈阳市",
    sourceUrl: "https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf",
    bbox: [122.42, 41.19, 123.81, 43.04],
    description: "Capital of Liaoning Province, extremely high density transit connectivity.",
    parent: "liaoning",
    layerType: "city",
    estimatedSize: "32.4 MB",
    compileTimeSec: 90
  },
  {
    key: "tokyo",
    name: "Tokyo Metro",
    chineseName: "日本国東京都",
    sourceUrl: "https://download.geofabrik.de/asia/japan-latest.osm.pbf",
    bbox: [138.94, 35.52, 139.92, 35.82],
    description: "Metropolitan capital expansion region of Japan.",
    parent: "japan",
    layerType: "city",
    estimatedSize: "44.1 MB",
    compileTimeSec: 110
  },
  {
    key: "japan",
    name: "Japan Core",
    chineseName: "日本国",
    sourceUrl: "https://download.geofabrik.de/asia/japan-latest.osm.pbf",
    bbox: [128.6, 30.0, 146.0, 45.6],
    description: "Full country domain package for Japanese island archipelago.",
    layerType: "country",
    estimatedSize: "1.8 GB",
    compileTimeSec: 3500
  },
  {
    key: "usa",
    name: "United States",
    chineseName: "美国本土",
    sourceUrl: "https://download.geofabrik.de/north-america/us-latest.osm.pbf",
    bbox: [-124.8, 24.4, -66.9, 49.4],
    description: "Continental US bulk vector schema covering multiple states.",
    layerType: "country",
    estimatedSize: "8.6 GB",
    compileTimeSec: 14400
  }
];

export default function App() {
  const [selectedTarget, setSelectedTarget] = useState<MapTarget>(MAP_TARGETS[0]);
  const [activeBbox, setActiveBbox] = useState<[number, number, number, number]>(MAP_TARGETS[0].bbox);
  const [activeTab, setActiveTab] = useState<'editor' | 'cli' | 'guide'>('editor');
  const [activeFile, setActiveFile] = useState<'workflow' | 'script' | 'json'>('workflow');
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
        code: `name: Compile Map Pipeline

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      map_target:
        description: 'Compile Target (liaoning or dandong)'
        required: true
        default: 'dandong'
        type: choice
        options:
          - dandong
          - liaoning

permissions:
  contents: write

jobs:
  build-maps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Install Osmium-Tool
        run: sudo apt-get update && sudo apt-get install -y osmium-tool

      - name: Prepare Workspace and Download Data
        run: |
          mkdir -p bin data/sources dist
          wget -q https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar -O bin/planetiler.jar

      - name: Compile - Dandong MBTiles
        if: github.event.inputs.map_target == 'dandong'
        run: |
          wget -O data/liaoning-latest.osm.pbf https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf
          osmium extract --bbox 123.38,39.73,125.70,41.20 data/liaoning-latest.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways
          java -Xmx4g -jar bin/planetiler.jar --osm-path=data/dandong.osm.pbf --output=dist/dandong.mbtiles`
      };
    }
    if (activeFile === 'script') {
      return {
        name: "maps/crop_dandong.sh",
        language: "bash",
        code: `#!/usr/bin/env bash
# CyberTrail-MapFactory: Crop Dandong local bounds

set -eo pipefail
mkdir -p data

LIAONING_URL="https://download.geofabrik.de/asia/china/liaoning-latest.osm.pbf"
BBOX="123.38,39.73,125.70,41.20"

if ! command -v osmium &> /dev/null; then
  echo "Error: osmium-tool is not installed. Run 'sudo apt install osmium-tool'"
  exit 1
fi

wget -c "\\\${LIAONING_URL}" -O data/liaoning-latest.osm.pbf
osmium extract --bbox "\\\${BBOX}" data/liaoning-latest.osm.pbf -o data/dandong.osm.pbf --strategy=complete_ways --overwrite
echo "Compiled Dandong map slice safely in: data/dandong.osm.pbf"`
      };
    }
    return {
      name: "maps/bounding_boxes.json",
      language: "json",
      code: `{
  "dandong": {
    "name": "Dandong (辽宁省丹东市)",
    "bbox": [123.38, 39.73, 125.70, 41.20],
    "parent": "liaoning",
    "description": "Border city in Liaoning, China"
  },
  "liaoning": {
    "name": "Liaoning Province (辽宁省)",
    "bbox": [118.84, 38.71, 125.79, 43.43],
    "description": "Province in Northeast Region"
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
              <p className="text-[10px] text-slate-400">GIS Offline Vector Tile Compilation Console</p>
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
              <h2 className="font-semibold text-xs text-slate-300 font-mono tracking-wider uppercase">Compilation Target Presets</h2>
            </div>
            
            {/* Phase 1 List */}
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase block mb-2">Phase 1 Active Targets</span>
            <div className="space-y-1.5 mb-4">
              {MAP_TARGETS.filter(t => ['china_overview', 'dandong', 'liaoning'].includes(t.key)).map((target) => (
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

            {/* Phase 2 List */}
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase block mb-2">Phase 2 Future Roadmap Targets</span>
            <div className="space-y-1.5">
              {MAP_TARGETS.filter(t => !['china_overview', 'dandong', 'liaoning'].includes(t.key)).map((target) => (
                <button
                  key={target.key}
                  onClick={() => setSelectedTarget(target)}
                  className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                    selectedTarget.key === target.key
                      ? "bg-emerald-950/45 border-emerald-500/50 text-slate-100"
                      : "bg-slate-950/20 border-slate-900/60 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex gap-2.5 items-center min-w-0">
                    <Globe className={`w-4 h-4 shrink-0 ${selectedTarget.key === target.key ? 'text-emerald-400' : 'text-slate-700'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs truncate">{target.name}</span>
                        <span className="text-[9px] text-slate-600 shrink-0">({target.chineseName})</span>
                      </div>
                      <p className="text-[9px] text-slate-600 truncate">{target.estimatedSize} • Future integration</p>
                    </div>
                  </div>
                  <PlusCircle className="w-3.5 h-3.5 shrink-0 text-slate-700 hover:text-emerald-400 transition" />
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
                  {selectedTarget.layerType.toUpperCase()} {selectedTarget.parent ? `(Parent: ${selectedTarget.parent.toUpperCase()})` : '(Independent Scope)'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[9px]">Slicing Tool Pipeline</span>
                <p className="text-slate-200 mt-0.5">
                  {selectedTarget.parent ? `Osmium BBOX Cutting and Geometry-Assembly` : `None (Direct Compilation)`}
                </p>
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
              CyberTrail Loader Map Guide
            </button>
          </div>

          {/* TAB 1: GIS CONFIGURATOR (Visual Bounds + Gemini Copilot Side-by-Side) */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Boundary Editor and Bounding Visualizer */}
              <div className="flex flex-col h-full justify-between">
                <InteractiveMap
                  selectedTarget={selectedTarget}
                  activeBbox={activeBbox}
                  onBboxChange={setActiveBbox}
                />
              </div>

              {/* Server-Side Gemini Helper */}
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

          {/* TAB 3: CYBERTRAIL OFFLINE LOADER INTEGRATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">CyberTrail App Offline Loading Protocol</h3>
                  <p className="text-[10px] text-slate-400">Step-by-step instructions for importing compiled .mbtiles into testing systems</p>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-300">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">1</span>
                    Retrieving Compiled Asset Package
                  </h4>
                  <p className="pl-6">
                    Navigate to the repository&apos;s <b>Releases</b> page and locate the latest compiled tag (e.g., <code>maps-YYYYMMDD-HHMM</code>). Download the targeted mbtiles database file like <code>dandong.mbtiles</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">2</span>
                    Importing to Device Sandbox Storage
                  </h4>
                  <p className="pl-6">
                    Place the <code>.mbtiles</code> file inside your mobile app sandbox directory:
                  </p>
                  <ul className="pl-12 list-disc space-y-1">
                    <li><b>Android:</b> Load into <code>/sdcard/Android/data/com.cybertrail.tracker/files/maps/</code></li>
                    <li><b>iOS (Files App):</b> Copy file directly into the local <code>CyberTrail/Maps/</code> shared container folder.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-100 flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono">3</span>
                    Sample MapLibre Rendering Code
                  </h4>
                  <p className="pl-6">
                    Here is the boilerplate to integrate your locally stored vector tiles securely using MapLibre React Native or Native SDKs:
                  </p>
                  <div className="bg-slate-950 p-3 rounded font-mono text-[10px] text-slate-400 border border-slate-800 relative group select-all">
                    <button
                      onClick={() => handleCopyCode(`// Import MapLibre vector style referencing the local database
const offlineStyle = {
  version: 8,
  sources: {
    'custom-vector-source': {
      type: 'vector',
      tiles: ['mbtiles://{local_path_to_mbtiles}/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0f172a' }
    },
    {
      id: 'roads',
      source: 'custom-vector-source',
      'source-layer': 'transportation',
      type: 'line',
      paint: { 'line-color': '#10b981', 'line-width': 1.2 }
    }
  ]
};`, 'code-map')}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                      title="Copy code"
                    >
                      {copiedTextKey === 'code-map' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="overflow-x-auto leading-normal whitespace-pre">
{`// Import MapLibre vector style referencing the local database
const offlineStyle = {
  version: 8,
  sources: {
    'custom-vector-source': {
      type: 'vector',
      tiles: ['mbtiles://{local_path_to}/maps/dandong.mbtiles/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0f172a' }
    },
    {
      id: 'roads',
      source: 'custom-vector-source',
      'source-layer': 'transportation',
      type: 'line',
      paint: { 'line-color': '#10b981', 'line-width': 1.2 }
    }
  ]
};`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCRIPT STUDIO & REPOSITORY VIEW: Interactive repository configurations tab bar */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-xs text-slate-200 tracking-wider uppercase font-mono">Repository File Studio</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Explore files generated for your Git repository workspace</p>
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
              
              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-850 font-mono text-[10px] text-slate-300 overflow-x-auto select-all max-h-[220px] scrollbar-thin">
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
            <span>MAPNIK_ZOOM_MAX: 14</span>
            <span className="text-slate-600">|</span>
            <span>WGS_84 DATABASE_HEALTH: green</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
