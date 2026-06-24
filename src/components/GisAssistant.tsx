import { useState, useRef, useEffect } from "react";
import { Send, MapPin, Code, Layers, Sparkles, MessageSquare, ShieldAlert } from "lucide-react";
import { ChatMessage } from "../types";

const SUGGESTED_PROMPTS = [
  {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "OpenTopoMap tile downloader",
    prompt: "How does the direct multi-threaded Python script download, cache, and pack OpenTopoMap PNG tiles into offline MBTiles databases?"
  },
  {
    icon: <Code className="w-3.5 h-3.5" />,
    label: "Import MBTiles to MapLibre Mobile",
    prompt: "Send a brief code snippet on how the CyberTrail app (iOS/Android) can load local .mbtiles maps offline using the MapLibre mobile SDK."
  },
  {
    icon: <MapPin className="w-3.5 h-3.5" />,
    label: "Generate bounding box raster map",
    prompt: "Show me the exact python command to download tiles with coordinate bounding box [124.3, 40.3, 125.7, 41.1] using the map generator."
  }
];

export default function GisAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am the CyberTrail GIS Pipeline Assistant. I am specialized in direct multi-threaded raster tile downloading, OpenTopoMap coordinate projections, on-the-fly PNG8 color quantization, offline MBTiles compilation, and mobile map integration. Ask me any cartography or offline tiles question!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setErrorStatus(null);
    
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to contact Gemini engine. Make sure GEMINI_API_KEY is configured in Secrets tab.");
      }

      const data = await resp.json();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat fetch error:", err);
      setErrorStatus(err.message || "Failed to contact Gemini proxy.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-3 border-b border-slate-700/60 font-medium text-slate-100 text-sm">
        <div className="relative flex justify-center items-center w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        </div>
        <div>
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">GIS Copilot</span>
          <p className="text-[10px] text-slate-400">Powered by Gemini 3.5 Flash</p>
        </div>
      </div>

      {/* Message Output */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <span className="text-[9px] text-slate-500 font-mono">
              {msg.role === "user" ? "DEVELOPER" : "GIS_AI_AGENT"} •{" "}
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <div
              className={`px-3 py-2 rounded-lg text-xs leading-relaxed break-words font-sans selection:bg-slate-700 select-text ${
                msg.role === "user"
                  ? "bg-emerald-600 text-emerald-50 rounded-br-none border border-emerald-500/40"
                  : "bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/55"
              }`}
            >
              {/* Simple preservation of linebreaks */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col space-y-1 mr-auto items-start max-w-[85%] animate-pulse">
            <span className="text-[9px] text-slate-500 font-mono">GIS_AI_AGENT • THINKING...</span>
            <div className="px-3 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-lg rounded-bl-none">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {errorStatus && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-amber-200 rounded-lg text-xs flex gap-2 items-start shadow-md">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-red-300">Authentication Warning</span>
              <p className="text-[10px] text-slate-300 mt-0.5">{errorStatus}</p>
              <p className="text-[9px] text-amber-300 hover:underline cursor-pointer mt-1" onClick={() => handleSendMessage("Tell me standard bounding boxes for China, Dandong, and Liaoning.")}>
                💡 Click here to simulation-chat without API access
              </p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/30">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">On-demand Templates</span>
        <div className="flex flex-col gap-1.5">
          {SUGGESTED_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              className="flex items-center gap-2 text-left px-2 py-1.5 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-slate-300 hover:text-slate-100 font-mono text-[10px] transition group"
            >
              <span className="text-emerald-400 group-hover:scale-110 duration-200">{item.icon}</span>
              <span className="truncate flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 bg-slate-900/40 border-t border-slate-800/80 flex gap-2 items-center"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about GIS cropping, planetiler variables, etc..."
          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700/60 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-sans text-xs"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 text-white p-1.5 rounded-lg transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
