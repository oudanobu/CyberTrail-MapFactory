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
      { text: `${timestamp()} ⚙️ Initializing CyberTrail-MapFactory Offline Pipeline v1.2.0...`, type: 'info', delay: 100 },
      { text: `${timestamp()} 🔍 Checking hardware & CLI dependencies in GitHub Runner...`, type: 'info', delay: 500 },
      { text: `OS: Ubuntu 24.04 LTS (Github Cloud Runner Container)`, type: 'metric', delay: 800 },
      { text: `Java Runtime: OpenJDK 64-Bit Server VM (build 21.0.2+13-LTS)`, type: 'metric', delay: 1000 },
      { text: `Osmium Tool: version 1.16.0 (Supported libosmium: v2.20.0)`, type: 'metric', delay: 1200 },
      { text: `${timestamp()} ✅ System validations complete. Java 21 detected. Free CPU cores: 4. MEM Limit: 6144 MB.`, type: 'success', delay: 1500 },
      { text: `${timestamp()} ⬇️ Resolving Planetiler binaries...`, type: 'info', delay: 1800 },
      { text: `GET https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar -> verified SHA256`, type: 'metric', delay: 2100 },
      { text: `Successfully pre-loaded planetiler.jar (v0.8.2, 58 MB)`, type: 'info', delay: 2300 },
      { text: `${timestamp()} ⬇️ Downloading Planetiler OpenMapTiles auxiliary data...`, type: 'info', delay: 2400 },
      { text: `java -jar bin/planetiler.jar --download`, type: 'metric', delay: 2450 },
      { text: `Downloading data/sources/natural_earth_vector.sqlite.zip...`, type: 'metric', delay: 2500 },
      { text: `Downloading data/sources/water-polygons-split-3857.zip...`, type: 'metric', delay: 2550 },
      { text: `Downloading data/sources/lake_centerline.shp.zip...`, type: 'metric', delay: 2600 },
      { text: `✅ Download complete.`, type: 'success', delay: 2800 },
      { text: `${timestamp()} 🌐 Targeted map select: "${selectedTarget.key.toUpperCase()}"`, type: 'info', delay: 2900 },
      { text: `Source URL: ${selectedTarget.sourceUrl}`, type: 'metric', delay: 3100 },
    ];

    const condItem: SeqEntry = (selectedTarget.key === 'dandong' || selectedTarget.key === 'kuandian' || selectedTarget.key === 'shenyang' || selectedTarget.key === 'tokyo') ? 
      { text: `${timestamp()} 🛠️ Slicing target bounds detected! Preparing osmium-tool extract.`, type: 'warn', delay: 3100 } :
      { text: `${timestamp()} 🏎️ Slicing not requested for full scope. Ready for direct bulk compile!`, type: 'success', delay: 3100 };

    const sliceSequence: SeqEntry[] = (selectedTarget.key === 'dandong' || selectedTarget.key === 'kuandian' || selectedTarget.key === 'shenyang' || selectedTarget.key === 'tokyo') ? [
      { text: `${timestamp()} 📦 Down-sampling raw parent dataset: "${selectedTarget.parent}.osm.pbf"`, type: 'info', delay: 3500 },
      { text: `Wget fetch -> ${selectedTarget.sourceUrl} ...`, type: 'metric', delay: 3800 },
      { text: `Successfully downloaded parent archive (152 MB, Speed: 64.2 MB/s)`, type: 'success', delay: 4200 },
      { text: `${timestamp()} ⚔️ Slicing query bbox: [${bboxStr}] using "complete_ways" strategy...`, type: 'info', delay: 4600 },
      { text: `osmium extract --bbox ${bboxStr} parent.osm.pbf -o target_cropped.osm.pbf --strategy=complete_ways`, type: 'metric', delay: 4900 },
      { text: `osmium parse: Nodes read: 8,410,240 | Ways read: 942,510 | Relations: 24,194`, type: 'info', delay: 5300 },
      { text: `osmium compile: Output target_cropped.osm.pbf successfully written. Saved: ~${selectedTarget.estimatedSize}`, type: 'success', delay: 5800 },
    ] : [
      { text: `${timestamp()} 📦 Fetching bulk OSM region dataset directly...`, type: 'info', delay: 3500 },
      { text: `Aria2 parallel download -> ${selectedTarget.sourceUrl} ...`, type: 'metric', delay: 3900 },
      { text: `Dataset fetch complete. Size on disk: ~${selectedTarget.estimatedSize}`, type: 'success', delay: 4500 },
    ];

    const compileSequence: SeqEntry[] = [
      { text: `${timestamp()} 🚀 Executing Planetiler Vector Stream Compression...`, type: 'info', delay: 6200 },
      { text: `java -Xmx4g -jar planetiler.jar --osm-path=target.osm.pbf --output=dist/${selectedTarget.key}.mbtiles${selectedTarget.key === 'china_overview' ? ' --maxzoom=6' : ''} --force`, type: 'metric', delay: 6505 },
      { text: `[Tile-Engine] Stage 1: Reading nodes and storing locations (NodeMap Array)...`, type: 'info', delay: 6900 },
      { text: `[Tile-Engine] Processed: 1,500,000 nodes/s (Memory utilization: 42%)`, type: 'metric', delay: 7200 },
      { text: `[Tile-Engine] Stage 2: Reading ways and relations (Multipolygons)...`, type: 'info', delay: 7500 },
      { text: `[Tile-Engine] Stage 3: Rendering tiles and grouping features (Z0 - Z14)...`, type: 'info', delay: 7800 },
      { text: `[Tile-Engine] Completed zooms: z0-z4 (0.1s) | z5-z9 (0.4s) | z10-z12 (1.2s) | z13-z14 (3.1s)`, type: 'metric', delay: 8200 },
      { text: `[Tile-Engine] Stage 4: Compacting database structures and writing indices...`, type: 'info', delay: 8500 },
      { text: `${timestamp()} 🏁 Planetiler successfully generated Vector Map!`, type: 'success', delay: 8900 },
      { text: `Output written: dist/${selectedTarget.key}.mbtiles (${selectedTarget.estimatedSize})`, type: 'metric', delay: 9200 },
      { text: `Time elapsed: ${selectedTarget.compileTimeSec} seconds in sandbox runner`, type: 'metric', delay: 9350 },
      { text: `${timestamp()} 🔗 Creating Release metadata maps-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${new Date().toLocaleTimeString('en-US', {hour12:false}).slice(0,5).replace(':','')}`, type: 'info', delay: 9600 },
      { text: `gh release create maps-20260621-1130 dist/${selectedTarget.key}.mbtiles --title "CyberTrail Map Production"`, type: 'metric', delay: 9800 },
      { text: `🎉 [SUCCESS] Map successfully published to GitHub Release pipeline and ready for Cybertrail import!`, type: 'success', delay: 10100 },
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
            Test and simulate the full osmium & planetiler code block before push
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
