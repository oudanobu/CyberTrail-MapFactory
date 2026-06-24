import { useState, useEffect } from "react";
import { Compass, Maximize2, RefreshCw, ZoomIn, Copy, Check } from "lucide-react";
import { MapTarget } from "../types";

interface InteractiveMapProps {
  selectedTarget: MapTarget;
  activeBbox: [number, number, number, number];
  onBboxChange: (bbox: [number, number, number, number]) => void;
}

export default function InteractiveMap({ selectedTarget, activeBbox, onBboxChange }: InteractiveMapProps) {
  const [minLon, minLat, maxLon, maxLat] = activeBbox;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Determine viewport domain based on active target to simulate dynamic zoom
  // We want to auto-adjust min/max bounds of our SVG coordinate grid to focus on the target region.
  const getViewportDomain = () => {
    if (selectedTarget.key === "world") {
      return { lonMin: -180, lonMax: 180, latMin: -85, latMax: 85 };
    }
    if (selectedTarget.key === "china") {
      return { lonMin: 70, lonMax: 150, latMin: 15, latMax: 55 };
    }
    if (selectedTarget.key === "japan") {
      return { lonMin: 121.0, lonMax: 155.0, latMin: 20.0, latMax: 46.0 };
    }
    if (selectedTarget.key === "liaoning") {
      return { lonMin: 116.0, lonMax: 127.0, latMin: 37.0, latMax: 45.0 };
    }
    // For detailed county/district maps, we dynamically focus on the target area with slight padding
    const [tMinLon, tMinLat, tMaxLon, tMaxLat] = selectedTarget.bbox;
    const paddingLon = Math.max(0.04, (tMaxLon - tMinLon) * 0.4);
    const paddingLat = Math.max(0.04, (tMaxLat - tMinLat) * 0.4);
    return {
      lonMin: tMinLon - paddingLon,
      lonMax: tMaxLon + paddingLon,
      latMin: tMinLat - paddingLat,
      latMax: tMaxLat + paddingLat
    };
  };

  const domain = getViewportDomain();
  const lonSpan = domain.lonMax - domain.lonMin;
  const latSpan = domain.latMax - domain.latMin;

  // Helper projection function from (Lon/Lat) => SVG coordinate (0 - 400 width, 0 - 250 height)
  // Standard cartesian swap (y axis is inverted in SVGs)
  const project = (lon: number, lat: number) => {
    const x = ((lon - domain.lonMin) / lonSpan) * 400;
    const y = 250 - ((lat - domain.latMin) / latSpan) * 250;
    return { x: Math.max(-50, Math.min(450, x)), y: Math.max(-50, Math.min(300, y)) };
  };

  const sw = project(minLon, minLat);
  const ne = project(maxLon, maxLat);

  const rectWidth = Math.max(8, ne.x - sw.x);
  const rectHeight = Math.max(8, sw.y - ne.y);
  const rectX = sw.x;
  const rectY = ne.y;

  const handleSliderChange = (param: 'minLon' | 'minLat' | 'maxLon' | 'maxLat', value: number) => {
    let nextBbox: [number, number, number, number] = [...activeBbox];
    if (param === 'minLon') nextBbox[0] = Math.min(value, maxLon - 0.05);
    if (param === 'minLat') nextBbox[1] = Math.min(value, maxLat - 0.05);
    if (param === 'maxLon') nextBbox[2] = Math.max(value, minLon + 0.05);
    if (param === 'maxLat') nextBbox[3] = Math.max(value, minLat + 0.05);
    onBboxChange(nextBbox);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Generate ticks for dynamic labels on the grids
  const getGridTicks = () => {
    const ticksX = [];
    const ticksY = [];
    const stepX = lonSpan / 5;
    const stepY = latSpan / 4;
    for (let i = 1; i < 5; i++) {
      ticksX.push(domain.lonMin + i * stepX);
    }
    for (let i = 1; i < 4; i++) {
      ticksY.push(domain.latMin + i * stepY);
    }
    return { ticksX, ticksY };
  };

  const { ticksX, ticksY } = getGridTicks();

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
            GIS Crop Boundaries Coordinator
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Active: <span className="text-emerald-300 font-mono">{selectedTarget.name}</span>
          </p>
        </div>
        <div className="flex gap-2 text-[10px] bg-slate-800/60 px-2 py-1 rounded border border-slate-700/60 font-mono text-slate-400">
          <span className="text-emerald-400 block">VIEWPORT ZOOM_LEVEL: {selectedTarget.layerType === 'county_hd' ? "HIGH" : "STD"}</span>
        </div>
      </div>

      {/* SVG Spatial Radar Grid Visualizer */}
      <div className="relative aspect-[16/10] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden select-none">
        {/* Dynamic Static Coordinates Backdrops */}
        <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-slate-500 flex flex-col gap-0.5 pointer-events-none">
          <span>COORDINATE_SYSTEM: WGS_84</span>
          <span>PROJECTION: MERCATOR_EPSG_3857</span>
        </div>

        <svg className="w-full h-full" viewBox="0 0 400 250">
          {/* Subtle Grid Lines */}
          {ticksX.map((tick, idx) => {
            const pos = project(tick, domain.latMin);
            return (
              <g key={`x-${idx}`}>
                <line x1={pos.x} y1={0} x2={pos.x} y2={250} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={pos.x + 3} y={242} fill="#64748b" fontSize="7" fontFamily="monospace">
                  {tick.toFixed(1)}°{tick >= 0 ? 'E' : 'W'}
                </text>
              </g>
            );
          })}
          {ticksY.map((tick, idx) => {
            const pos = project(domain.lonMin, tick);
            return (
              <g key={`y-${idx}`}>
                <line x1={0} y1={pos.y} x2={400} y2={pos.y} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x={4} y={pos.y - 3} fill="#64748b" fontSize="7" fontFamily="monospace">
                  {tick.toFixed(1)}°N
                </text>
              </g>
            );
          })}

          {/* Reference Outline Indicator (Province scale placeholder to guide user visually) */}
          <circle cx={200} cy={125} r={80} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="5 5" className="opacity-30" />

          {/* Slicing Bounding Box boundary block */}
          <rect
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="#10b981"
            strokeWidth="1.8"
            className="transition-all duration-300 ease-out"
          />

          {/* Target Boundary Pins / Handles (Top-Left / Bottom-Right) */}
          <circle cx={rectX} cy={rectY} r="3" fill="#10b981" className="transition-all duration-300 ease-out" />
          <circle cx={rectX + rectWidth} cy={rectY + rectHeight} r="3" fill="#10b981" className="transition-all duration-300 ease-out" />

          {/* Grid target info label popup overlay inside crop box */}
          {rectWidth > 50 && (
            <text
              x={rectX + rectWidth / 2}
              y={rectY + rectHeight / 2 + 3}
              fill="#34d399"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
              className="font-semibold select-all pointer-events-none"
            >
              CROP_BBOX
            </text>
          )}
        </svg>

        {/* Dynamic Bounds Coordinates Floating Badges */}
        <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
          <div className="bg-slate-950/90 border border-slate-800 py-1 px-3.5 rounded-full flex gap-3.5 text-[10px] font-mono text-slate-300 backdrop-blur-md">
            <span>W: <b className="text-white">{minLon.toFixed(2)}°E</b></span>
            <span>S: <b className="text-white">{minLat.toFixed(2)}°N</b></span>
            <span>E: <b className="text-white">{maxLon.toFixed(2)}°E</b></span>
            <span>N: <b className="text-white">{maxLat.toFixed(2)}°N</b></span>
          </div>
        </div>
      </div>

      {/* Manual Boundary Micro-Sliders */}
      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-4 mb-2">Manual Bounding Calibration</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-slate-900/30 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span>[W] WEST LONGITUDE</span>
            <span className="text-emerald-400">{minLon.toFixed(3)}°E</span>
          </div>
          <input
            type="range"
            min={domain.lonMin}
            max={maxLon - 0.01}
            step="0.05"
            value={minLon}
            onChange={(e) => handleSliderChange('minLon', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span>[E] EAST LONGITUDE</span>
            <span className="text-emerald-400">{maxLon.toFixed(3)}°E</span>
          </div>
          <input
            type="range"
            min={minLon + 0.01}
            max={domain.lonMax}
            step="0.05"
            value={maxLon}
            onChange={(e) => handleSliderChange('maxLon', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span>[S] SOUTH LATITUDE</span>
            <span className="text-emerald-400">{minLat.toFixed(3)}°N</span>
          </div>
          <input
            type="range"
            min={domain.latMin}
            max={maxLat - 0.01}
            step="0.05"
            value={minLat}
            onChange={(e) => handleSliderChange('minLat', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-ns-resize h-1 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span>[N] NORTH LATITUDE</span>
            <span className="text-emerald-400">{maxLat.toFixed(3)}°N</span>
          </div>
          <input
            type="range"
            min={minLat + 0.01}
            max={domain.latMax}
            step="0.05"
            value={maxLat}
            onChange={(e) => handleSliderChange('maxLat', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-ns-resize h-1 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Reactive Export Code Snippets */}
      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-4 mb-2">Automated CLI Commands Output</h4>
      <div className="space-y-2">
        {/* Python Configured Downloader */}
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[10px] text-emerald-400 relative group select-all">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => {
                const minZ = selectedTarget.layerType === 'world' ? 0 : selectedTarget.layerType === 'country' ? 6 : selectedTarget.layerType === 'province' ? 9 : 12;
                const maxZ = selectedTarget.layerType === 'world' ? 5 : selectedTarget.layerType === 'country' ? 8 : selectedTarget.layerType === 'province' ? 11 : 22;
                copyToClipboard(`python3 maps/generate_raster_mbtiles.py --bbox="${minLon.toFixed(3)},${minLat.toFixed(3)},${maxLon.toFixed(3)},${maxLat.toFixed(3)}" --minzoom="${minZ}" --maxzoom="${maxZ}" --output="dist/${selectedTarget.key}.mbtiles" --tile_source="opentopomap"`, 'python-source');
              }}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Copy Command"
            >
              {copiedKey === 'python-source' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <span className="text-[9px] text-slate-500 uppercase block mb-1">Direct Download Command (with config tile_source)</span>
          <code className="text-[10px] leading-relaxed break-all">
            {(() => {
              const minZ = selectedTarget.layerType === 'world' ? 0 : selectedTarget.layerType === 'country' ? 6 : selectedTarget.layerType === 'province' ? 9 : 12;
              const maxZ = selectedTarget.layerType === 'world' ? 5 : selectedTarget.layerType === 'country' ? 8 : selectedTarget.layerType === 'province' ? 11 : 22;
              return `python3 maps/generate_raster_mbtiles.py --bbox="${minLon.toFixed(3)},${minLat.toFixed(3)},${maxLon.toFixed(3)},${maxLat.toFixed(3)}" --minzoom="${minZ}" --maxzoom="${maxZ}" --output="dist/${selectedTarget.key}.mbtiles" --tile_source="opentopomap"`;
            })()}
          </code>
        </div>

        {/* Bash Automated Compilation wrapper */}
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[10px] text-sky-400 relative group select-all">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => copyToClipboard(`bash maps/build_all_raster_maps.sh ${selectedTarget.key}`, 'bash-all')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Copy Command"
            >
              {copiedKey === 'bash-all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <span className="text-[9px] text-slate-500 uppercase block mb-1">Automated Bash Pipeline Command</span>
          <code className="text-[10px] leading-relaxed break-all">
            bash maps/build_all_raster_maps.sh {selectedTarget.key}
          </code>
        </div>
      </div>
    </div>
  );
}
