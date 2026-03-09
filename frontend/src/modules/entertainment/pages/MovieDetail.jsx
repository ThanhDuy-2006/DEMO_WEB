
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ophimService } from '../services/ophimApi';
import BackButton from "../../../components/common/BackButton";
import { Play, Info, Calendar, Globe, Clock, History, AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight, Monitor, Star, Tv, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { useToast } from '../../../context/ToastContext';
import HLSPlayer from '../../../components/common/HLSPlayer';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMovieHistory } from '../hooks/useMovieHistory';

export default function MovieDetail() {
    const { slug } = useParams();
    const toast = useToast();
    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const { history: movieHistory, markEpisodeAsWatched } = useMovieHistory(slug);
    
    // Data
    const [movie, setMovie] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(null);
    
    // Player States
    const [activeEmbed, setActiveEmbed] = useState('');
    const [activeEpisode, setActiveEpisode] = useState(null);
    const [hlsError, setHlsError] = useState(false);
    const [activeSource, setActiveSource] = useState(ophimService.getActiveSource().name);

    // Save progress ref
    const saveIntervalRef = useRef(null);

    // Fetch Data
    const fetchDetail = async (sourceName) => {
        setLoading(true);
        setError(null);
        if (sourceName) {
            ophimService.setSourceByName(sourceName);
            setActiveSource(sourceName);
        }
        try {
            const res = await ophimService.getMovieDetail(slug, !sourceName);
            if (res.success && res.data) {
                const movieData = res.data;
                const sessions = movieData.episodes || [];
                
                setMovie(movieData);
                setEpisodes(sessions);
                setActiveSource(movieData.raw_source);

                // Auto prepare first episode
                const bestServer = ophimService.selectBestServer(sessions);
                if (bestServer && bestServer.items?.length > 0) {
                    const firstEp = bestServer.items[0];
                    // Don't auto set active embed until user plays, to allow "Resume" logic
                    // But we can verify if we have a saved history
                    const oldSaved = localStorage.getItem(`watch_history_${slug}`); // fallback for legacy
                    if (oldSaved && !movieHistory?.lastWatched) {
                        try {
                            const parsed = JSON.parse(oldSaved);
                            setShowResumePrompt(parsed);
                        } catch (e) {}
                    }
                    
                    if (movieHistory?.lastWatched) {
                        setShowResumePrompt({ episode_name: movieHistory.lastWatched });
                    }
                }
            } else {
                if (sourceName) {
                    toast.error(`Không thể tải từ ${sourceName}: ${res.error || "Nguồn lỗi"}`);
                    if (movie) setActiveSource(movie.raw_source);
                    setLoading(false);
                    return; 
                }
                setError(res.error || "Không thể lấy thông tin phim");
            }
        } catch (error) {
            console.error("Failed to load movie detail", error);
            setError("Lỗi kết nối máy chủ dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        setIsPlaying(false);
        return () => stopProgressSaver();
    }, [slug]);

    useEffect(() => {
        setHlsError(false);
        if (isPlaying && activeEpisode) {
            startProgressSaver();
        } else {
            stopProgressSaver();
        }
    }, [activeEpisode, isPlaying]);

    const startProgressSaver = () => {
        stopProgressSaver();
        
        // Initial mark immediately
        if (activeEpisode) markEpisodeAsWatched(slug, activeEpisode.name);

        saveIntervalRef.current = setInterval(() => {
            if (activeEpisode) {
                markEpisodeAsWatched(slug, activeEpisode.name);
                
                // Keep old format for cross-compatibility if needed
                const historyStr = {
                    episode_name: activeEpisode.name,
                    slug: activeEpisode.slug,
                    embed: activeEpisode.embed,
                    timestamp: Date.now()
                };
                localStorage.setItem(`watch_history_${slug}`, JSON.stringify(historyStr));
            }
        }, 10000); // Save every 10s
    };

    const stopProgressSaver = () => {
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };

    const handlePlay = (episode = null) => {
        if (episode) {
            setActiveEmbed(episode.embed);
            setActiveEpisode(episode);
            // Also update resume prompt to null as we started playing
            setShowResumePrompt(null);
        } else if (!activeEpisode && episodes.length > 0) {
            // Play first available if none selected
             const bestServer = ophimService.selectBestServer(episodes);
             if (bestServer?.items?.[0]) {
                 setActiveEmbed(bestServer.items[0].embed);
                 setActiveEpisode(bestServer.items[0]);
             }
        }
        setIsPlaying(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleResume = () => {
        if (showResumePrompt) {
            // Find episode in current list
            let found = false;
            for(const server of episodes) {
                const ep = server.items.find(e => e.name === showResumePrompt.episode_name);
                if (ep) {
                    handlePlay(ep);
                    found = true;
                    break;
                }
            }
            if (!found) {
                toast.error("Không tìm thấy tập cũ, đang phát từ đầu.");
                handlePlay();
            }
        }
        setShowResumePrompt(null);
    };

    const handleFallback = () => {
        if (!activeEpisode) return;
        const currentEpName = activeEpisode.name;
        for (const server of episodes) {
            const alternative = server.items.find(ep => ep.name === currentEpName && ep.embed !== activeEmbed);
            if (alternative) {
                setActiveEmbed(alternative.embed);
                setActiveEpisode(alternative);
                toast.success(`Đã chuyển sang server: ${server.server_name}`);
                return;
            }
        }
        toast.error("Không tìm thấy server dự phòng cho tập này.");
    };

    const handleNextEpisode = () => {
        for(const server of episodes) {
            const idx = server.items.findIndex(e => e.embed === activeEmbed);
            if(idx !== -1 && idx < server.items.length - 1) {
                handlePlay(server.items[idx + 1]);
                return;
            }
        }
        toast.info("Bạn đã xem đến tập cuối");
    };

    const handlePrevEpisode = () => {
        for(const server of episodes) {
            const idx = server.items.findIndex(e => e.embed === activeEmbed);
            if(idx > 0) {
                handlePlay(server.items[idx - 1]);
                return;
            }
        }
    };

    const handleToggleList = () => {
        const added = toggleWatchlist(movie);
        if (added) {
            toast.success("Đã thêm vào danh sách của bạn");
        } else {
            toast.info("Đã xóa khỏi danh sách của bạn");
        }
    };

    // --- RENDER HELPERS ---

    if (loading) return (
        <div className="min-h-screen bg-[#0b1020] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 uppercase tracking-widest font-bold text-sm">Loading HouseFim...</p>
            </div>
        </div>
    );

    if (error || !movie) return (
        <div className="min-h-screen bg-[#0b1020] flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
                <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Đã xảy ra lỗi</h2>
                <p className="text-slate-400 mb-8">{error}</p>
                <div className="flex gap-4 justify-center">
                    <Link to="/entertainment/movies" className="px-6 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition font-bold text-white">
                        Về Trang Chủ
                    </Link>
                    <button onClick={() => fetchDetail()} className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition font-bold text-white">
                        Thử Lại
                    </button>
                </div>
            </div>
        </div>
    );

    // --- PLAYER VIEW CONFIG ---
    if (isPlaying) {
        return (
            <div className="min-h-screen bg-[#0b1020] text-slate-200 font-sans pb-20 animate-fade-in">
                
                {/* 1. VIDEO CONTAINER (Full Width, 16:9 or Theater) */}
                <div className="w-full bg-black sticky top-0 z-50 group shadow-2xl">
                    <div className="active-player-wrapper relative w-full aspect-video md:h-[80vh] mx-auto bg-black">
                        {/* TOP OVERLAY CONTROLS (Only visible on hover) */}
                        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-[60] flex items-start justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            {/* Left: Back */}
                            <button 
                                onClick={() => setIsPlaying(false)} 
                                className="pointer-events-auto flex items-center gap-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full backdrop-blur-md transition-all border border-white/10"
                            >
                                <ArrowLeft size={20} /> <span className="hidden sm:inline font-bold text-sm">Thoát</span>
                            </button>

                            {/* Right: Navigation & Tools */}
                            <div className="pointer-events-auto flex items-center gap-3">
                                <button 
                                    onClick={handlePrevEpisode}
                                    className="p-2 sm:px-4 sm:py-2 bg-black/40 hover:bg-white/20 text-white rounded-full sm:rounded-lg backdrop-blur-md border border-white/10 transition-all flex items-center gap-2"
                                    title="Tập trước"
                                >
                                    <ChevronLeft size={20} /> <span className="hidden sm:inline text-xs font-bold uppercase">Trước</span>
                                </button>
                                
                                <button 
                                    onClick={handleNextEpisode}
                                    className="p-2 sm:px-4 sm:py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full sm:rounded-lg backdrop-blur-md transition-all flex items-center gap-2 shadow-lg shadow-red-900/50"
                                    title="Tập tiếp"
                                >
                                    <span className="hidden sm:inline text-xs font-bold uppercase">Sau</span> <ChevronRight size={20} />
                                </button>

                                <button 
                                    onClick={handleFallback}
                                    className="ml-2 p-2 sm:px-4 sm:py-2 bg-slate-700/50 hover:bg-slate-600 text-slate-200 rounded-lg backdrop-blur text-xs font-bold border border-white/5 flex items-center gap-2"
                                >
                                    <RefreshCw size={14} /> <span className="hidden sm:inline">Server</span>
                                </button>
                            </div>
                        </div>

                        {/* VIDEO ELEMENT */}
                        {activeEpisode?.m3u8 && activeEpisode.m3u8.includes('.m3u8') && !hlsError ? (
                            <HLSPlayer 
                                src={activeEpisode.m3u8} 
                                poster={movie.poster_url || movie.thumb_url}
                                autoPlay={true}
                                className="w-full h-full object-contain"
                                onError={() => setHlsError(true)}
                            />
                        ) : (
                            <iframe
                                src={activeEmbed}
                                className="w-full h-full border-none"
                                allowFullScreen
                                title={movie.name}
                                allow="autoplay; encrypted-media"
                            ></iframe>
                        )}
                    </div>
                </div>

                {/* 2. INFO & EPISODES CONTAINER */}
                <div className="container mx-auto px-4 sm:px-8 py-8 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        
                        {/* LEFT: INFO */}
                        <div className="lg:w-1/3 space-y-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{movie.name}</h1>
                                <div className="text-slate-400 text-sm font-medium mb-4">{movie.origin_name}</div>
                                
                                <div className="flex items-center gap-4 text-xs sm:text-sm font-bold text-slate-300 mb-6">
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/20">{movie.quality || 'FHD'}</span>
                                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {movie.tmdb?.vote_average || 9.5}</span>
                                    <span>{movie.year}</span>
                                    <span>{movie.time || 'N/A'}</span>
                                </div>

                                <div className="flex gap-3 mb-6">
                                    <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-white border border-white/10 transition flex items-center justify-center gap-2">
                                        <Info size={18} /> Chi Tiết
                                    </button>
                                    <button 
                                        onClick={handleToggleList}
                                        className={`flex-1 py-3 rounded-lg font-bold text-white border transition flex items-center justify-center gap-2 ${isInWatchlist(movie.slug) ? 'bg-red-600/20 border-red-600 text-red-500' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                                    >
                                        {isInWatchlist(movie.slug) ? <X size={18} /> : <span>+</span>} Danh Sách
                                    </button>
                                </div>
                                
                                <div className="p-4 bg-[#1a2035] rounded-xl border border-white/5">
                                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: movie.content }} />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: EPISODE LIST */}
                        <div className="lg:w-2/3">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Tv size={20} className="text-red-500" /> Danh Sách Của Tôi
                                </h3>
                                <div className="flex items-center gap-2">
                                     {episodes.map(s => (
                                         <span key={s.server_name} className="text-xs font-bold text-slate-500 uppercase px-2">{s.server_name}</span>
                                     ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {episodes.flatMap(server => server.items).map((ep, idx) => {
                                    const isActive = activeEpisode?.embed === ep.embed;
                                    const isWatched = movieHistory?.watchedEpisodes?.includes(ep.name);
                                    const isLastWatched = movieHistory?.lastWatched === ep.name;
                                    
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handlePlay(ep)}
                                            className={`relative aspect-video rounded-lg overflow-hidden border transition-all group ${
                                                isActive 
                                                ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                                                : isLastWatched
                                                    ? 'border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.1)]'
                                                    : isWatched
                                                        ? 'border-slate-800 opacity-70'
                                                        : 'border-slate-800 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className={`absolute inset-0 flex flex-col items-center justify-center font-bold text-sm sm:text-base transition-colors ${
                                                isActive 
                                                    ? 'bg-red-600/90 text-white' 
                                                    : isLastWatched 
                                                        ? 'bg-red-900/40 text-red-200' 
                                                        : isWatched 
                                                            ? 'bg-slate-800/50 text-slate-500' 
                                                            : 'bg-slate-800/80 text-slate-300 group-hover:bg-slate-700'
                                            }`}>
                                                {ep.name}
                                                {isWatched && !isActive && <CheckCircle2 size={12} className={isLastWatched ? "text-red-400 mt-1" : "text-green-500/50 mt-1"} />}
                                            </div>
                                            {isActive && (
                                                <div className="absolute bottom-1 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-md"></div>
                                            )}
                                            {isLastWatched && !isActive && (
                                                <div className="absolute top-0 right-0 bg-red-600 text-[8px] px-1 py-0.5 rounded-bl font-black text-white">
                                                    Đang xem
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // --- NORMAL DETAIL VIEW (Before Playing) ---
    return (
        <div className="min-h-screen bg-[#0b1020] text-slate-200 font-sans pb-20 fade-in">
             {/* HEADER / NAV (Transparent) */}
             <div className="absolute top-0 left-0 right-0 z-40 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                 <Link to="/entertainment/movies" className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-lg">House<span className="text-red-600">Fim</span></Link>
                 
                 {/* Source Switcher */}
                 <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
                    {ophimService.getSources().map((source) => (
                        <button
                            key={source.name}
                            onClick={() => {
                                if (activeSource !== source.name) fetchDetail(source.name);
                            }}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                activeSource === source.name
                                ? 'bg-red-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {source.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* HERO BANNER SECTION */}
            <div className="relative w-full h-[85vh] overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src={movie.poster_url || movie.thumb_url} 
                        alt={movie.name} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0b1020] via-[#0b1020]/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-transparent to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20 pt-20">
                    <div className="max-w-2xl animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-10 h-10 flex items-center justify-center bg-red-600 text-white font-black text-xs rounded shadow-lg shadow-red-600/20">
                                TOP
                            </span>
                            <span className="text-green-400 font-bold uppercase tracking-widest text-sm">
                                {movie.quality || 'FULL HD'}
                            </span>
                            <span className="text-slate-300 font-bold text-sm bg-white/10 px-2 py-1 rounded">
                                {movie.year}
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tighter uppercase italic">
                            {movie.name}
                        </h1>

                        <div className="flex flex-wrap gap-4 text-slate-300 text-sm font-medium mb-8">
                            <span className="flex items-center gap-1"><Clock size={16} className="text-red-500" /> {movie.time || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Globe size={16} className="text-blue-500" /> {movie.country?.[0]?.name || 'Quốc tế'}</span>
                            <div className="flex items-center gap-2">
                                {movie.category?.slice(0, 3).map((cat, i) => (
                                    <span key={i} className="px-2 py-0.5 border border-slate-600 rounded text-xs text-slate-400">{cat.name}</span>
                                ))}
                            </div>
                        </div>

                        {/* Description Preview */}
                        <div 
                            className="text-slate-300 text-base sm:text-lg mb-10 line-clamp-3 max-w-xl leading-relaxed font-light"
                            dangerouslySetInnerHTML={{ __html: movie.content }}
                        />

                        {/* Resume Prompt if exists */}
                        {showResumePrompt && (
                            <div className="mb-6 bg-blue-600/20 border border-blue-500/50 p-4 rounded-lg flex items-center justify-between backdrop-blur-sm">
                                <span className="text-blue-200 text-sm">
                                    Bạn đang xem dở <strong>Tập {showResumePrompt.episode_name}</strong>
                                </span>
                                <div className="flex gap-2">
                                     <button 
                                        onClick={handleResume}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded"
                                    >
                                        Xem tiếp
                                    </button>
                                    <button 
                                        onClick={() => setShowResumePrompt(null)}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded"
                                    >
                                        Bỏ qua
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => handlePlay(showResumePrompt ? null : episodes[0]?.items?.[0])}
                                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg flex items-center gap-3 transition-transform active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)] group"
                            >
                                <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" /> 
                                {showResumePrompt ? 'XEM TIẾP' : 'XEM NGAY'}
                            </button>
                            <button 
                                onClick={handleToggleList}
                                className={`px-8 py-4 rounded-lg border font-bold text-lg transition-transform active:scale-95 flex items-center gap-3 ${isInWatchlist(movie.slug) ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'}`}
                            >
                                {isInWatchlist(movie.slug) ? <X size={20} /> : <span>+</span>} 
                                {isInWatchlist(movie.slug) ? 'BỎ THEO DÕI' : 'DANH SÁCH'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION (2 Columns) */}
            <div className="container mx-auto px-6 sm:px-12 lg:px-20 -mt-20 relative z-10">
                <div className="flex flex-col xl:flex-row gap-12">
                    {/* LEFT: INFO */}
                    <div className="w-full xl:w-1/3 space-y-8">
                         <div className="bg-[#161b2e]/90 backdrop-blur border border-white/5 p-8 rounded-2xl shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Info size={20} className="text-blue-500" /> Thông Tin Chi Tiết
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div><span className="text-slate-500 block mb-1">Tên Khác:</span><span className="text-white font-medium">{movie.origin_name}</span></div>
                                <div className="h-px bg-white/5"></div>
                                <div><span className="text-slate-500 block mb-1">Đạo Diễn:</span><span className="text-white font-medium">{movie.director?.join(', ') || 'N/A'}</span></div>
                                <div className="h-px bg-white/5"></div>
                                <div><span className="text-slate-500 block mb-1">Diễn Viên:</span><span className="text-slate-300">{movie.actor?.join(', ') || 'N/A'}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: EPISODES */}
                    <div className="w-full flex-1">
                        <div className="bg-[#161b2e] border border-white/5 p-8 rounded-2xl shadow-xl min-h-[500px]">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Monitor size={28} className="text-red-600" /> DANH SÁCH TẬP</h3>
                            {episodes.map((server, sIdx) => (
                                <div key={sIdx} className="mb-8">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{server.server_name}</h4>
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                        {server.items?.map((ep, eIdx) => {
                                            const isWatched = movieHistory?.watchedEpisodes?.includes(ep.name);
                                            const isLastWatched = movieHistory?.lastWatched === ep.name;
                                            
                                            return (
                                            <button
                                                key={eIdx}
                                                onClick={() => handlePlay(ep)}
                                                className={`relative aspect-square flex flex-col items-center justify-center overflow-hidden rounded-lg font-bold text-sm transition-all border ${
                                                    isLastWatched
                                                        ? 'bg-red-900/30 text-red-200 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.1)] hover:bg-red-800/50'
                                                        : isWatched
                                                            ? 'bg-slate-800/40 text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                                                            : 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700 hover:text-white'
                                                }`}
                                            >
                                                {ep.name}
                                                {isLastWatched && (
                                                    <div className="absolute top-0 right-0 bg-red-600 text-[8px] px-1 py-0.5 rounded-bl text-white font-black">
                                                        Đang xem
                                                    </div>
                                                )}
                                                {isWatched && !isLastWatched && (
                                                    <CheckCircle2 size={12} className="text-green-500/50 mt-1" />
                                                )}
                                            </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
