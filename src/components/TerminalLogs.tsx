import { useState, useEffect, useRef } from "react";
import { Terminal, Play, Square, CircleCheck, AlertCircle, HelpCircle } from "lucide-react";
import { MapTarget } from "../types";

interface TerminalLogsProps {
  selectedTarget: MapTarget;
  customBbox: [number, number, number, number];
}

interface LogLine {
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'metric';
}

export default function TerminalLogs({ selectedTarget, customBbox }: TerminalLogsProps) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' | 'metric' = 'info') => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    addLog("⚠️ Compilation aborted by user signal (SIGINT). Cleaned cache locks.", "warn");
  };

  const startSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);

    const timestamp = () => `[${new Date().toLocaleTimeString()}]`;
    const [w, s, e, n] = customBbox;
    const bboxStr = `${w.toFixed(3)},${s.toFixed(3)},${e.toFixed(3)},${n.toFixed(3)}`;

    interface SeqEntry {
      text: string;
      type: 'info' | 'success' | 'warn' | 'error' | 'metric';
      delay: number;
    }

    const baseSequence: SeqEntry[] = [
      { text: `${timestamp()} ⚙️ Initializing CyberTrail-MapFactory Offline Pipeline v2.0.0...`, type: 'info', delay: 100 },
      { text: `${timestamp()} 🔍 Checking hardware & CLI dependencies in GitHub Runner...`, type: 'info', delay: 500 },
      { text: `OS: Ubuntu 24.04 LTS (Github Cloud Runner Container)`, type: 'metric', delay: 800 },
      { text: `Python Runtime: Python 3.10.12 (with Pillow v10.x and SQLite3)`, type: 'metric', delay: 1000 },
      { text: `SQLite Version: 3.45.1 (Optimized transactions enabled)`, type: 'metric', delay: 1200 },
      { text: `${timestamp()} ✅ System validations complete. Python environment ready. Concurrency limit: 8.`, type: 'success', delay: 1500 },
      { text: `${timestamp()} ⬇️ Resolving map downloader python script...`, type: 'info', delay: 1800 },
      { text: `Python script: maps/generate_raster_mbtiles.py verified successfully`, type: 'metric', delay: 2100 },
      { text: `${timestamp()} 📦 Selected tile cache directory: data/tile_cache/`, type: 'info', delay: 2400 },
      { text: `Checking for cached tiles... Found 1,425 cached tile structures on disk.`, type: 'success', delay: 2800 },
      { text: `${timestamp()} 🌐 Targeted map select: "${selectedTarget.key.toUpperCase()}"`, type: 'info', delay: 2900 },
      { text: `Primary Source: OpenTopoMap (https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png)`, type: 'metric', delay: 3100 },
    ];

    const condItem: SeqEntry = { text: `${timestamp()} 🛠️ Starting multi-threaded direct downloading & quantization loop...`, type: 'warn', delay: 3100 };

    const sliceSequence: SeqEntry[] = [
      { text: `${timestamp()} 📐 Processing projection bounding box: [${bboxStr}]`, type: 'info', delay: 3500 },
      { text: `Target Zoom Levels: ${selectedTarget.key === 'world' ? 'Z0 - Z5' : selectedTarget.key === 'china' ? 'Z6 - Z8' : selectedTarget.key === 'liaoning_overview' ? 'Z9 - Z11' : 'Z12 - Z17'}`, type: 'metric', delay: 3800 },
      { text: `Calculating tile coordinates for selected zooms...`, type: 'info', delay: 4200 },
      { text: `Total tile coordinate index set generated.`, type: 'success', delay: 4600 },
    ];

    const compileSequence: SeqEntry[] = [
      { text: `${timestamp()} 🚀 Executing multi-threaded downloading from OpenTopoMap...`, type: 'info', delay: 5200 },
      { text: `Downloading tiles using 8 threads...`, type: 'metric', delay: 5500 },
      { text: `[Tile-Downloader] Progress: 200/1842 tiles fetched... (Cache hits: 145, Net: 55)`, type: 'info', delay: 6000 },
      { text: `[Tile-Downloader] Progress: 800/1842 tiles fetched... (Cache hits: 512, Net: 288)`, type: 'info', delay: 6500 },
      { text: `[Tile-Downloader] Progress: 1842/1842 tiles fetched. All successfully processed.`, type: 'success', delay: 7200 },
      { text: `[Tile-Downloader] On-the-fly PNG8 color quantization applied to all images.`, type: 'success', delay: 7800 },
      { text: `${timestamp()} 🏁 Downloading completed! Raw MBTiles generated in dist/${selectedTarget.key}.mbtiles`, type: 'success', delay: 8400 },
      { text: `${timestamp()} ⚙️ Launching Python raster_optimizer.py post-processing...`, type: 'info', delay: 8800 },
      { text: `python3 maps/raster_optimizer.py dist/${selectedTarget.key}.mbtiles`, type: 'metric', delay: 9100 },
      { text: `[Optimizer] Stage 1: Converting flat MBTiles structure into normalized schema...`, type: 'info', delay: 9400 },
      { text: `[Optimizer] Stage 2: Deduplicating redundant visual cells (land / oceans / empty fields)...`, type: 'info', delay: 9850 },
      { text: `[Optimizer] Stage 3: Compacting database indices & running full SQLite VACUUM...`, type: 'info', delay: 10300 },
      { text: `[Optimizer] SUCCESS: Saved 54.2% disk space through structural normalization! Final file size: ${selectedTarget.estimatedSize}`, type: 'success', delay: 10850 },
      { text: `${timestamp()} 🔗 Creating Release metadata maps-raster-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`, type: 'info', delay: 11100 },
      { text: `gh release create maps-raster-20260623 dist/${selectedTarget.key}.mbtiles --title "CyberTrail Raster Maps"`, type: 'metric', delay: 11300 },
      { text: `🎉 [SUCCESS] Offline map package published successfully to GitHub release pipeline. Fully compatible with client.`, type: 'success', delay: 11500 },
    ];

    const sequence: SeqEntry[] = [
      ...baseSequence,
      condItem,
      ...sliceSequence,
      ...compileSequence
    ];

    let currentIdx = 0;
    const runNext = () => {
      if (currentIdx < sequence.length) {
        const item = sequence[currentIdx];
        addLog(item.text, item.type);
        currentIdx++;
        timerRef.current = setTimeout(runNext, item.delay - (currentIdx > 1 ? sequence[currentIdx - 2].delay : 0));
      } else {
        setIsRunning(false);
        timerRef.current = null;
      }
    };

    runNext();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 shadow-xl backdrop-blur-md flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 leading-none">
        <div>
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Local Execution Sandbox Console
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Test and simulate the full Python raster generator pipeline before push
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium text-[11px] transition"
            >
              <Play className="w-3 h-3 fill-white" />
              Run Compiling Sim
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-white font-medium text-[11px] transition"
            >
              <Square className="w-3 h-3 fill-white" />
              SIGINT Abort
            </button>
          )}
        </div>
      </div>

      {/* Terminal logs canvas */}
      <div className="flex-1 bg-black/85 border border-slate-800 rounded-lg p-3.5 font-mono text-[10px] space-y-1.5 overflow-y-auto min-h-[180px] h-[310px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-slate-500 gap-1.5">
            <Terminal className="w-8 h-8 opacity-40 text-slate-600 mb-1" />
            <span>CONSOLE READY_ TO EXECUTE</span>
            <p className="text-[9px] text-slate-600">Click the green button above to trigger the simulated process</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`leading-relaxed break-all ${
                log.type === 'success' ? 'text-emerald-400 font-semibold' :
                log.type === 'warn' ? 'text-amber-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'metric' ? 'text-slate-500' :
                'text-slate-200'
              }`}
            >
              {log.text}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Quick Tooltip banner */}
      <div className="mt-3.5 flex gap-2.5 items-start bg-slate-950/40 p-2 rounded border border-slate-800 text-[10px] text-slate-400">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-normal">
          This virtual testbed runs realistic stream models to allow boundary planning. The workflow on GitHub uses matching bounding tags to safely handle heavy extraction and output identical release layers.
        </p>
      </div>
    </div>
  );
}
