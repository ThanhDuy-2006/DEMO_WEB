import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { 
  Terminal, 
  Play, 
  Square, 
  Settings, 
  Cpu, 
  Activity, 
  ExternalLink,
  Loader2,
  Trash2
} from "lucide-react";

export default function AdminAutoForm() {
  const { socket } = useSocket();
  const toast = useToast();
  
  const [config, setConfig] = useState({
    url: "",
    count: 100,
    mood: "MIXED",
    aiProvider: "GROQ",
    apiKey: "",
    rpm: 10,
    useProxy: false,
    headless: false
  });

  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const logEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Initial status fetch
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get("/admin/system-tools/auto-form/status");
        setStatus(res.status);
        if (res.logs && res.logs.length > 0) setLogs(res.logs);
      } catch (err) {
        console.error("Failed to fetch status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Socket listener for real-time logs
  useEffect(() => {
    if (!socket) return;
    
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("autoFormLog", (data) => {
      setLogs(prev => {
        // Debounce/limit logs if needed
        const newLogs = [...prev, { 
          time: new Date(), 
          message: data.message 
        }];
        return newLogs.slice(-500);
      });
      if (data.status) setStatus(data.status);
    });

    socket.on("autoFormFinished", (data) => {
      setStatus("idle");
      toast.success(data.message, { title: "Hoàn tất" });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("autoFormLog");
      socket.off("autoFormFinished");
    };
  }, [socket, toast]);

  const handleStart = async () => {
    if (!config.url) return toast.error("Vui lòng nhập URL target");
    
    try {
      setLoading(true);
      const res = await api.post("/admin/system-tools/auto-form/start", config);
      setStatus("running"); 
      if (res.logs) setLogs(res.logs); 
      toast.info(res.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể khởi chạy Bot");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      const res = await api.post("/admin/system-tools/auto-form/stop");
      setStatus("idle");
      toast.warn(res.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể dừng Bot");
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => setLogs([]);

  if (loading && status === "idle") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
             <Cpu className="text-primary w-8 h-8" />
             AUTO-FORM ULTIMATE
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Hệ thống AI tự động điền Form khảo sát - Tích hợp Đa nhiệm</p>
        </div>
        
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <button 
              onClick={handleStop}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all border border-red-500/50"
            >
              <Square className="w-4 h-4 fill-current" />
              NGẮT KẾT NỐI
            </button>
          ) : (
            <button 
              onClick={handleStart}
              className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              KHỞI CHẠY
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Settings className="w-24 h-24 rotate-12" />
            </div>
            
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              CẤU HÌNH CHIẾN DỊCH
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Target URL</label>
                <input 
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({...config, url: e.target.value})}
                  placeholder="https://docs.google.com/forms/..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Số lượng</label>
                  <input 
                    type="number"
                    value={config.count}
                    onChange={(e) => setConfig({...config, count: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">RPM (Delay)</label>
                  <input 
                    type="number"
                    value={config.rpm}
                    onChange={(e) => setConfig({...config, rpm: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Tâm trạng (Mood)</label>
                <select 
                  value={config.mood}
                  onChange={(e) => setConfig({...config, mood: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm appearance-none outline-none"
                >
                  <option value="MIXED">Hỗn hợp</option>
                  <option value="LOVING">Tích cực (Khen)</option>
                  <option value="HATING">Tiêu cực (Chê)</option>
                  <option value="NEUTRAL">Trung lập</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass border border-white/10 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              AI & MÔI TRƯỜNG
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm text-slate-300">Chạy Headless</span>
                <input 
                  type="checkbox"
                  checked={config.headless}
                  onChange={(e) => setConfig({...config, headless: e.target.checked})}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm text-slate-300">Sử dụng Proxy</span>
                <input 
                  type="checkbox"
                  checked={config.useProxy}
                  onChange={(e) => setConfig({...config, useProxy: e.target.checked})}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">AI Provider</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button 
                    onClick={() => setConfig({...config, aiProvider: 'GROQ'})}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${config.aiProvider === 'GROQ' ? 'bg-primary text-black' : 'bg-white/5 text-slate-400'}`}
                  >
                    GROQ
                  </button>
                  <button 
                    onClick={() => setConfig({...config, aiProvider: 'GEMINI'})}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${config.aiProvider === 'GEMINI' ? 'bg-primary text-black' : 'bg-white/5 text-slate-400'}`}
                  >
                    GEMINI
                  </button>
                </div>
                
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">API Key</label>
                <input 
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="Nhập Key để kích hoạt AI"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Console */}
        <div className="lg:col-span-8 flex flex-col h-[700px]">
          <div className="glass border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden">
            <div className="bg-[#1a1c2e] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                <div className="flex items-center gap-2 text-primary">
                  <Terminal size={14} />
                  <span className="text-xs font-mono font-bold tracking-widest">SYSTEM_CONSOLE v4.1</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {status === "running" && (
                  <span className="flex items-center gap-2 text-[10px] text-green-400 font-black animate-pulse uppercase mr-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    Running
                  </span>
                )}
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${socketConnected ? 'text-cyan-400' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-cyan-400' : 'bg-red-400 animate-pulse'}`}></span>
                    {socketConnected ? 'Socket Connected' : 'Socket Disconnected'}
                </div>
                <button 
                  onClick={clearLogs}
                  className="p-1 px-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-md text-[10px] uppercase font-bold transition-colors"
                >
                  <Trash2 size={12} className="inline mr-1" />
                  Xóa Log
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black/80 font-mono text-[13px] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
                  <Terminal className="w-20 h-20 mb-4" />
                  <p className="text-lg font-bold">AWAITING CONNECTION...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-4 group hover:bg-white/5 transition-colors -mx-2 px-2 py-0.5 rounded">
                      <span className="text-slate-600 select-none shrink-0 w-16">
                        {log.time ? new Date(log.time).toLocaleTimeString([], { hour12: false }) : '--:--:--'}
                      </span>
                      <span className={`
                        ${log.message.includes('ERROR') || log.message.includes('❌') ? 'text-red-400' : 
                          log.message.includes('DONE') || log.message.includes('✅') ? 'text-green-400' : 
                          log.message.includes('🤖') ? 'text-cyan-400' : 
                          'text-slate-300'}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-3 bg-black/40 border-t border-white/5 text-[10px] text-slate-500 font-mono flex items-center justify-between px-6">
              <span>EST_STATUS: {status.toUpperCase()}</span>
              <span>BUFFER: {logs.length}/500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
