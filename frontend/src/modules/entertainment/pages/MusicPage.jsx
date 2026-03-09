import React, { useState, useRef, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { 
    Play, Pause, Search, 
    SkipForward, SkipBack, Volume2, VolumeX, Heart,
    Shuffle, Repeat, Repeat1, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSearched, setLastSearched] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [playbackQueue, setPlaybackQueue] = useState([]); // Separate queue for playing songs
    const [searchPlaylists, setSearchPlaylists] = useState([]);
    const [viewingPlaylist, setViewingPlaylist] = useState(null);
    const [dashboardData, setDashboardData] = useState([]);
    const [dashboardSongs, setDashboardSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [duration, setDuration] = useState(0);
    
    // 0: Off, 1: Loop All, 2: Loop One
    const [repeatMode, setRepeatMode] = useState(0); 
    const [isShuffle, setIsShuffle] = useState(false);
    const [likedSongs, setLikedSongs] = useState([]);
    const [history, setHistory] = useState([{ type: 'dashboard' }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const audioRef = useRef(null);

    // Initial load
    useEffect(() => {
        loadDashboard(false);
        const savedLikes = JSON.parse(localStorage.getItem('mz_liked_songs') || '[]');
        setLikedSongs(savedLikes);

        const autoQuery = sessionStorage.getItem('auto_search_query');
        if (autoQuery) {
            setSearchQuery(autoQuery);
            handleSearch(autoQuery);
            sessionStorage.removeItem('auto_search_query');
        }
    }, []);

    const pushToHistory = (item) => {
        const newHistory = history.slice(0, historyIndex + 1);
        const last = newHistory[newHistory.length - 1];
        if (last && last.type === item.type && (
            (item.type === 'dashboard') || 
            (item.type === 'search' && last.query === item.query) ||
            (item.type === 'playlist' && last.playlist?.encodeId === item.playlist?.encodeId)
        )) {
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
            loadDashboard(false);
        } else if (item.type === 'search') {
            setSearchQuery(item.query);
            handleSearch(item.query, false);
        } else if (item.type === 'playlist') {
            loadPlaylist(item.playlist, false);
        }
    };

    const saveSearchHistory = (q) => {
        if(!q || q === 'top hits') return;
        let p = JSON.parse(localStorage.getItem('mz_search_history') || '[]');
        p = p.filter(i => i.toLowerCase() !== q.toLowerCase());
        p.unshift(q);
        if(p.length > 5) p.pop();
        localStorage.setItem('mz_search_history', JSON.stringify(p));
    }

    const saveArtistHistory = (artists) => {
        if(!artists) return;
        const mainArtist = artists.split(',')[0].trim();
        let p = JSON.parse(localStorage.getItem('mz_artist_history') || '[]');
        p = p.filter(i => i.toLowerCase() !== mainArtist.toLowerCase());
        p.unshift(mainArtist);
        if(p.length > 5) p.pop();
        localStorage.setItem('mz_artist_history', JSON.stringify(p));
    }

    const loadDashboard = async (push = true) => {
        setIsLoading(true);
        if (push) pushToHistory({ type: 'dashboard' });
        setLastSearched(''); // Dashboard mode
        setViewingPlaylist(null);
        setSearchResults([]);
        setSearchPlaylists([]);
        setDashboardSongs([]);
        
        let searches = JSON.parse(localStorage.getItem('mz_search_history') || '[]');
        let artists = JSON.parse(localStorage.getItem('mz_artist_history') || '[]');
        
        // Combine keeping latest at front
        let queries = [...artists, ...searches];
        if (queries.length === 0) {
            queries = ['top hits', 'nhạc trẻ', 'remix', 'sơn tùng'];
        } else {
            queries = Array.from(new Set([...queries, 'top hits'])).slice(0, 4);
        }

        const newDashboardData = [];
        for (const q of queries) {
            try {
                if (q === 'top hits') {
                    newDashboardData.push({
                        title: 'Top Hits Nổi Bật',
                        playlists: [{
                           encodeId: 'ZWZB969E',
                           title: 'Top 100 Nhạc Trẻ',
                           thumbnailM: 'https://photo-resize-zmp3.zmdcdn.me/w320_r1x1_jpeg/cover/4/5/4/9/45493e859cde71ce79db350b28972105.jpg',
                           artistsNames: 'Zing MP3'
                        }]
                    });
                } else {
                    const searchRes = await fetch(`/api/entertainment/music/search?q=${encodeURIComponent(q)}`);
                    const searchData = await searchRes.json();
                    if (searchData?.data?.playlists?.length > 0) {
                        newDashboardData.push({
                            title: `Đề xuất từ "${q}"`,
                            playlists: searchData.data.playlists.slice(0, 6)
                        });
                    }
                }
            } catch(e) {}
        }
        setDashboardData(newDashboardData);

        // Fetch top 100 songs
        try {
            const topRes = await fetch(`/api/entertainment/music/playlist?id=ZWZB969E`);
            const topData = await topRes.json();
            if (topData?.data?.song?.items) {
                setDashboardSongs(topData.data.song.items);
            }
        } catch(e) {}

        setIsLoading(false);
    };

    const handleSearch = async (query = searchQuery, push = true) => {
        if (!query.trim()) {
            loadDashboard();
            return;
        }
        setIsLoading(true);
        if (push) pushToHistory({ type: 'search', query: query });
        setViewingPlaylist(null);
        setLastSearched(query);
        saveSearchHistory(query);
        
        try {
            const searchRes = await fetch(`/api/entertainment/music/search?q=${encodeURIComponent(query)}`);
            const searchData = await searchRes.json();
            
            if (searchData?.data?.songs) {
                setSearchResults(searchData.data.songs);
            } else {
                setSearchResults([]);
            }

            if (searchData?.data?.playlists) {
                setSearchPlaylists(searchData.data.playlists);
            } else {
                setSearchPlaylists([]);
            }
        } catch (error) {
            console.error("Error searching songs:", error);
            setSearchResults([]);
            setSearchPlaylists([]);
        }
        setIsLoading(false);
    };

    const loadPlaylist = async (playlist, push = true) => {
        setIsLoading(true);
        if (push) pushToHistory({ type: 'playlist', playlist: playlist });
        setViewingPlaylist(playlist);
        try {
            const res = await fetch(`/api/entertainment/music/playlist?id=${playlist.encodeId}`);
            const data = await res.json();
            if (data?.data?.song?.items) {
                setSearchResults(data.data.song.items);
                if (data.data.song.items.length > 0) {
                    playSong(data.data.song.items[0], data.data.song.items);
                }
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Error loading playlist:", error);
            setSearchResults([]);
        }
        setIsLoading(false);
    };

    const playSong = async (song, newQueue = null) => {
        setIsPlaying(false);
        if (newQueue) {
            setPlaybackQueue(newQueue);
        } else if (playbackQueue.length === 0) {
            setPlaybackQueue(searchResults);
        }

        try {
            const songRes = await fetch(`/api/entertainment/music/song?id=${song.encodeId}`);
            const songData = await songRes.json();
            
            const audioUrl = songData?.data?.['128'];
            // ZingMp3 VIP response string usually says 'VIP' in '320' or the audioUrl fails to load
            if (audioUrl) {
                if (audioUrl === 'VIP') {
                    alert("Không thể tải bài hát này. Nhạc VIP.");
                } else {
                    saveArtistHistory(song.artistsNames);
                    setCurrentSong({ ...song, audioUrl });
                    setIsPlaying(true);
                }
            } else {
                alert("Không thể tải bài hát này.");
            }
        } catch (error) {
            console.error("Error fetching song stream:", error);
            // Fallback for UI testing
            setCurrentSong({ ...song, audioUrl: '' });
            alert("API đang gặp lỗi, không thể phát nhạc.");
        }
    };

    const togglePlay = () => {
        if (!currentSong) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleLike = (e, song) => {
        e.stopPropagation();
        let updated = [...likedSongs];
        if (updated.some(s => s.encodeId === song.encodeId)) {
            updated = updated.filter(s => s.encodeId !== song.encodeId);
        } else {
            updated.push(song);
        }
        setLikedSongs(updated);
        localStorage.setItem('mz_liked_songs', JSON.stringify(updated));
    };

    const playNext = () => {
        if (!currentSong || playbackQueue.length === 0) return;
        
        if (repeatMode === 2) {
            // Loop One
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            return;
        }

        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * playbackQueue.length);
            playSong(playbackQueue[randomIndex]);
            return;
        }

        const currentIndex = playbackQueue.findIndex(s => s.encodeId === currentSong.encodeId);
        if (currentIndex !== -1 && currentIndex < playbackQueue.length - 1) {
            playSong(playbackQueue[currentIndex + 1]);
        } else if (playbackQueue.length > 0 && repeatMode === 1) {
            // Loop All
            playSong(playbackQueue[0]);
        } else if (playbackQueue.length > 0 && repeatMode === 0) {
            // No loop, but play next until end. If at end, maybe stop playing. (or repeat all regardless as default behavior in simple players, but we have Repeat mode)
            // Let's stop playing at the end if repeat=0
            setIsPlaying(false);
        }
    };

    const playPrev = () => {
        if (!currentSong || playbackQueue.length === 0) return;

        if (progress > 3) {
            // If played more than 3 seconds, just restart song
            audioRef.current.currentTime = 0;
            return;
        }

        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * playbackQueue.length);
            playSong(playbackQueue[randomIndex]);
            return;
        }

        const currentIndex = playbackQueue.findIndex(s => s.encodeId === currentSong.encodeId);
        if (currentIndex > 0) {
            playSong(playbackQueue[currentIndex - 1]);
        } else if (playbackQueue.length > 0 && repeatMode === 1) {
            // Loop All -> go to last song
            playSong(playbackQueue[playbackQueue.length - 1]);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
        }
    };

    const handleProgressChange = (e) => {
        const newTime = e.target.value;
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value;
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "0:00";
        const m = Math.floor(timeInSeconds / 60);
        const s = Math.floor(timeInSeconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#121212] text-white overflow-hidden font-sans">
            {currentSong && currentSong.audioUrl && (
                <audio 
                    ref={audioRef}
                    src={currentSong.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onEnded={() => {
                        setIsPlaying(false);
                        playNext();
                    }}
                    autoPlay
                />
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col w-full overflow-y-auto bg-gradient-to-b from-[#1e3264] to-[#121212] p-6 custom-scrollbar">
                    
                    {/* Header / Search */}
                    <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md p-4 rounded-full border border-white/5">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Navigation History Buttons */}
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
                                    placeholder="Tìm kiếm bài hát, nghệ sĩ, playlist..."
                                    className="w-full bg-[#242424] text-white rounded-full py-3 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#8e44ad] transition-all hover:bg-[#2a2a2a] text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                            <button 
                                onClick={() => handleSearch()}
                                className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Tìm kiếm
                            </button>
                            <button 
                                onClick={() => {
                                    setViewingPlaylist({title: 'Thư viện Bài Hát Yêu Thích'});
                                    setSearchResults(likedSongs);
                                    setSearchPlaylists([]);
                                    setLastSearched('');
                                    pushToHistory({ type: 'dashboard' }); // Simplification
                                }}
                                className="px-5 py-2.5 bg-[#8e44ad] text-white text-sm font-bold flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                            >
                                <Heart className="w-4 h-4 fill-white" />
                                Thư viện
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">
                            {viewingPlaylist ? viewingPlaylist.title : (lastSearched ? `Kết quả tải cho "${lastSearched}"` : "Đề xuất cho bạn")}
                        </h2>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Dashboard View */}
                                {!viewingPlaylist && !lastSearched && dashboardData.length > 0 && dashboardData.map((section, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {section.playlists.map((pl) => (
                                                <div 
                                                    key={pl.encodeId} 
                                                    onClick={() => loadPlaylist(pl)} 
                                                    className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-colors group"
                                                >
                                                    <div className="relative mb-4 w-full aspect-square">
                                                        <img src={pl.thumbnailM || pl.thumbnail} alt={pl.title} className="w-full h-full object-cover rounded shadow-lg" />
                                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl">
                                                            <Play className="w-5 h-5 text-black ml-1" />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-white truncate">{pl.title}</h4>
                                                    <p className="text-sm text-gray-400 truncate mt-1">{pl.artistsNames || 'Zing MP3'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Dashboard Songs View */}
                                {!viewingPlaylist && !lastSearched && dashboardSongs.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-xl font-bold mb-4">Bảng Xếp Hạng Top 100 Trẻ</h3>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar bg-[#181818] p-4 rounded-xl">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 text-gray-400 border-b border-[#282828] text-sm font-semibold sticky top-0 bg-[#181818] z-10">
                                                <div className="hidden md:block text-center">#</div>
                                                <div>Tiêu đề</div>
                                                <div className="hidden md:block">Nghệ sĩ</div>
                                                <div className="text-right">Phát</div>
                                            </div>

                                            {/* Results List */}
                                            {dashboardSongs.map((song, idx) => (
                                                <div 
                                                    key={song.encodeId || idx}
                                                    onClick={() => playSong(song, dashboardSongs)}
                                                    className="group grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-md hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                                                >
                                                    <div className="hidden md:flex justify-center text-gray-400">
                                                        <span className="group-hover:hidden">{idx + 1}</span>
                                                        <Play className="w-4 h-4 text-white hidden group-hover:block" />
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={song.thumbnailM || song.thumbnail} 
                                                            alt={song.title} 
                                                            className="w-10 h-10 rounded shadow-md object-cover"
                                                            onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                                                        />
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className={`font-semibold text-base truncate ${currentSong?.encodeId === song.encodeId ? 'text-[#1db954]' : 'text-white'}`}>
                                                                {song.title}
                                                            </span>
                                                            <span className="text-sm text-gray-400 truncate md:hidden">
                                                                {song.artistsNames}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="hidden md:block text-gray-400 text-sm truncate">
                                                        {song.artistsNames}
                                                    </div>
                                                    
                                                    <button onClick={(e) => toggleLike(e, song)} className="flex justify-end pr-2 text-gray-400 hover:text-white transition-colors">
                                                        <Heart className={`w-5 h-5 transition-opacity ${likedSongs.some(s => s.encodeId === song.encodeId) ? 'fill-[#1db954] text-[#1db954] opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Playlists Grid (Search Results) */}
                                {!viewingPlaylist && lastSearched && searchPlaylists.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4">Danh sách (Playlists)</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {searchPlaylists.slice(0, 6).map((pl) => (
                                                <div 
                                                    key={pl.encodeId} 
                                                    onClick={() => loadPlaylist(pl)} 
                                                    className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-colors group"
                                                >
                                                    <div className="relative mb-4 w-full aspect-square">
                                                        <img src={pl.thumbnailM || pl.thumbnail} alt={pl.title} className="w-full h-full object-cover rounded shadow-lg" />
                                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl">
                                                            <Play className="w-5 h-5 text-black ml-1" />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-white truncate">{pl.title}</h4>
                                                    <p className="text-sm text-gray-400 truncate mt-1">{pl.artistsNames || 'Zing MP3'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Songs List */}
                                {(!viewingPlaylist && !lastSearched) ? null : (
                                    <div>
                                        {!viewingPlaylist && <h3 className="text-xl font-bold mb-4">Bài Hát</h3>}
                                        <div className="space-y-2">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-2 text-gray-400 border-b border-[#282828] text-sm font-semibold">
                                            <div className="hidden md:block text-center">#</div>
                                            <div>Tiêu đề</div>
                                            <div className="hidden md:block">Nghệ sĩ</div>
                                            <div className="text-right">Phát</div>
                                        </div>

                                        {/* Results List */}
                                        {searchResults.map((song, idx) => (
                                            <div 
                                                key={song.encodeId || idx}
                                                onClick={() => playSong(song, searchResults)}
                                                className="group grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-md hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                                            >
                                                <div className="hidden md:flex justify-center text-gray-400">
                                                    <span className="group-hover:hidden">{idx + 1}</span>
                                                    <Play className="w-4 h-4 text-white hidden group-hover:block" />
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={song.thumbnailM || song.thumbnail} 
                                                        alt={song.title} 
                                                        className="w-10 h-10 rounded shadow-md object-cover"
                                                        onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                                                    />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className={`font-semibold text-base truncate ${currentSong?.encodeId === song.encodeId ? 'text-[#1db954]' : 'text-white'}`}>
                                                            {song.title}
                                                        </span>
                                                        <span className="text-sm text-gray-400 truncate md:hidden">
                                                            {song.artistsNames}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="hidden md:block text-gray-400 text-sm truncate">
                                                    {song.artistsNames}
                                                </div>
                                                
                                                <button onClick={(e) => toggleLike(e, song)} className="flex justify-end pr-2 text-gray-400 hover:text-white transition-colors">
                                                    <Heart className={`w-5 h-5 transition-opacity ${likedSongs.some(s => s.encodeId === song.encodeId) ? 'fill-[#1db954] text-[#1db954] opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                                </button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && (
                                            <div className="text-center text-gray-400 mt-10">
                                                Không tìm thấy bài hát nào.
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spotify-like Player Bar */}
            <div className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center justify-between px-4 z-50">
                {/* Left: Song Info */}
                <div className="flex items-center w-[30%] min-w-[180px]">
                    {currentSong ? (
                        <>
                            <img 
                                src={currentSong.thumbnailM || currentSong.thumbnail} 
                                alt={currentSong.title} 
                                className="w-14 h-14 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)] object-cover"
                                onError={(e) => e.target.src = "https://via.placeholder.com/56"}
                            />
                            <div className="ml-4 flex flex-col overflow-hidden">
                                <span className="text-white text-sm font-semibold truncate hover:underline cursor-pointer">
                                    {currentSong.title}
                                </span>
                                <span className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                                    {currentSong.artistsNames}
                                </span>
                            </div>
                            <button onClick={(e) => toggleLike(e, currentSong)} className="ml-4 text-gray-400 hover:text-white transition-colors">
                                <Heart className={`w-5 h-5 ${likedSongs.some(s => s.encodeId === currentSong.encodeId) ? 'fill-[#1db954] text-[#1db954]' : ''}`} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-14 h-14 bg-[#282828] rounded-md shadow-inner"></div>
                            <div className="ml-4 flex flex-col py-1">
                                <div className="w-24 h-3 bg-[#282828] rounded mb-2"></div>
                                <div className="w-16 h-2 bg-[#282828] rounded"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Player Controls */}
                <div className="flex flex-col items-center justify-center max-w-[40%] w-full">
                    <div className="flex items-center gap-6 mb-2">
                        <button 
                            onClick={() => setIsShuffle(!isShuffle)} 
                            className={`transition-colors ${isShuffle ? 'text-[#1db954]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>
                        <button onClick={playPrev} className="text-gray-400 hover:text-white transition-colors">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </button>
                        <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors">
                            <SkipForward className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setRepeatMode((repeatMode + 1) % 3)} 
                            className={`transition-colors ${repeatMode > 0 ? 'text-[#1db954]' : 'text-gray-400 hover:text-white'}`}
                        >
                            {repeatMode === 2 ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                        </button>
                    </div>
                    
                    <div className="flex items-center w-full gap-2">
                        <span className="text-xs text-gray-400 min-w-[35px] text-right">
                            {formatTime(progress)}
                        </span>
                        <input 
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={progress}
                            onChange={handleProgressChange}
                            className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer hover:bg-[#1db954] accent-white"
                        />
                        <span className="text-xs text-gray-400 min-w-[35px]">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right: Extra Controls */}
                <div className="flex items-center justify-end w-[30%] min-w-[180px] gap-2 pr-2">
                    <button className="text-gray-400 hover:text-white" onClick={() => handleVolumeChange({target: {value: volume === 0 ? 1 : 0}})}>
                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer hover:bg-[#1db954] accent-white"
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
                    background-color: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.5);
                }
                input[type=range] {
                    -webkit-appearance: none;
                    background: transparent;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    margin-top: -4px;
                    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.5);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                div:hover > input[type=range]::-webkit-slider-thumb {
                    opacity: 1;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    background: #535353;
                    border-radius: 2px;
                }
                input[type=range]:hover::-webkit-slider-runnable-track {
                    background: #1db954;
                }
            `}</style>
        </div>
    );
}
