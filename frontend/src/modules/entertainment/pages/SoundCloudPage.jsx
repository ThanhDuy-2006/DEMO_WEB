import React, { useState, useRef, useEffect } from 'react';
import { 
    Play, Pause, Search, 
    SkipForward, SkipBack, Volume2, VolumeX, Heart,
    Shuffle, Repeat, Repeat1, Music, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function SoundCloudPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSearched, setLastSearched] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [playbackQueue, setPlaybackQueue] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [duration, setDuration] = useState(0);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: Loop All, 2: Loop One
    const [likedSongs, setLikedSongs] = useState([]);
    const [searchError, setSearchError] = useState(null);
    const [dashboardData, setDashboardData] = useState([]);
    const [history, setHistory] = useState([{ type: 'dashboard' }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const widgetRef = useRef(null);
    const widgetObj = useRef(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        // Load SoundCloud Widget API
        const script = document.createElement('script');
        script.src = "https://w.soundcloud.com/player/api.js";
        script.async = true;
        script.onload = () => {
            if (window.SC && iframeRef.current) {
                widgetObj.current = window.SC.Widget(iframeRef.current);
                setupWidgetEvents();
            }
        };
        document.body.appendChild(script);

        const savedLikes = JSON.parse(localStorage.getItem('sc_liked_songs') || '[]');
        setLikedSongs(savedLikes);

        loadDashboard();

        const autoQuery = sessionStorage.getItem('auto_search_query');
        if (autoQuery) {
            setSearchQuery(autoQuery);
            performSearch(autoQuery);
            sessionStorage.removeItem('auto_search_query');
        }

        return () => {
            if (script && script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        const categories = [
            { title: "Xu hướng hiện nay", query: "Trending" },
            { title: "V-Pop Nổi Bật", query: "Sơn Tùng M-TP" },
            { title: "Lofi & Chill", query: "Lofi Chill" },
            { title: "EDM Remix", query: "Vinahouse" }
        ];

        try {
            const sections = await Promise.all(categories.map(async (cat) => {
                const res = await fetch(`/api/entertainment/music/soundcloud/search?q=${encodeURIComponent(cat.query)}`);
                const data = await res.json();
                return {
                    title: cat.title,
                    tracks: (data.collection || []).slice(0, 6)
                };
            }));
            setDashboardData(sections.filter(s => s.tracks.length > 0));
        } catch (error) {
            console.error("Dashboard Load Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupWidgetEvents = () => {
        const widget = widgetObj.current;
        if (!widget) return;

        widget.bind(window.SC.Widget.Events.READY, () => {
            console.log("SoundCloud Widget Ready");
            widget.setVolume(volume * 100);
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
            setIsPlaying(true);
            widget.getDuration((d) => setDuration(d / 1000));
        });

        widget.bind(window.SC.Widget.Events.PAUSE, () => {
            setIsPlaying(false);
        });

        widget.bind(window.SC.Widget.Events.FINISH, () => {
            setIsPlaying(false);
            playNext();
        });

        widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
            setProgress(data.currentPosition / 1000);
            if (data.relativePosition > 0) {
                setDuration((data.currentPosition / 1000) / data.relativePosition);
            }
        });
    };

    const pushToHistory = (item) => {
        const newHistory = history.slice(0, historyIndex + 1);
        // Only push if different from last
        const last = newHistory[newHistory.length - 1];
        if (last && last.type === item.type && (item.type === 'dashboard' || last.query === item.query)) {
            return;
        }
        newHistory.push(item);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const goBack = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            applyHistoryItem(prev);
        }
    };

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            applyHistoryItem(next);
        }
    };

    const applyHistoryItem = (item) => {
        if (item.type === 'dashboard') {
            setLastSearched('');
            setSearchQuery('');
            setSearchResults([]);
        } else if (item.type === 'search') {
            setSearchQuery(item.query);
            performSearch(item.query, false);
        }
    };

    const performSearch = async (query, push = true) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setSearchError(null);
        setLastSearched(query);
        
        if (push) pushToHistory({ type: 'search', query: query });

        try {
            const res = await fetch(`/api/entertainment/music/soundcloud/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.error) {
                setSearchError(data.error + (data.details ? ": " + data.details : ""));
                setSearchResults([]);
                return;
            }

            const tracks = data.collection || (Array.isArray(data) ? data : []);
            setSearchResults(tracks);
            if (tracks.length === 0) {
                setSearchError("Không tìm thấy kết quả nào cho: " + query);
            }
        } catch (error) {
            console.error("SoundCloud Search Error", error);
            setSearchError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => performSearch(searchQuery);

    const playSong = (song, queue = []) => {
        if (!widgetObj.current) return;
        setCurrentSong(song);
        if (queue.length > 0) setPlaybackQueue(queue);
        setIsPlaying(true); // Optimistic state
        
        widgetObj.current.load(song.permalink_url, {
            auto_play: true,
            show_artwork: false,
            show_comments: false,
            show_playcount: false,
            show_user: false,
            buying: false,
            sharing: false,
            download: false,
            visual: false
        });
    };

    const togglePlay = () => {
        if (!widgetObj.current) return;
        widgetObj.current.toggle();
    };

    const playNext = () => {
        if (playbackQueue.length === 0) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong?.id);
        let nextIndex = currentIndex + 1;
        
        if (isShuffle) {
            nextIndex = Math.floor(Math.random() * playbackQueue.length);
        } else if (nextIndex >= playbackQueue.length) {
            if (repeatMode === 1) nextIndex = 0;
            else return;
        }
        
        playSong(playbackQueue[nextIndex]);
    };

    const playPrev = () => {
        if (playbackQueue.length === 0) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong?.id);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            if (repeatMode === 1) prevIndex = playbackQueue.length - 1;
            else return;
        }
        playSong(playbackQueue[prevIndex]);
    };

    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        if (widgetObj.current) {
            widgetObj.current.seekTo(newTime * 1000);
            setProgress(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        if (widgetObj.current) {
            widgetObj.current.setVolume(newVolume * 100);
            setVolume(newVolume);
        }
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
        localStorage.setItem('sc_liked_songs', JSON.stringify(newLikes));
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "0:00";
        const m = Math.floor(timeInSeconds / 60);
        const s = Math.floor(timeInSeconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#121212] text-white overflow-hidden font-sans">
            {/* SoundCloud Widget (Moved off-screen) */}
            <div style={{ position: 'absolute', top: '-1000px', left: '-1000px', width: '300px', height: '166px', overflow: 'hidden', opacity: 0 }}>
                <iframe 
                    ref={iframeRef}
                    src="https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/293&show_artwork=false&visual=false" 
                    width="100%" height="166"
                    frameBorder="no" scrolling="no" allow="autoplay"
                />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col w-full overflow-y-auto bg-gradient-to-b from-[#ff5500] to-[#121212] p-6 custom-scrollbar">
                    
                    {/* Header / Search */}
                    <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md p-4 rounded-full border border-white/5">
                        <div className="flex items-center gap-4 flex-1">
                            {/* History Navigation */}
                            <div className="flex items-center gap-2 mr-2">
                                <button 
                                    onClick={goBack}
                                    disabled={historyIndex === 0}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/40 transition-colors ${historyIndex === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={goForward}
                                    disabled={historyIndex === history.length - 1}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/40 transition-colors ${historyIndex === history.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="relative w-full max-w-md">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                                    className="w-full bg-[#242424] text-white rounded-full py-3 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#ff5500] transition-all hover:bg-[#2a2a2a] text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                            <button 
                                id="sc-search-btn"
                                onClick={handleSearch}
                                className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Tìm kiếm
                            </button>
                            <button 
                                onClick={() => {
                                    setSearchResults(likedSongs);
                                    setLastSearched('Yêu thích của tôi');
                                    pushToHistory({ type: 'search', query: 'Yêu thích của tôi' });
                                }}
                                className="px-5 py-2.5 bg-[#ff5500] text-white text-sm font-bold flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                            >
                                <Heart className="w-4 h-4 fill-white" />
                                Thư viện
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="pb-10">
                        <h2 className="text-2xl font-bold mb-6">
                            {lastSearched ? `Kết quả cho "${lastSearched}"` : "Khám phá SoundCloud"}
                        </h2>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="w-10 h-10 border-4 border-[#ff5500] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : searchError ? (
                            <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl text-red-200 flex items-center gap-4">
                                <span className="text-3xl">⚠️</span>
                                <div>
                                    <h4 className="font-bold">Lỗi Tìm Kiếm</h4>
                                    <p className="text-sm opacity-90">{searchError}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Dashboard View (Sections) */}
                                {!lastSearched && dashboardData.map((section, sidx) => (
                                    <div key={sidx}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-white border-l-4 border-[#ff5500] pl-3">
                                                {section.title}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {section.tracks.map((song) => (
                                                <div 
                                                    key={song.id} 
                                                    onClick={() => playSong(song, section.tracks)} 
                                                    className="bg-[#181818] p-4 rounded-xl cursor-pointer hover:bg-[#282828] transition-all group relative border border-white/5"
                                                >
                                                    <div className="relative mb-3 w-full aspect-square overflow-hidden rounded-lg">
                                                        <img 
                                                            src={(song.artwork_url || song.user?.avatar_url || "https://via.placeholder.com/300").replace('-large', '-t500x500')} 
                                                            alt={song.title} 
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="w-12 h-12 bg-[#ff5500] rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl">
                                                                <Play className="w-6 h-6 text-white ml-1 fill-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-white text-sm truncate">{song.title}</h4>
                                                    <p className="text-xs text-gray-400 truncate mt-1">{song.user?.username || 'SoundCloud'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Search Results View */}
                                {lastSearched && (
                                    <div className="space-y-2 bg-[#181818]/60 backdrop-blur-sm p-6 rounded-2xl border border-white/5">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 text-gray-400 border-b border-[#282828] text-xs font-bold uppercase tracking-wider">
                                            <div className="hidden md:block text-center">#</div>
                                            <div>Tiêu đề</div>
                                            <div className="hidden md:block">Nghệ sĩ</div>
                                            <div className="text-right">Thời lượng</div>
                                        </div>

                                        {searchResults.map((song, idx) => (
                                            <div 
                                                key={song.id}
                                                onClick={() => playSong(song, searchResults)}
                                                className="group grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-xl hover:bg-white/5 cursor-pointer transition-all"
                                            >
                                                <div className="hidden md:flex justify-center text-gray-400 font-medium">
                                                    <span className="group-hover:hidden">{idx + 1}</span>
                                                    <Play className="w-4 h-4 text-white hidden group-hover:block fill-white" />
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={song.artwork_url || (song.user && song.user.avatar_url) || "https://via.placeholder.com/40"} 
                                                        alt={song.title} 
                                                        className="w-10 h-10 rounded-lg shadow-md object-cover"
                                                    />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className={`font-bold text-sm truncate ${currentSong?.id === song.id ? 'text-[#ff5500]' : 'text-white'}`}>
                                                            {song.title}
                                                        </span>
                                                        <span className="text-xs text-gray-400 truncate md:hidden">
                                                            {song.user?.username || 'SoundCloud'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="hidden md:block text-gray-400 text-sm truncate font-medium">
                                                    {song.user?.username || 'SoundCloud'}
                                                </div>
                                                
                                                <div className="flex items-center justify-end gap-3 text-gray-500 group-hover:text-white transition-colors">
                                                    <span className="text-xs font-mono">{formatTime(song.duration / 1000)}</span>
                                                    <button onClick={(e) => toggleLike(e, song)} className="hover:scale-110 transition-transform">
                                                        <Heart className={`w-5 h-5 ${likedSongs.some(s => s.id === song.id) ? 'fill-[#ff5500] text-[#ff5500]' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {searchResults.length === 0 && !isLoading && (
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                                <Music className="w-16 h-16 mb-4 opacity-10" />
                                                <p>Không tìm thấy kết quả nào cho "{lastSearched}"</p>
                                                <button 
                                                    onClick={() => {
                                                        setLastSearched(''); 
                                                        setSearchQuery('');
                                                        pushToHistory({ type: 'dashboard' });
                                                    }}
                                                    className="mt-4 text-[#ff5500] hover:underline"
                                                >
                                                    Quay lại khám phá
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SoundCloud-themed Player Bar */}
            <div className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center justify-between px-4 z-50">
                {/* Left: Song Info */}
                <div className="flex items-center w-[30%] min-w-[180px]">
                    {currentSong ? (
                        <>
                            <img 
                                src={currentSong.artwork_url || (currentSong.user && currentSong.user.avatar_url) || "https://via.placeholder.com/56"} 
                                alt={currentSong.title} 
                                className="w-14 h-14 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)] object-cover"
                            />
                            <div className="ml-4 flex flex-col overflow-hidden">
                                <span className="text-white text-sm font-semibold truncate hover:underline cursor-pointer">
                                    {currentSong.title}
                                </span>
                                <span className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                                    {currentSong.user?.username || 'SoundCloud'}
                                </span>
                            </div>
                            <button onClick={(e) => toggleLike(e, currentSong)} className="ml-4 text-gray-400 hover:text-white transition-colors">
                                <Heart className={`w-5 h-5 ${likedSongs.some(s => s.id === currentSong.id) ? 'fill-[#ff5500] text-[#ff5500]' : ''}`} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-14 h-14 bg-[#282828] rounded-md"></div>
                            <div className="ml-4 space-y-2">
                                <div className="w-24 h-3 bg-[#282828] rounded"></div>
                                <div className="w-16 h-2 bg-[#282828] rounded"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Controls */}
                <div className="flex flex-col items-center justify-center max-w-[40%] w-full">
                    <div className="flex items-center gap-6 mb-2">
                        <button 
                            onClick={() => setIsShuffle(!isShuffle)} 
                            className={`transition-colors ${isShuffle ? 'text-[#ff5500]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>
                        <button onClick={playPrev} className="text-gray-400 hover:text-white">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shadow-lg"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </button>
                        <button onClick={playNext} className="text-gray-400 hover:text-white">
                            <SkipForward className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setRepeatMode((repeatMode + 1) % 3)} 
                            className={`transition-colors ${repeatMode > 0 ? 'text-[#ff5500]' : 'text-gray-400 hover:text-white'}`}
                        >
                            {repeatMode === 2 ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                        </button>
                    </div>
                    
                    <div className="flex items-center w-full gap-2 px-2">
                        <span className="text-xs text-gray-400 w-10 text-right">{formatTime(progress)}</span>
                        <input 
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={progress}
                            onChange={handleProgressChange}
                            className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#ff5500]"
                        />
                        <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Volume */}
                <div className="flex items-center justify-end w-[30%] min-w-[180px] gap-2">
                    <button className="text-gray-400 hover:text-white" onClick={() => handleVolumeChange({target:{value: volume === 0 ? 0.8 : 0}})}>
                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
                input[type=range] {
                    -webkit-appearance: none;
                    background: transparent;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    background: #535353;
                    border-radius: 2px;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: #ffffff;
                    margin-top: -4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
            `}</style>
        </div>
    );
}
