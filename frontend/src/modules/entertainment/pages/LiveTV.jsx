
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api'; // Adjust path based on location
import TVPlayer from '../components/TVPlayer';
import { Search, Radio, Wifi, WifiOff, ListFilter } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const LiveTV = () => {
    const [channels, setChannels] = useState([]);
    const [filteredChannels, setFilteredChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Fetch Channels
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const data = await api.get('/tv/channels');
                if (Array.isArray(data)) {
                    setChannels(data);
                    setFilteredChannels(data);
                    if (data.length > 0) setSelectedChannel(data[0]);
                }
            } catch (err) {
                console.error("Fetch channels error", err);
                toast.error("Không thể tải danh sách kênh TV");
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();
    }, []);

    const [regionFilter, setRegionFilter] = useState('All'); // All, Vietnam, International
    const [categoryFilter, setCategoryFilter] = useState('All'); // All, HD, Sports...

    // Categories for filter (derived from current channels)
    const categories = ['All', 'HD', ...new Set(channels.flatMap(c => c.categories))].filter(Boolean);

    // Filter Logic
    useEffect(() => {
        let result = channels;

        // Helper to detect VN
        const isVietnam = (c) => {
            const name = c.name.toLowerCase();
            const cat = Array.isArray(c.categories) ? c.categories.join(' ').toLowerCase() : '';
            
            // 1. Check explicit Category
            if (cat.includes('vietnam') || cat.includes('vn')) return true;

            // 2. Check Name Prefixes/Keywords (Case insensitive)
            const vnKeywords = ['vtv', 'htv', 'vtc', 'thvl', 'sctv', 'k+', 'antv', 'qpvn', 'vov', 'hanoi', 'h1', 'h2', 'dn1', 'dn2', 'itv', 'real tv', 'quocthoi', 'quochoi', 'nhandan', 'qpv'];
            if (vnKeywords.some(k => name.includes(k))) return true;

            // 3. Check Vietnamese Characters (Unicode block)
            if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(name)) return true;

            return false;
        };

        // 1. Region Filter
        if (regionFilter === 'Vietnam') {
            result = result.filter(isVietnam);
        } else if (regionFilter === 'International') {
            result = result.filter(c => !isVietnam(c));
        }

        // 2. Category Filter
        if (categoryFilter !== 'All') {
             if (categoryFilter === 'HD') {
                 result = result.filter(c => c.is_hd);
             } else {
                 result = result.filter(c => c.categories.includes(categoryFilter));
             }
        }

        // 3. Search Filter
        if (search) {
            const lowSearch = search.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(lowSearch));
        }

        setFilteredChannels(result);
    }, [search, regionFilter, categoryFilter, channels]);

    const handleChannelError = () => {
        toast.error(`Kênh ${selectedChannel?.name} đang gặp sự cố. Đang tìm kênh dự phòng...`);
        if (selectedChannel.is_fallback) return; 
    };

    return (
        <div className="min-h-screen bg-[#0b1020] text-slate-200">
            {/* Header / Nav could be here */}
            
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
                
                {/* LEFT: Channel List */}
                <div className="w-full md:w-80 lg:w-96 bg-[#161b2e] border-r border-slate-800 flex flex-col h-full z-20 shadow-xl">
                    {/* Search & Header */}
                    <div className="p-4 border-b border-slate-700 bg-[#161b2e]">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary">
                            <Radio className="text-red-500 animate-pulse" /> Live TV
                        </h2>
                        
                        <div className="relative group mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Tìm kênh (VTV, HTV...)" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#0b1020] border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {/* Region Filters (Tabs) */}
                        <div className="flex bg-[#0b1020] p-1 rounded-lg mb-3 border border-slate-700">
                             {['All', 'Vietnam', 'International'].map(type => (
                                 <button
                                     key={type}
                                     onClick={() => setRegionFilter(type)}
                                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                                         ${regionFilter === type ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                 >
                                     {type === 'Vietnam' ? 'Việt Nam' : type === 'International' ? 'Quốc Tế' : 'Tất Cả'}
                                 </button>
                             ))}
                        </div>

                        {/* Category Filters (Chips) */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {categories.filter(c => !['All', 'Vietnam', 'International'].includes(c)).slice(0, 10).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                        ${categoryFilter === cat ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-2 space-y-1">
                        {loading ? (
                            Array(10).fill(0).map((_, i) => (
                                <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse mx-2" />
                            ))
                        ) : filteredChannels.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 italic">
                                Không tìm thấy kênh nào
                            </div>
                        ) : (
                            filteredChannels.map(channel => (
                                <button
                                    key={channel.url}
                                    onClick={() => setSelectedChannel(channel)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative
                                        ${selectedChannel?.url === channel.url 
                                            ? 'bg-primary/20 border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                                            : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    {/* Logo */}
                                    <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center p-1 border border-white/5 shadow-sm overflow-hidden">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt={channel.name} loading="lazy" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
                                        ) : (
                                            <Radio size={20} className="text-slate-600" />
                                        )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 text-left">
                                        <h3 className={`font-bold text-sm line-clamp-1 ${selectedChannel?.url === channel.url ? 'text-primary' : 'text-slate-200 group-hover:text-white'}`}>
                                            {channel.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {channel.is_hd && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/20">HD</span>
                                            )}
                                            <span className="text-[10px] text-slate-500 truncate">{channel.categories.join(', ')}</span>
                                        </div>
                                    </div>

                                    {/* Active Indicator */}
                                    {selectedChannel?.url === channel.url && (
                                        <div className="absolute right-3 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Player */}
                <div className="flex-1 bg-black flex flex-col relative">
                    {selectedChannel ? (
                        <>
                            {/* Player Wrapper */}
                            <div className="flex-1 relative flex flex-col justify-center bg-black/90">
                                {/* Background blur effect */}
                                <div 
                                    className="absolute inset-0 opacity-10 blur-3xl"
                                    style={{ backgroundImage: `url(${selectedChannel.logo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                />
                                
                                <div className="w-full flex-1 flex items-center justify-center p-4">
                                    <div className="w-full max-w-5xl aspect-video shadow-2xl shadow-black rounded-2xl overflow-hidden border border-white/10 relative group">
                                         <TVPlayer 
                                            url={selectedChannel.url} 
                                            poster={selectedChannel.logo}
                                            name={selectedChannel.name}
                                            onError={handleChannelError}
                                            className="w-full h-full"
                                         />
                                    </div>
                                </div>
                                
                                {/* EPG Timeline */}
                                <EPGTimeline channel={selectedChannel} />
                            </div>

                            {/* Info Bar (Bottom) - Removed redundant info, kept status */}
                            <div className="h-12 bg-[#161b2e] border-t border-slate-800 flex items-center px-4 justify-end text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Wifi size={14} className="text-green-500" />
                                    <span>Tín hiệu ổn định (Adaptive)</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <Radio size={64} className="opacity-20 animate-pulse" />
                            <p>Chọn kênh để bắt đầu xem</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// EPG Component
const EPGTimeline = ({ channel }) => {
    const [epg, setEpg] = useState(null);
    const [progress, setProgress] = useState(0);

    // Fetch EPG
    useEffect(() => {
        if (!channel) return;
        
        const fetchEPG = async () => {
             try {
                 const res = await api.get(`/tv/epg?channel_name=${encodeURIComponent(channel.name)}`);
                 setEpg(res);
             } catch (e) { console.error(e); }
        };
        fetchEPG();
        
        // Refresh every minute
        const interval = setInterval(fetchEPG, 60000);
        return () => clearInterval(interval);
    }, [channel]);

    // Update Progress
    useEffect(() => {
        if (!epg?.current) {
            setProgress(0);
            return;
        }

        const updateProgress = () => {
            const now = Date.now();
            const start = new Date(epg.current.start).getTime();
            const end = new Date(epg.current.stop).getTime();
            const total = end - start;
            const elapsed = now - start;
            const p = Math.min(100, Math.max(0, (elapsed / total) * 100));
            setProgress(p);
        };

        updateProgress();
        const interval = setInterval(updateProgress, 10000);
        return () => clearInterval(interval);
    }, [epg]);

    if (!epg?.current) return (
        <div className="w-full bg-[#111] p-4 border-t border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 w-1/3 rounded mb-2"></div>
            <div className="h-3 bg-white/5 w-1/4 rounded"></div>
        </div>
    );

    const formatTime = (iso) => {
        const d = new Date(iso);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-[#161b2e]/90 backdrop-blur-md border-t border-white/10 p-4 relative z-20">
            <div className="flex gap-8 relative">
                {/* Current Program */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-primary text-xs font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Đang phát
                    </div>
                    <h3 className="text-white font-bold text-lg md:text-xl truncate">{epg.current.title}</h3>
                    <div className="text-slate-400 text-sm mt-1 mb-3 line-clamp-1">{epg.current.description}</div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                         <span>{formatTime(epg.current.start)}</span>
                         <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_10px_#3b82f6]" 
                                style={{ width: `${progress}%` }}
                             />
                         </div>
                         <span>{formatTime(epg.current.stop)}</span>
                    </div>
                </div>

                {/* Next Program (Hidden on mobile) */}
                {epg.next && (
                    <div className="hidden md:block w-1/3 border-l border-white/10 pl-8 opacity-60">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tiếp theo</div>
                        <h4 className="text-slate-200 font-bold truncate">{epg.next.title}</h4>
                        <div className="text-slate-500 text-xs mt-1">
                            {formatTime(epg.next.start)} - {formatTime(epg.next.stop)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTV;
