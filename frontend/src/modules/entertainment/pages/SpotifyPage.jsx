import React, { useState, useEffect } from 'react';
import { Play, Search, Heart, ChevronLeft, ChevronRight, Youtube, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SpotifyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSearched, setLastSearched] = useState('');
    const [searchResults, setSearchResults] = useState({ tracks: [], playlists: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([{ type: 'dashboard' }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    
    const navigate = useNavigate();
    
    // Bottom player embed
    const [currentEmbed, setCurrentEmbed] = useState("playlist/37i9dQZF1DXcBWIGoYBM5M");
    // "37i9dQZF1DXcBWIGoYBM5M" is Today's Top Hits

    const dashboardPlaylists = [
        { id: "14IbmNG2WOcGrHGJgNehso", name: "My top tracks playlist", creator: "User", type: "playlist", image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300&h=300&fit=crop" },
        { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Today's Top Hits", creator: "Spotify", type: "playlist", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
        { id: "37i9dQZF1DX0F4i7Q9pshJ", name: "V-Pop Không Thể Thiếu", creator: "Spotify", type: "playlist", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
        { id: "37i9dQZF1DX4g8Gs5nUhpp", name: "Rap Việt", creator: "Spotify", type: "playlist", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?w=300&h=300&fit=crop" },
        { id: "37i9dQZF1DWVA1Gq4XHa6U", name: "Gold School", creator: "Spotify", type: "playlist", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop" },
        { id: "37i9dQZF1DWTx0xpoL1O3T", name: "Thiên Hạ Nghe Gì", creator: "Spotify", type: "playlist", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" }
    ];

    const pushToHistory = (item) => {
        const newHistory = history.slice(0, historyIndex + 1);
        const last = newHistory[newHistory.length - 1];
        if (last && last.type === item.type && (
            (item.type === 'dashboard') || 
            (item.type === 'search' && last.query === item.query)
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
            setIsSearching(false);
            setLastSearched('');
            setSearchQuery('');
        } else if (item.type === 'search') {
            setSearchQuery(item.query);
            handleSearch(item.query, false);
        }
    };

    const handleSearch = async (query = searchQuery, push = true) => {
        const q = (query || '').trim();
        if (!q) {
            setIsSearching(false);
            setLastSearched('');
            return;
        }
        setIsLoading(true);
        setIsSearching(true);
        setLastSearched(q);
        if (push) pushToHistory({ type: 'search', query: q });
        try {
            const res = await fetch(`/api/entertainment/music/spotify/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            
            if (!res.ok || data.error) {
                console.error(`Spotify Search API error: ${data.error || 'Unknown error'}`);
                // Mock data fallback if token expired
                setSearchResults({
                    tracks: [
                        {id: "3J3nv18iIrOhca1ZWNeuyW", name: "Đã Lỡ Yêu Em Nhiều", duration_ms: 261000, artists: [{name: "JustaTee"}], album: {images: [{url: "https://i.scdn.co/image/ab67616d0000b273b5bd026859b128c688849b29"}]}},
                        {id: "3dvkpe9FEekxxgaQtxOHQI", name: "Mặt Mộc", duration_ms: 214000, artists: [{name: "Phạm Nguyên Ngọc"}], album: {images: [{url: "https://i.scdn.co/image/ab67616d0000b273d4de3f95e86d2671eff8cf2a"}]}}
                    ],
                    playlists: []
                });
            } else {
                setSearchResults({
                    tracks: data.tracks?.items || [],
                    playlists: data.playlists?.items || []
                });
            }
        } catch (error) {
            console.error("Search error", error);
        }
        setIsLoading(false);
    };

    const playMedia = (type, id) => {
        setCurrentEmbed(`${type}/${id}`);
    };

    const navigateToService = (service, query) => {
        // We can't easily pass state through navigate for these specific search implementations 
        // without refactoring them to use URL params (which would be better but bigger change).
        // For now, let's just navigate and the user can paste or we improve those pages later.
        // Actually, let's store it in session storage so the target page can pick it up.
        sessionStorage.setItem('auto_search_query', query);
        navigate(`/entertainment/${service}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#121212] text-white overflow-hidden font-sans">
            
            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col w-full overflow-y-auto bg-gradient-to-b from-[#1b4332] to-[#121212] p-6 custom-scrollbar">
                    
                    {/* Header / Search */}
                    <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md p-4 rounded-full border border-white/5">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Navigation History */}
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
                                    placeholder="Bạn muốn nghe gì trên Spotify?"
                                    className="w-full bg-[#242424] text-white rounded-full py-3 pr-4 pl-12 focus:outline-none focus:ring-2 focus:ring-white transition-all hover:bg-[#2a2a2a] text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                            <button 
                                onClick={() => handleSearch()}
                                className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Tìm kiếm
                            </button>
                            <button 
                                onClick={() => {
                                    setIsSearching(false);
                                    setLastSearched('');
                                    setSearchQuery('');
                                    pushToHistory({ type: 'dashboard' });
                                }}
                                className="px-5 py-2.5 bg-[#1db954] text-black text-sm font-bold flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                            >
                                <Heart className="w-4 h-4 fill-black" />
                                Thư viện (Top Hits)
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            {lastSearched ? `Kết quả cho "${lastSearched}"` : "Đề xuất phổ biến trên Spotify"}
                        </h2>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Dashboard View */}
                                {!isSearching && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4">Top Playlists</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {dashboardPlaylists.map((pl) => (
                                                <div 
                                                    key={pl.id} 
                                                    onClick={() => playMedia(pl.type, pl.id)} 
                                                    className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-colors group"
                                                >
                                                    <div className="relative mb-4 w-full aspect-square">
                                                        <img src={pl.image} alt={pl.name} onError={(e) => e.target.src = "https://via.placeholder.com/300/282828/ffffff?text=Spotify"} className="w-full h-full object-cover rounded shadow-lg" />
                                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl">
                                                            <Play className="w-5 h-5 text-black ml-1" />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-white truncate">{pl.name}</h4>
                                                    <p className="text-sm text-gray-400 truncate mt-1">{pl.creator}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Playlists Grid (Search Results) */}
                                {isSearching && searchResults.playlists.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4">Danh sách phát</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {searchResults.playlists.map((pl) => (
                                                <div 
                                                    key={pl.id} 
                                                    onClick={() => playMedia('playlist', pl.id)} 
                                                    className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-colors group"
                                                >
                                                    <div className="relative mb-4 w-full aspect-square">
                                                        <img src={pl.images?.[0]?.url || "https://via.placeholder.com/150"} alt={pl.name} className="w-full h-full object-cover rounded shadow-lg" />
                                                        <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-xl">
                                                            <Play className="w-5 h-5 text-black ml-1" />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-white truncate">{pl.name}</h4>
                                                    <p className="text-sm text-gray-400 truncate mt-1">{pl.owner?.display_name || 'Spotify'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Songs List */}
                                {isSearching && searchResults.tracks.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4">Bài Hát</h3>
                                        <div className="space-y-2">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-2 text-gray-400 border-b border-[#282828] text-sm font-semibold">
                                                <div className="hidden md:block text-center">#</div>
                                                <div>Tiêu đề</div>
                                                <div className="hidden md:block">Nghệ sĩ</div>
                                                <div className="text-right">Thời lượng</div>
                                            </div>

                                            {/* Results List */}
                                            {searchResults.tracks.map((song, idx) => (
                                                <div 
                                                    key={song.id}
                                                    onClick={() => playMedia('track', song.id)}
                                                    className="group grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[50px_2fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-md hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                                                >
                                                    <div className="hidden md:flex justify-center text-gray-400">
                                                        <span className="group-hover:hidden">{idx + 1}</span>
                                                        <Play className="w-4 h-4 text-white hidden group-hover:block" />
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={song?.album?.images?.[0]?.url || "https://via.placeholder.com/40"} 
                                                            alt={song?.name || "Unknown Track"} 
                                                            className="w-10 h-10 rounded shadow-md object-cover"
                                                        />
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="font-semibold text-base truncate text-white group-hover:underline">
                                                                {song?.name || "Unknown Track"}
                                                            </span>
                                                            <span className="text-sm text-gray-400 truncate md:hidden">
                                                                {song.artists?.map(a => a.name).join(', ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="hidden md:block text-gray-400 text-sm truncate">
                                                        {song.artists?.map(a => a.name).join(', ')}
                                                    </div>
                                                    
                                                     <div className="flex justify-end items-center gap-3 pr-2">
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-4">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); navigateToService('soundcloud', `${song.name} ${song.artists?.[0]?.name}`); }}
                                                                className="p-2 bg-[#ff5500] rounded-full hover:scale-110 transition-all shadow-lg"
                                                                title="Phát đầy đủ trên SoundCloud"
                                                            >
                                                                <Music className="w-4 h-4 text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="text-gray-400 text-sm font-mono w-12 text-right">
                                                            {Math.floor(song.duration_ms / 60000)}:{(Math.floor((song.duration_ms % 60000) / 1000) < 10 ? '0' : '') + Math.floor((song.duration_ms % 60000) / 1000)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {isSearching && searchResults.tracks.length === 0 && searchResults.playlists.length === 0 && (
                                    <div className="text-center text-gray-400 mt-10">
                                        Không tìm thấy nội dung nào.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spotify Embed Player Bar at the bottom (Height ~ 90px to match Spotify embedded widget default bottom mode) */}
            <div className="w-full h-[90px] bg-black border-t border-[#282828] z-50 overflow-hidden relative group">
                {/* Embed cover unclickable overlay so user must use the iframe controls */}
                <iframe
                    title="Spotify Embed Bottom Bar"
                    src={`https://open.spotify.com/embed/${currentEmbed}?utm_source=generator&theme=0`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="absolute top-0 left-0 right-0 bottom-0"
                    style={{ borderRadius: '0' }}
                />
            </div>
        </div>
    );
}
