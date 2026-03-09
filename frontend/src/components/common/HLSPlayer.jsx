import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Settings, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const HLSPlayer = forwardRef(({ src, poster, autoPlay = false, className = "", onError }, ref) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [hlsInstance, setHlsInstance] = useState(null);
    const [levels, setLevels] = useState([]);
    const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const controlsTimeoutRef = useRef(null);

    useImperativeHandle(ref, () => ({
        play: () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        seekTo: (time) => { if (videoRef.current) videoRef.current.currentTime = time; }
    }));

    useEffect(() => {
        let hls;

        const initPlayer = () => {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                
                hls.loadSource(src);
                hls.attachMedia(videoRef.current);

                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    // Extract levels (resolutions)
                    const availableLevels = data.levels.map((l, index) => ({
                        id: index,
                        height: l.height,
                        bitrate: l.bitrate,
                        name: l.name || `${l.height}p`
                    }));
                    setLevels(availableLevels);
                    if (autoPlay) videoRef.current?.play().catch(() => {});
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    // Update UI to reflect current level if needed (though we use state for user selection)
                });
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                     if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error("HLS Network error", data);
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error("HLS Media error", data);
                                hls.recoverMediaError();
                                break;
                            default:
                                console.error("HLS Fatal error", data);
                                hls.destroy();
                                if (onError) onError(data);
                                break;
                        }
                    }
                });

                setHlsInstance(hls);
            } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                videoRef.current.src = src;
                videoRef.current.addEventListener('loadedmetadata', () => {
                    if (autoPlay) videoRef.current?.play().catch(() => {});
                });
            }
        };

        if (src) {
            initPlayer();
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [src, autoPlay]);

    const handleLevelChange = (levelIndex) => {
        if (hlsInstance) {
            hlsInstance.currentLevel = levelIndex;
            setCurrentLevel(levelIndex);
            setShowQualityMenu(false);
        }
    };

    // --- Custom Controls Logic ---
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };
    
    // Handle inactivity to hide controls
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onLoadedMetadata = () => setDuration(video.duration);
        const onEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('ended', onEnded);
        };
    }, []);

    const handleSeek = (e) => {
        const seekTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    return (
        <div 
            ref={containerRef}
            className={`relative group bg-black overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster={poster}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* Custom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div className="mb-4 relative group/progress h-2 w-full cursor-pointer flex items-center">
                   <div className="absolute inset-0 bg-white/20 rounded-full h-1 group-hover/progress:h-2 transition-all"></div>
                   <div 
                        className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-full h-1 group-hover/progress:h-2 transition-all z-10 pointer-events-none"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                   ></div>
                   <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   />
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-colors">
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>

                    <div className="text-white text-xs font-bold font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    <div className="flex items-center gap-2 group/volume relative">
                        <button onClick={toggleMute} className="text-white hover:text-blue-500 transition-colors">
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.1" 
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                    
                    <div className="flex-1"></div>

                    {/* Quality Selector */}
                    {levels.length > 0 && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowQualityMenu(!showQualityMenu)}
                                className="flex items-center gap-1 text-white text-xs font-bold bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                            >
                                <Settings size={14} />
                                <span>{currentLevel === -1 ? 'Auto' : levels[currentLevel]?.name}</span>
                            </button>
                            
                            {showQualityMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden min-w-[100px] border border-white/10 shadow-xl z-50">
                                    <button 
                                        onClick={() => handleLevelChange(-1)}
                                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors ${currentLevel === -1 ? 'text-blue-500' : 'text-white'}`}
                                    >
                                        Auto
                                    </button>
                                    {levels.map((level) => (
                                        <button 
                                            key={level.id}
                                            onClick={() => handleLevelChange(level.id)}
                                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors ${currentLevel === level.id ? 'text-blue-500' : 'text-white'}`}
                                        >
                                            {level.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={toggleFullscreen} className="text-white hover:text-blue-500 transition-colors">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
});

HLSPlayer.displayName = 'HLSPlayer';
export default HLSPlayer;
