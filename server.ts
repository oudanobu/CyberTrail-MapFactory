import express from "express";
import path from "path";
import dns from "dns";
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
