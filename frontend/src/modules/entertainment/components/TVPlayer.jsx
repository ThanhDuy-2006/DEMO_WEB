
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize, Play, Pause } from 'lucide-react';

const TVPlayer = ({ url, poster, name, autoPlay = true, onError, className = "" }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [hlsInstance, setHlsInstance] = useState(null);
    
    // Quality State
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
    const [showQualityMenu, setShowQualityMenu] = useState(false);

    // Initialize HLS
    useEffect(() => {
        if (!url) return;

        if (hlsInstance) {
            hlsInstance.destroy();
            setHlsInstance(null);
        }

        let hls = null;
        const video = videoRef.current;
        setIsPlaying(true);
        setQualities([]); // Reset qualities

        const handleError = (_, data) => {
            if (data.fatal) {
                switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                default:
                    hls.destroy();
                    if (onError) onError();
                    break;
                }
            }
        };

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 10,
                maxBufferLength: 15,
                maxMaxBufferLength: 30,
                liveSyncDuration: 3, 
                liveMaxLatencyDuration: 5,
                startLevel: -1, // Auto start
                capLevelToPlayerSize: true // Adaptive
            });
            
            hls.loadSource(url);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.ERROR, handleError);
            
            // Detect Levels
            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                const levels = data.levels.map((level, index) => ({
                    id: index,
                    height: level.height,
                    bitrate: level.bitrate,
                    label: level.height ? `${level.height}p` : `Level ${index}`
                }));
                // Sort by resolution high to low
                setQualities(levels.reverse());
                
                if (autoPlay) {
                     const playPromise = video.play();
                     if (playPromise !== undefined) {
                         playPromise.catch(() => {
                             setIsMuted(true);
                             video.muted = true;
                             video.play();
                         });
                     }
                }
            });

            setHlsInstance(hls);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => { if (autoPlay) video.play(); });
            video.addEventListener('error', onError);
        }

        return () => { if (hls) hls.destroy(); };
    }, [url]);

    // Handle Play/Pause
    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const [isLoading, setIsLoading] = useState(true);

    // ... (keep HLS setup)

    // Events
    useEffect(() => {
        const video = videoRef.current;
        const onPlay = () => { setIsPlaying(true); setIsLoading(false); };
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true);
        const onPlaying = () => setIsLoading(false);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        
        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
        };
    }, []);

    // Helper functions
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current.requestFullscreen();
        else document.exitFullscreen();
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        videoRef.current.volume = val;
        setIsMuted(val === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            videoRef.current.volume = volume || 1;
            setIsMuted(false);
        } else {
            videoRef.current.volume = 0;
            setIsMuted(true);
        }
    };

    const changeQuality = (levelId) => {
        if (hlsInstance) {
            hlsInstance.currentLevel = levelId;
            setCurrentQuality(levelId);
            setShowQualityMenu(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative group bg-black overflow-hidden shadow-2xl border border-white/10 ${className}`}>
            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                playsInline
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}


            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6 z-20">
                
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div>{name && <h2 className="text-white font-bold text-lg drop-shadow-md">{name}</h2>}</div>
                    <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
                    </div>
                </div>

                {/* Bottom Bar Controls */}
                <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="text-white hover:text-primary transition p-2 hover:bg-white/10 rounded-full">
                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 group/vol">
                        <button onClick={toggleMute} className="text-white p-2 hover:bg-white/10 rounded-full">
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                            className="w-0 group-hover/vol:w-24 transition-all duration-300 accent-primary h-1.5 cursor-pointer rounded-lg opacity-0 group-hover/vol:opacity-100"
                        />
                    </div>

                    <div className="flex-1"></div>

                    {/* Quality Selector */}
                    {qualities.length > 0 && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowQualityMenu(!showQualityMenu)}
                                className="text-white font-bold text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md transition"
                            >
                                {currentQuality === -1 ? 'Auto' : qualities.find(q => q.id === currentQuality)?.label || 'Auto'}
                            </button>
                            
                            {showQualityMenu && (
                                <div className="absolute bottom-full right-0 mb-2 w-32 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 flex flex-col p-1">
                                    <button 
                                        onClick={() => changeQuality(-1)}
                                        className={`px-3 py-2 text-left text-xs font-medium rounded-lg transition ${currentQuality === -1 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                                    >
                                        Auto (Recommend)
                                    </button>
                                    {qualities.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => changeQuality(q.id)}
                                            className={`px-3 py-2 text-left text-xs font-medium rounded-lg transition ${currentQuality === q.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={toggleFullscreen} className="text-white hover:text-primary transition p-2 hover:bg-white/10 rounded-full">
                        <Maximize size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TVPlayer;
