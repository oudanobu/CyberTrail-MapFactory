import express from "express";
import path from "path";
import dns from "dns";
import { spawn } from "child_process";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure ipv4 bindings are prioritized
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Configure it in Secrets page.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint for GIS & OSM AI Companion
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid 'messages' format." });
    }

    const ai = getGeminiClient();
    
    // Process messages into Gemini format
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    
    // Construct system instructions
    const systemInstruction = 
      "You are the CyberTrail MapFactory GIS Assistant, a senior DevOps & Cartography engineer specializing in OpenStreetMap, Planetiler, osmium-tool, and mobile map engines like Mapbox/MapLibre.\n" +
      "Help users design bounding boxes, write custom Planetiler configurations, and integrate compiled MBTiles folders in iOS/Android mobile applications (with real examples and short, crisp code).\n" +
      "Keep responses concise, accurate, professional, and free of sales jargon.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I was unable to formulate a response. Please try again.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini server proxy error:", error);
    res.status(500).json({ 
      error: error.message || "An internal error occurred during map generation consultation." 
    });
  }
});

// Helper coordinate projection
function deg2num(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return {
    x: Math.max(0, Math.min(xtile, n - 1)),
    y: Math.max(0, Math.min(ytile, n - 1))
  };
}

function getTileCount(bbox: number[], zoom: number) {
  const [lon_min, lat_min, lon_max, lat_max] = bbox;
  const start = deg2num(lat_max, lon_min, zoom);
  const end = deg2num(lat_min, lon_max, zoom);
  const x_min = Math.min(start.x, end.x);
  const x_max = Math.max(start.x, end.x);
  const y_min = Math.min(start.y, end.y);
  const y_max = Math.max(start.y, end.y);
  const count = (x_max - x_min + 1) * (y_max - y_min + 1);
  return {
    count,
    centerX: Math.floor((x_min + x_max) / 2),
    centerY: Math.floor((y_min + y_max) / 2)
  };
}

// API Endpoint for multi-source tile level diagnostic comparison
app.get("/api/diagnostic", async (req, res) => {
  try {
    const bbox = [124.365, 40.100, 124.385, 40.120]; // 2km x 2km center of Zhenxing
    const results: any[] = [];
    const sources = [
      { name: "OpenTopoMap", url: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png" },
      { name: "OpenStreetMap", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png" },
      { name: "CartoVoyager", url: "https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png" }
    ];

    for (let z = 15; z <= 22; z++) {
      const info = getTileCount(bbox, z);
      const row: any = {
        zoom: z,
        totalTiles: info.count,
        coord: `${z}/${info.centerX}/${info.centerY}`
      };

      for (const src of sources) {
        const url = src.url
          .replace("{z}", z.toString())
          .replace("{x}", info.centerX.toString())
          .replace("{y}", info.centerY.toString());

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/webp,image/png,image/*;q=0.8"
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const buffer = await response.arrayBuffer();
            row[src.name] = {
              status: response.status,
              sizeBytes: buffer.byteLength,
              sizeKB: (buffer.byteLength / 1024).toFixed(2) + " KB",
              remarks: buffer.byteLength < 1000 ? "Blank/No-Data placeholder" : "Valid Tile Data"
            };
          } else {
            row[src.name] = {
              status: response.status,
              remarks: response.status === 404 ? "Max Zoom Exceeded (404)" : `HTTP Error ${response.status}`
            };
          }
        } catch (e: any) {
          row[src.name] = {
            status: "Error",
            remarks: e.name === "AbortError" ? "Timeout" : (e.message || "Fetch failed")
          };
        }
      }
      results.push(row);
    }

    res.json({
      bbox,
      results
    });
  } catch (error: any) {
    console.error("Diagnostic error:", error);
    res.status(500).json({ error: error.message });
  }
});

let inspectProcess: any = null;
let inspectLogs = "";
let inspectStatus = "idle"; // "idle", "running", "success", "failed"

app.post("/api/inspect-release/start", (req, res) => {
  if (inspectStatus === "running") {
    return res.json({ status: "running", message: "Inspection already in progress." });
  }

  inspectLogs = "[*] Launching GitHub Releases MBTiles Diagnostic Inspector...\n";
  inspectStatus = "running";

  try {
    const pythonScript = path.join(process.cwd(), "maps", "inspect_release_mbtiles.py");
    inspectProcess = spawn("python3", [pythonScript]);

    inspectProcess.stdout.on("data", (data: any) => {
      const chunk = data.toString();
      inspectLogs += chunk;
    });

    inspectProcess.stderr.on("data", (data: any) => {
      const chunk = data.toString();
      inspectLogs += chunk;
    });

    inspectProcess.on("close", (code: number) => {
      if (code === 0) {
        inspectStatus = "success";
        inspectLogs += "\n[+] Inspection completed successfully!\n";
      } else {
        inspectStatus = "failed";
        inspectLogs += `\n[-] Inspection failed with exit code ${code}\n`;
      }
      inspectProcess = null;
    });

    res.json({ status: "running", message: "Inspection started." });
  } catch (error: any) {
    inspectStatus = "failed";
    inspectLogs += `\n[-] Failed to start process: ${error.message}\n`;
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/inspect-release/status", (req, res) => {
  let reportData = null;
  const jsonReportPath = path.join(process.cwd(), "maps", "release_inspection_report.json");
  if (fs.existsSync(jsonReportPath)) {
    try {
      reportData = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));
    } catch (e: any) {
      console.error("Failed to parse report JSON:", e);
    }
  }

  res.json({
    status: inspectStatus,
    logs: inspectLogs,
    report: reportData
  });
});

async function main() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CyberTrail-Server] Active on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
