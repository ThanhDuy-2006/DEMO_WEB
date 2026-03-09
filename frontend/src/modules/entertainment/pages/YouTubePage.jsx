import React, { useState, useRef, useEffect } from 'react';
import {
    Play, Pause, Search,
    SkipForward, SkipBack, Volume2, VolumeX, Heart,
    Shuffle, Repeat, Repeat1, Music, ChevronLeft, ChevronRight,
    Youtube, TrendingUp, Music2, ListMusic
} from 'lucide-react';

import { api } from '../../../services/api';

export default function YouTubePage() {
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSearched, setLastSearched] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [playbackQueue, setPlaybackQueue] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [likedSongs, setLikedSongs] = useState([]);
    const [searchError, setSearchError] = useState(null);
    const [dashboardData, setDashboardData] = useState([]);

    // Player Refs
    const playerRef = useRef(null);
    const progressInterval = useRef(null);
    const playerContainerRef = useRef(null);

    // Initialize YouTube Iframe API
    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem('yt_liked_songs') || '[]');
        setLikedSongs(savedLikes);
        loadDashboard();

        // Load YT API Script
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            console.log("YouTube API Ready");
        };

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            if (playerRef.current) playerRef.current.destroy();
        };
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/entertainment/music/youtube/trending?region=VN');
            const tracks = (res.items || []).slice(0, 18).map(v => ({
                id: typeof v.id === 'string' ? v.id : v.id.videoId,
                title: v.snippet.title,
                thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
                channelTitle: v.snippet.channelTitle
            }));
            setDashboardData([{ title: "Xu Hướng Âm Nhạc Việt Nam", tracks }]);
        } catch (error) {
            console.error("Dashboard Load Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const performSearch = async (query) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setSearchError(null);
        setLastSearched(query);

        try {
            const res = await api.get(`/entertainment/music/youtube/search?q=${encodeURIComponent(query)}`);
            const tracks = (res.items || []).map(v => ({
                id: v.id.videoId,
                title: v.snippet.title,
                thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
                channelTitle: v.snippet.channelTitle
            }));
            setSearchResults(tracks);
        } catch (error) {
            setSearchError("Lỗi kết nối YouTube API.");
        } finally {
            setIsLoading(false);
        }
    };

    const onPlayerStateChange = (event) => {
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued).
        if (event.data === 1) { // Playing
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(playerRef.current.getDuration());
            startProgressTracker();
        } else if (event.data === 2) { // Paused
            setIsPlaying(false);
        } else if (event.data === 0) { // Ended
            playNext();
        } else if (event.data === 3) { // Buffering
            setIsLoading(true);
        }
    };

    const startProgressTracker = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                setProgress(playerRef.current.getCurrentTime());
            }
        }, 1000);
    };

    const playSong = (song, queue = []) => {
        if (queue.length > 0) setPlaybackQueue(queue);
        setCurrentSong(song);
        setIsLoading(true);

        if (!playerRef.current) {
            // First time initialization
            playerRef.current = new window.YT.Player('yt-player-container', {
                height: '0',
                width: '0',
                videoId: song.id,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'rel': 0,
                    'modestbranding': 1
                },
                events: {
                    'onReady': (event) => {
                        event.target.setVolume(volume);
                        event.target.playVideo();
                    },
                    'onStateChange': onPlayerStateChange,
                    'onError': (e) => {
                        console.error("YT Player Error", e);
                        setSearchError("Không thể phát video này do giới hạn bản quyền từ YouTube.");
                        setIsLoading(false);
                    }
                }
            });
        } else {
            playerRef.current.loadVideoById(song.id);
            playerRef.current.playVideo();
        }
    };

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const playNext = () => {
        if (playbackQueue.length === 0) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong?.id);
        if (currentIndex < playbackQueue.length - 1) {
            playSong(playbackQueue[currentIndex + 1]);
        }
    };

    const playPrev = () => {
        if (playbackQueue.length === 0) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong?.id);
        if (currentIndex > 0) {
            playSong(playbackQueue[currentIndex - 1]);
        }
    };

    const handleProgressChange = (e) => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
            setProgress(time);
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseInt(e.target.value);
        setVolume(val);
        if (playerRef.current) {
            playerRef.current.setVolume(val);
        }
        setIsMuted(val === 0);
    };

    const toggleLike = (e, song) => {
        e.stopPropagation();
        let newLikes;
        if (likedSongs.some(s => s.id === song.id)) {
            newLikes = likedSongs.filter(s => s.id !== song.id);
        } else {
            newLikes = [song, ...likedSongs];
        }
        setLikedSongs(newLikes);
        localStorage.setItem('yt_liked_songs', JSON.stringify(newLikes));
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#121212] text-white overflow-hidden font-sans">
            {/* Hidden Player Stage */}
            <div id="yt-player-container" className="hidden"></div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col w-full overflow-y-auto bg-gradient-to-b from-red-900/30 to-[#121212] p-6 custom-scrollbar">
                    
                    <div className="flex items-center justify-between mb-8 sticky top-0 z-20 bg-[#121212]/80 backdrop-blur-md p-4 rounded-full border border-white/5">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-full max-w-md">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                                    placeholder="Tìm bất kỳ bài hát nào trên YouTube..."
                                    className="w-full bg-[#242424] text-white rounded-full py-3 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all hover:bg-[#2a2a2a] text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                            <button onClick={() => performSearch(searchQuery)} className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform">Tìm kiếm</button>
                            <button 
                                onClick={() => { setSearchResults(likedSongs); setLastSearched('Thư viện yêu thích'); }} 
                                className="px-5 py-2.5 bg-red-600/90 text-white text-sm font-bold flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                            >
                                <Heart size={16} fill="white" /> Yêu thích
                            </button>
                        </div>
                    </div>

                    <div className="pb-24">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            {lastSearched ? <>Kết quả cho "<span className="text-red-600">{lastSearched}</span>"</> : <><Music2 className="text-red-600" /> Khám phá YouTube Music</>}
                        </h2>
                        
                        {isLoading && !currentSong ? (
                            <div className="flex flex-col justify-center items-center h-64 gap-4">
                                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-400 font-medium italic">Đang tải dữ liệu từ YouTube...</p>
                            </div>
                        ) : searchError ? (
                            <div className="bg-red-900/10 border border-red-500/20 p-10 rounded-3xl text-center">
                                <p className="text-red-200 font-bold mb-6 text-lg">{searchError}</p>
                                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white rounded-full text-sm font-bold hover:shadow-xl shadow-red-600/20 transition-all">Làm mới trang</button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {!lastSearched && dashboardData.map((section, sidx) => (
                                    <div key={sidx}>
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-red-600 pl-4">{section.title}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                            {section.tracks.map((song) => (
                                                <div key={song.id} onClick={() => playSong(song, section.tracks)} 
                                                    className={`bg-[#181818] p-4 rounded-xl cursor-pointer hover:bg-[#282828] transition-all group border border-white/5 relative overflow-hidden ${currentSong?.id === song.id ? 'bg-red-900/20 border-red-600/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : ''}`}
                                                >
                                                    <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-900 shadow-xl">
                                                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                                                                <Play size={24} fill="white" className="ml-1 text-white" />
                                                            </div>
                                                        </div>
                                                        {currentSong?.id === song.id && isPlaying && (
                                                            <div className="absolute bottom-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                                                <div className="flex gap-0.5 items-end h-3">
                                                                    <div className="w-1 bg-white animate-music-bar-1"></div>
                                                                    <div className="w-1 bg-white animate-music-bar-2"></div>
                                                                    <div className="w-1 bg-white animate-music-bar-3"></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className={`font-bold text-sm line-clamp-2 h-10 mb-1 leading-snug ${currentSong?.id === song.id ? 'text-red-500' : 'text-white'}`}>{song.title}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{song.channelTitle}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {lastSearched && (
                                    <div className="bg-[#181818]/40 rounded-3xl p-4 overflow-hidden border border-white/5 backdrop-blur-sm">
                                        <div className="space-y-1">
                                            {searchResults.map((song, idx) => (
                                                <div key={song.id} onClick={() => playSong(song, searchResults)}
                                                    className={`group grid grid-cols-[50px_1fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-xl hover:bg-white/5 transition-all cursor-pointer ${currentSong?.id === song.id ? 'bg-red-600/10' : ''}`}
                                                >
                                                    <div className="flex justify-center text-gray-400">
                                                        {currentSong?.id === song.id ? (
                                                            isPlaying ? <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div> : <Pause size={14} fill="currentColor" className="text-red-500" />
                                                        ) : (
                                                            <Play size={14} fill="currentColor" className="opacity-0 group-hover:opacity-100" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <img src={song.thumbnail} className="w-10 h-10 rounded-md object-cover shadow-md" alt="" />
                                                        <div className="min-w-0">
                                                            <h4 className={`text-sm font-bold truncate ${currentSong?.id === song.id ? 'text-red-500' : 'text-white'}`}>{song.title}</h4>
                                                            <p className="text-[10px] text-gray-500 md:hidden">{song.channelTitle}</p>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block text-xs text-gray-400 truncate">{song.channelTitle}</div>
                                                    <button onClick={(e) => toggleLike(e, song)} className="p-2 hover:scale-120 transition-transform">
                                                        <Heart size={18} className={likedSongs.some(s => s.id === song.id) ? 'fill-red-600 text-red-600' : 'text-gray-600'} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Player Bar */}
            <div className="h-[100px] bg-[#181818] border-t border-white/5 flex items-center justify-between px-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center w-[30%] min-w-[220px]">
                    {currentSong ? (
                        <>
                            <div className="relative group shrink-0">
                                <img src={currentSong.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover shadow-2xl border border-white/10" />
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex flex-col justify-center min-w-0">
                                <span className="text-white text-sm font-bold truncate hover:underline cursor-pointer">{currentSong.title}</span>
                                <span className="text-xs text-gray-400 truncate mt-1 hover:text-white transition-colors">{currentSong.channelTitle}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 opacity-10">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                            <div className="space-y-2">
                                <div className="w-32 h-3 bg-gray-700 rounded"></div>
                                <div className="w-20 h-2 bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center max-w-[40%] w-full">
                    <div className="flex items-center gap-7 mb-2">
                        <button onClick={playPrev} className="text-gray-400 hover:text-white p-1 hover:scale-110 transition-all"><SkipBack size={22} fill="currentColor"/></button>
                        <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl active:scale-95">
                            {isPlaying ? <Pause size={24} fill="black"/> : <Play size={24} fill="black" className="ml-0.5"/>}
                        </button>
                        <button onClick={playNext} className="text-gray-400 hover:text-white p-1 hover:scale-110 transition-all"><SkipForward size={22} fill="currentColor"/></button>
                    </div>
                    <div className="flex items-center w-full gap-3 group">
                        <span className="text-[10px] font-mono text-gray-500 w-10 text-right">{formatTime(progress)}</span>
                        <div className="relative flex-1 h-1.5 flex items-center">
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                value={progress || 0} 
                                onChange={handleProgressChange} 
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-1.5 transition-all" 
                            />
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 w-10">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-end w-[30%] min-w-[160px] gap-3">
                    <button onClick={() => handleVolumeChange({target: {value: isMuted ? 80 : 0}})} className="text-gray-400 hover:text-white transition-colors">
                        {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}
                    </button>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolumeChange} 
                        className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-red-600 transition-all" 
                    />
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                
                @keyframes music-bar-1 { 0%, 100% { height: 4px; } 50% { height: 12px; } }
                @keyframes music-bar-2 { 0%, 100% { height: 12px; } 50% { height: 6px; } }
                @keyframes music-bar-3 { 0%, 100% { height: 8px; } 50% { height: 4px; } }
                .animate-music-bar-1 { animation: music-bar-1 0.8s infinite ease-in-out; }
                .animate-music-bar-2 { animation: music-bar-2 1.2s infinite ease-in-out; }
                .animate-music-bar-3 { animation: music-bar-3 1s infinite ease-in-out; }
            `}</style>
        </div>
    );
}
