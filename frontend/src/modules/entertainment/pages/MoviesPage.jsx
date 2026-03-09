
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Link, useNavigate, NavLink, useSearchParams, useLocation } from 'react-router-dom';
import { Play, Plus, Info, ChevronLeft, ChevronRight, Search, Bell, Monitor, Film, Globe, Star, TrendingUp, Loader2, X, Filter, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ophimService } from '../services/ophimApi';
import { useToast } from '../../../context/ToastContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';

// --- COMPONENTS ---

const NetflixCard = memo(({ movie }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const timeoutRef = useRef(null);

    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const { success, info } = useToast();

    const handleToggleList = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWatchlist(movie);
        if (added) success("Đã thêm vào danh sách");
        else info("Đã xóa khỏi danh sách");
    };

    const handleMouseEnter = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 400); 
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(false);
    }, []);

    if (!movie) return null;

    return (
        <div 
            className="relative w-full aspect-[2/3] flex-shrink-0 transition-all duration-300 z-10 snap-start"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                className={`w-full h-full bg-slate-800/50 rounded-lg overflow-hidden transition-all duration-500 will-change-transform ${isHovered ? 'scale-110 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 absolute -top-4 -left-2 w-[calc(100%+8px)] lg:w-[calc(100%+32px)] aspect-video' : ''}`}
            >
                <div className={`w-full h-full relative ${!imgLoaded ? 'animate-pulse bg-slate-800' : ''}`}>
                    <img 
                        src={movie.poster_url || movie.thumb_url} 
                        alt={movie.name} 
                        loading="lazy"
                        onLoad={() => setImgLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'opacity-40 blur-[2px]' : 'opacity-100'} ${imgLoaded ? 'scale-100' : 'scale-95 opacity-0'}`} 
                    />
                    
                    {/* Badge for episodes if available */}
                    {movie.episode_current && (
                        <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg z-10 uppercase tracking-tighter">
                            Tập {movie.episode_current}
                        </div>
                    )}
                </div>
                
                {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/60 to-transparent p-3 sm:p-4 flex flex-col justify-end animate-fade-in-up">
                        <h3 className="text-white font-black text-xs sm:text-sm md:text-base leading-tight mb-2 line-clamp-2 drop-shadow-md">{movie.name}</h3>
                        <div className="flex items-center gap-2 mb-3 text-[9px] sm:text-[10px] text-green-400 font-black">
                            <span className="bg-green-600/20 px-1.5 py-0.5 rounded border border-green-600/30">{movie.quality || 'FHD'}</span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                            <span className="text-slate-200">{movie.year}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 justify-between">
                            <div className="flex gap-2">
                                <Link 
                                    to={`/entertainment/movies/${movie.slug}`}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg"
                                >
                                    <Play size={16} fill="currentColor" />
                                </Link>
                                <button 
                                    onClick={handleToggleList}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-lg ${isInWatchlist(movie.slug) ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/10 border-white/20 text-white hover:bg-white/30'}`}
                                    title={isInWatchlist(movie.slug) ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
                                >
                                    {isInWatchlist(movie.slug) ? <X size={16} /> : <Plus size={18} />}
                                </button>
                            </div>
                            <Link 
                                to={`/entertainment/movies/${movie.slug}`}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all transform hover:scale-110 ml-auto"
                            >
                                <Info size={16} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const HeroBanner = memo(({ movies }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!movies || movies.length === 0) return;
        const interval = setInterval(() => {
            handleNext();
        }, 12000); 
        return () => clearInterval(interval);
    }, [movies, currentIndex]);

    const handleNext = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
            setIsAnimating(false);
        }, 800);
    }, [isAnimating, movies]);

    if (!movies || movies.length === 0) return (
        <div className="w-full h-[70vh] bg-[#0b1020] animate-pulse" />
    );

    const movie = movies[currentIndex];

    return (
        <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] overflow-hidden mb-12 group">
            {/* Background Image Container */}
            <div className="absolute inset-0">
                {movies.slice(0, 5).map((m, idx) => (
                    <div 
                        key={m.id || m.slug}
                        className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out transform ${idx === currentIndex ? 'opacity-100 scale-105 z-0' : 'opacity-0 scale-100 -z-10'}`}
                    >
                        <img 
                            src={m.poster_url || m.thumb_url} 
                            alt={m.name} 
                            className="w-full h-full object-cover"
                            onLoad={() => setLoaded(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1020] via-[#0b1020]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className={`absolute inset-0 flex items-center px-6 sm:px-12 md:px-20 transition-all duration-700 delay-300 ${isAnimating ? 'opacity-0 translate-y-8 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
                <div className="max-w-3xl mt-20">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-sm shadow-lg shadow-red-900/40">
                            TRỰC TUYẾN
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/5">
                             {[...Array(5)].map((_, i) => (
                                 <Star key={i} size={12} fill="currentColor" />
                             ))}
                             <span className="text-[10px] text-white font-bold ml-1">TOP 10</span>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[1.1] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] tracking-tight">
                        {movie.name}
                    </h1>
                    
                    <div className="flex items-center gap-5 text-slate-200 text-sm mb-8 font-bold">
                        <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{movie.quality || 'FHD 1080p'}</span>
                        <span className="flex items-center gap-1"><Monitor size={14} className="text-red-500"/> {movie.year}</span>
                        <span className="flex items-center gap-1 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">{movie.lang}</span>
                    </div>
                    
                    <p className="text-slate-300 text-sm sm:text-lg mb-10 line-clamp-3 leading-relaxed hidden sm:block max-w-2xl drop-shadow-lg opacity-90">
                        {movie.content ? movie.content.replace(/<[^>]*>/g, '') : "Một siêu phẩm hành động kịch tính với dàn diễn viên gạo cội, cốt truyện lôi cuốn mà bạn chắc chắn sẽ không muốn bỏ qua tại HouseFim."}
                    </p>
                    
                    <div className="flex items-center gap-5">
                        <Link 
                            to={`/entertainment/movies/${movie.slug}`}
                            className="px-8 sm:px-10 py-4 bg-white text-black font-black rounded-lg flex items-center gap-3 transition-all hover:bg-red-600 hover:text-white transform hover:scale-105 active:scale-95 shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                        >
                            <Play size={24} fill="currentColor" /> XEM NGAY
                        </Link>
                        <Link 
                            to={`/entertainment/movies/${movie.slug}`}
                            className="px-8 sm:px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-black rounded-lg flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 border border-white/10"
                        >
                            <Info size={24} /> THÔNG TIN
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="absolute right-6 bottom-24 flex flex-row sm:flex-col gap-3 z-20">
                 {movies.slice(0, 5).map((_, idx) => (
                     <button
                        key={idx}
                        onClick={() => { setCurrentIndex(idx); setIsAnimating(false); }}
                        className={`transition-all duration-500 rounded-full ${idx === currentIndex ? 'bg-red-600 w-10 sm:w-1 sm:h-12 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-slate-500/50 w-2 h-2 sm:w-1 sm:h-8 hover:bg-slate-400'}`}
                     />
                 ))}
            </div>
        </div>
    );
});

const MovieSection = memo(({ title, icon: Icon, movies, loading, link }) => {
    const scrollRef = useRef(null);

    const scroll = useCallback((direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.clientWidth / 1.2 : current.clientWidth / 1.2;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }, []);

    if (loading) return (
        <div className="mb-14 px-6 sm:px-12 md:px-20 animate-pulse">
             <div className="h-8 w-64 bg-slate-800/80 rounded mb-8" />
             <div className="flex gap-4 overflow-hidden">
                 {[...Array(6)].map((_, i) => (
                     <div key={i} className="w-44 h-72 bg-slate-800/40 rounded-xl shrink-0" />
                 ))}
             </div>
        </div>
    );

    if (!movies || movies.length === 0) return null;

    return (
        <div className="mb-14 relative group/section transform translate-z-0">
            <div className="flex items-center justify-between px-6 sm:px-12 md:px-20 mb-6 font-sans">
                <Link to={link || "#"} className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 hover:text-red-500 transition-all duration-300 transform active:scale-95">
                    {Icon && <div className="p-2 bg-red-600/10 rounded-lg text-red-600"><Icon size={24} /></div>}
                    <span className="tracking-tight">{title}</span>
                    <ChevronRight size={24} className="text-slate-500 opacity-0 group-hover/section:opacity-100 transition-all transform group-hover/section:translate-x-1" />
                </Link>
                <Link to={link || "#"} className="px-4 py-2 rounded-full bg-white/5 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                    CÔNG CHIẾU 
                    <ChevronRight size={14} />
                </Link>
            </div>

            <div className="relative group">
                {/* Scroll Buttons - Glassmorphism UI */}
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-8 w-16 bg-gradient-to-r from-[#0b1020] to-transparent z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:w-20 active:scale-90"
                >
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl">
                        <ChevronLeft size={32} />
                    </div>
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-8 w-16 bg-gradient-to-l from-[#0b1020] to-transparent z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:w-20 active:scale-90"
                >
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl">
                        <ChevronRight size={32} />
                    </div>
                </button>

                {/* List - Enhanced Scroll Experience */}
                <div 
                    ref={scrollRef}
                    className="flex gap-5 overflow-x-auto px-6 sm:px-12 md:px-20 pb-10 pt-2 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                >
                    {movies.map((movie) => (
                        <div key={movie.id || movie.slug} className="w-44 sm:w-52 md:w-60 lg:w-64 flex-shrink-0 snap-start transform-gpu">
                            <NetflixCard movie={movie} />
                        </div>
                    ))}
                    {/* View All Card */}
                    {link && (
                        <Link 
                            to={link}
                            className="w-44 sm:w-52 md:w-60 lg:w-64 aspect-[2/3] flex-shrink-0 bg-white/5 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all group/last snap-start"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center group-hover/last:bg-red-600 group-hover/last:text-white transition-all">
                                <Plus size={32} />
                            </div>
                            <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Xem tất cả</span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
});

// --- MAIN PAGE ---

export default function MoviesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();
    const { notifications, unreadCount, checkUpdates, markAllAsRead, clearNotifications } = useNotifications();
    const { success, info } = useToast();
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const mainRef = useRef(null);
    // Data States
    const [filteredMovies, setFilteredMovies] = useState([]); // Used when type/sort is active
    const [isHomePage, setIsHomePage] = useState(true);

    // Standard buckets for Home Page
    const [hotMovies, setHotMovies] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [singleMovies, setSingleMovies] = useState([]);
    const [seriesMovies, setSeriesMovies] = useState([]);
    const [tvShows, setTvShows] = useState([]);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const activeSource = ophimService.getActiveSource().name;

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        
        const typeF = searchParams.get('type');
        const sortF = searchParams.get('sort');
        const genreF = searchParams.get('genre');
        const countryF = searchParams.get('country');
        const yearF = searchParams.get('year');

        const fetchData = async () => {
             setLoading(true);
             try {
                if (typeF || sortF || genreF || countryF || yearF) {
                    setIsHomePage(false);
                    // Use advanced filter API
                    let res;
                    if (sortF === 'trending' && !typeF && !genreF && !countryF && !yearF) {
                        res = await ophimService.getListBySlug('phim-moi-cap-nhat', 1);
                    } else {
                        res = await ophimService.filter({
                            type: typeF || '',
                            genre: genreF || '',
                            country: countryF || '',
                            year: yearF || '',
                            page: searchParams.get('page') || 1
                        });
                    }
                    
                    if (res && res.success && res.data) {
                        setFilteredMovies(res.data.items || []);
                    } else {
                        setFilteredMovies([]);
                    }
                } else if (location.pathname === '/entertainment/my-list') {
                     setIsHomePage(false);
                     setFilteredMovies(watchlist); 
                } else {
                    // HOME PAGE MODE - Fetch All Vertical Sections
                    setIsHomePage(true);
                    const [hotRes, trendingRes, singleRes, seriesRes, tvShowRes] = await Promise.all([
                        ophimService.getListBySlug('phim-moi-cap-nhat', 1),
                        ophimService.getListBySlug('hoat-hinh', 1),
                        ophimService.getListBySlug('phim-le', 1),
                        ophimService.getListBySlug('phim-bo', 1),
                        ophimService.getListBySlug('tv-shows', 1)
                    ]);

                    if (hotRes.success) setHotMovies(hotRes.data.items);
                    if (trendingRes.success) setTrendingMovies(trendingRes.data.items);
                    if (singleRes.success) setSingleMovies(singleRes.data.items);
                    if (seriesRes.success) setSeriesMovies(seriesRes.data.items);
                    if (tvShowRes.success) setTvShows(tvShowRes.data.items);
                }

                // Fetch Categories
                const catRes = await ophimService.getCategories();
                if (catRes.success) {
                    const cats = catRes.raw?.data?.items || catRes.data?.items || [];
                    setCategories(cats);
                }
                
                // Fetch Countries
                const countryRes = await ophimService.getCountries();
                if (countryRes.success) {
                    const cnts = countryRes.raw?.data?.items || countryRes.data?.items || [];
                    setCountries(cnts);
                }

             } catch (err) {
                 console.error("Error loading movie data", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchData();
    }, [searchParams, location.pathname, activeSource, watchlist]);

    // Check for updates when watchlist is ready
    useEffect(() => {
        if (watchlist.length > 0) {
            // Delay check slightly to avoid impact on initial load
            const timer = setTimeout(() => checkUpdates(watchlist), 5000);
            return () => clearTimeout(timer);
        }
    }, [watchlist.length]); 
    // Only check when the count changes or on mount (if watchlist exists)

    // Handle Search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        
        const delay = setTimeout(async () => {
             setIsSearching(true);
             try {
                 const res = await ophimService.search(searchTerm, 1);
                 if (res.success && res.data && res.data.items) {
                     setSearchResults(res.data.items.slice(0, 5)); // Limit to 5 results for dropdown
                 } else {
                     setSearchResults([]);
                 }
             } catch (e) {
                 console.error(e);
             } finally {
                 setIsSearching(false);
             }
        }, 500);
        
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const navLinkClass = ({ isActive }) => {
        // Custom logic for query params because NavLink only checks path
        return `hover:text-white transition font-bold px-3 py-2 ${isActive ? 'text-red-600' : 'text-slate-300'}`;
    };

    // Helper to determine active state for query-based links
    const isLinkActive = (path, typeVal, sortVal) => {
        if (location.pathname !== path) return false;
        const currentType = searchParams.get('type');
        const currentSort = searchParams.get('sort');
        if (typeVal && currentType !== typeVal) return false;
        if (sortVal && currentSort !== sortVal) return false;
        if (!typeVal && !sortVal && (currentType || currentSort)) return false;
        return true;
    };

    const getLinkClass = (path, type, sort) => {
        const active = isLinkActive(path, type, sort);
        return `hover:text-white transition font-bold cursor-pointer text-sm ${active ? 'text-red-600 font-black' : 'text-slate-300 font-medium'}`;
    };

    const handleScroll = () => {
        // Use window scroll because we are no longer in a fixed container
        setIsScrolled(window.scrollY > 50);
        setShowBackToTop(window.scrollY > 1000);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div 
            ref={mainRef}
            className="min-h-screen bg-[#0b1020] text-slate-200 pb-20 font-sans selection:bg-red-600 selection:text-white"
        >
            
            {/* Navbar Placeholder */}
            <div className={`sticky top-0 z-[40] transition-all duration-300 ${isScrolled ? 'bg-[#0b1020]/95 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
                <div className="flex items-center justify-between px-4 sm:px-12 py-5 max-w-[1920px] mx-auto gap-8">
                    <div className="flex items-center gap-10 flex-1">
                       <div className="flex items-center"> 
                           {/* Mobile Menu Toggle */}
                           <button 
                                className="md:hidden text-white mr-6 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                           >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                           </button>
                           <div className="flex items-center gap-4"> 
                                <Link to="/entertainment" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 flex items-center justify-center group active:scale-90">
                                    <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                </Link>
                                
                                <div className="flex items-center gap-1.5 cursor-pointer group select-none active:scale-95 transition-transform" onClick={() => navigate('/entertainment/movies')}>
                                    <h1 className="text-3xl font-black text-white tracking-tighter">House<span className="text-red-600">Fim</span></h1>
                                    <span className="px-1.5 py-0.5 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black rounded group-hover:bg-red-600 group-hover:text-white transition-all uppercase">Official</span>
                                </div>
                           </div>

                         {/* Desktop Menu */}
                        <div className="hidden lg:flex gap-8 items-center ml-6">
                           <NavLink to="/entertainment/movies" end className={({isActive}) => `transition-all cursor-pointer text-sm tracking-wide ${isActive && !searchParams.get('type') && !searchParams.get('sort') ? 'text-white font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Trang Chủ
                           </NavLink>
                           <NavLink to="/entertainment/movies?type=phim-bo" className={() => `transition-all cursor-pointer text-sm tracking-wide ${isLinkActive('/entertainment/movies', 'phim-bo', null) ? 'text-white font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Phim Bộ
                           </NavLink>
                           <NavLink to="/entertainment/movies?type=phim-le" className={() => `transition-all cursor-pointer text-sm tracking-wide ${isLinkActive('/entertainment/movies', 'phim-le', null) ? 'text-white font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Phim Lẻ
                           </NavLink>
                            <NavLink to="/entertainment/movies?type=hoat-hinh" className={() => `transition-all cursor-pointer text-sm tracking-wide ${isLinkActive('/entertainment/movies', 'hoat-hinh', null) ? 'text-white font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Animation
                           </NavLink>
                           <NavLink to="/entertainment/movies?sort=trending" className={() => `transition-all cursor-pointer text-sm tracking-wide ${isLinkActive('/entertainment/movies', null, 'trending') ? 'text-red-500 font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Mới & Phổ Biến
                           </NavLink>
                           <NavLink to="/entertainment/my-list" className={({isActive}) => `transition-all cursor-pointer text-sm tracking-wide ${isActive ? 'text-white font-black scale-105' : 'text-slate-400 font-bold hover:text-white'}`}>
                                Danh Sách Của Tôi
                           </NavLink>
                       </div>
                    </div>

                    <div className="flex items-center gap-8 shrink-0">
                        <div className={`relative group transition-all duration-500 ease-out flex items-center ${searchTerm || isSearching ? 'w-80' : 'w-10 focus-within:w-80'}`}>
                            <button 
                                onClick={(e) => e.currentTarget.nextSibling.focus()}
                                className={`absolute left-0 p-2.5 text-slate-400 hover:text-white transition-colors z-10 ${searchTerm ? 'pointer-events-none' : ''}`}
                            >
                                <Search size={22} strokeWidth={2.5} />
                            </button>
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={(e) => e.target.parentElement.classList.add('w-80')}
                                onBlur={(e) => !searchTerm && e.target.parentElement.classList.remove('w-80')}
                                placeholder="Tên phim, thể loại..."
                                className={`bg-[#161b2e]/60 backdrop-blur-md text-white text-sm pl-12 pr-4 py-2.5 rounded-xl border border-white/5 outline-none w-full transition-all duration-500 ${searchTerm ? 'opacity-100 placeholder:text-slate-500' : 'opacity-0 cursor-pointer focus:opacity-100 ring-2 ring-red-600/20 bg-black/80'}`}
                            />
                            
                            {/* SEARCH DROPDOWN */}
                            {searchTerm && (
                                <div className="absolute top-full right-0 w-96 bg-[#0b1020]/95 backdrop-blur-xl border border-white/10 rounded-2xl mt-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 border-b border-white/5 bg-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Kết quả tìm kiếm</p>
                                    </div>
                                    {isSearching ? (
                                        <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                                            <Loader2 size={24} className="animate-spin text-red-600" />
                                            Đang tìm kiếm phim...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(movie => (
                                                <Link 
                                                    key={movie.id} 
                                                    to={`/entertainment/movies/${movie.slug}`}
                                                    className="flex gap-4 p-4 hover:bg-white/10 transition-all border-b border-white/5 last:border-0 items-center group/item"
                                                >
                                                    <div className="w-12 h-16 shrink-0 relative rounded-lg overflow-hidden shadow-lg group-hover/item:scale-105 transition-transform">
                                                        <img src={movie.thumb_url} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-white line-clamp-1 group-hover/item:text-red-500 transition-colors uppercase tracking-tight">{movie.name}</h4>
                                                        <p className="text-xs text-slate-500 line-clamp-1 font-medium italic opacity-70 mt-0.5">{movie.original_name}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] text-green-400 font-black border border-green-400/20 px-1.5 py-0.5 rounded bg-green-400/5">{movie.year}</span>
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{movie.lang}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20 mb-2" />
                                            Không tìm thấy phim phù hợp.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="relative">
                            <div 
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    if (unreadCount > 0) markAllAsRead();
                                }}
                                className={`relative p-2.5 transition-all cursor-pointer group active:scale-95 rounded-full hover:bg-white/10 ${showNotifications ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Bell size={24} strokeWidth={2} className={unreadCount > 0 ? 'animate-bounce-short' : ''} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-5 h-5 bg-red-600 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#0b1020]">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-[#0b1020]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                        <h3 className="text-white font-black uppercase tracking-widest text-xs">Thông báo</h3>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={clearNotifications}
                                                className="text-[10px] text-slate-500 hover:text-red-500 font-bold uppercase tracking-tighter transition-colors"
                                            >
                                                Xóa tất cả
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => {
                                                        navigate(`/entertainment/movies/${n.movieSlug}`);
                                                        setShowNotifications(false);
                                                    }}
                                                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 group"
                                                >
                                                    <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                                        <img src={n.poster} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-bold truncate group-hover:text-red-500 transition-colors">{n.movieName}</p>
                                                        <p className="text-slate-400 text-xs mt-1">{n.message}</p>
                                                        <p className="text-[10px] text-slate-600 mt-2 font-medium">
                                                            {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
                                                            {new Date(n.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {!n.read && (
                                                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                                                <Bell size={40} className="opacity-10" />
                                                <p className="text-sm">Chưa có thông báo mới nào cho bạn.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                                         <Link 
                                            to="/entertainment/my-list" 
                                            onClick={() => setShowNotifications(false)}
                                            className="text-xs text-red-500 font-black hover:text-red-400 uppercase tracking-widest"
                                         >
                                            Xem danh sách của tôi
                                         </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <Link to="/profile" className="flex items-center gap-2 group">
                            {user?.avatar_url ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-red-600 transition-all shadow-lg ring-4 ring-red-600/5 group-hover:scale-110 active:scale-95">
                                    <img 
                                        src={(() => {
                                            let url = user.avatar_url;
                                            if (url && (url.includes("localhost") || url.includes("127.0.0.1"))) {
                                                try {
                                                    const urlObj = new URL(url);
                                                    return urlObj.pathname; 
                                                } catch (e) { return url; }
                                            }
                                            return url;
                                        })()} 
                                        className="w-full h-full object-cover"
                                        alt="User"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const fallback = e.target.nextSibling;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                    <div 
                                        className="w-full h-full bg-red-600 items-center justify-center font-black text-white"
                                        style={{ display: 'none' }}
                                    >
                                        {(user.full_name || user.username || "H").charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-white cursor-pointer shadow-lg shadow-red-900/30 group-hover:scale-110 active:scale-90 transition-all border-2 border-white/10 overflow-hidden ring-4 ring-red-600/10">
                                    {(user?.full_name || user?.username || "N").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                    </div>

                </div>
            </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-[#0b1020] border-t border-white/10 animate-fade-in-down origin-top custom-scrollbar">
                        <div className="flex flex-col p-4 gap-4">
                            <Link 
                                to="/entertainment" 
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 text-slate-300 hover:text-white"
                            >
                                <ChevronLeft size={16} /> Quay lại
                            </Link>

                            <NavLink 
                                to="/entertainment/movies" 
                                end
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({isActive}) => `p-2 ${isActive && !searchParams.get('type') && !searchParams.get('sort') ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Trang Chủ
                            </NavLink>
                            <NavLink 
                                to="/entertainment/movies?type=phim-bo" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() => `p-2 ${isLinkActive('/entertainment/movies', 'phim-bo', null) ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Phim Bộ
                            </NavLink>
                             <NavLink 
                                to="/entertainment/movies?type=phim-le" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() => `p-2 ${isLinkActive('/entertainment/movies', 'phim-le', null) ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Phim Lẻ
                            </NavLink>
                            <NavLink 
                                to="/entertainment/movies?type=hoat-hinh" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() => `p-2 ${isLinkActive('/entertainment/movies', 'hoat-hinh', null) ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Animation
                            </NavLink>
                            <NavLink 
                                to="/entertainment/movies?sort=trending" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() => `p-2 ${isLinkActive('/entertainment/movies', null, 'trending') ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Mới & Phổ Biến
                            </NavLink>
                            <NavLink 
                                to="/entertainment/my-list" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({isActive}) => `p-2 ${isActive ? 'text-red-500 font-bold' : 'text-slate-300'}`}
                            >
                                Danh Sách Của Tôi
                            </NavLink>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT RENDERER */}
            {isHomePage ? (
                <>
                    {/* HERO BANNER */}
                    <HeroBanner movies={hotMovies} />

                    {/* SECTIONS */}
                    <div className="-mt-16 sm:-mt-24 relative z-10 space-y-4">
                        <MovieSection 
                            title="Phim Đang Hot" 
                            icon={TrendingUp}
                            movies={hotMovies} 
                            loading={loading}
                            link="/entertainment/movies?sort=trending"
                        />

                        <MovieSection 
                            title="Phim Bộ Mới Cập Nhật" 
                            icon={Monitor}
                            movies={seriesMovies} 
                            loading={loading}
                            link="/entertainment/movies?type=phim-bo"
                        />

                        <MovieSection 
                            title="Phim Lẻ Đặc Sắc" 
                            icon={Film}
                            movies={singleMovies} 
                            loading={loading}
                            link="/entertainment/movies?type=phim-le"
                        />

                        <MovieSection 
                            title="Hoạt Hình & Anime" 
                            icon={Globe}
                            movies={trendingMovies} 
                            loading={loading}
                            link="/entertainment/movies?type=hoat-hinh"
                        />

                        <MovieSection 
                            title="TV Shows" 
                            icon={Star}
                            movies={tvShows} 
                            loading={loading}
                            link="/entertainment/movies?type=tv-shows"
                        />
                    </div>
                </>
            ) : (
                <div className="pt-24 px-4 sm:px-10 min-h-screen">
                    {/* FILTERED VIEW TITLE */}
                    <div className="flex flex-col gap-6 mb-8">
                         <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest border-l-4 border-red-600 pl-4 py-1">
                                {searchParams.get('type') === 'phim-bo' && 'Phim Bộ'}
                                {searchParams.get('type') === 'phim-le' && 'Phim Lẻ'}
                                {searchParams.get('type') === 'hoat-hinh' && 'Animation'}
                                {searchParams.get('sort') === 'trending' && 'Mới & Phổ Biến'}
                                {searchParams.get('genre') && categories.find(c => c.slug === searchParams.get('genre'))?.name || searchParams.get('genre')}
                                {location.pathname.includes('my-list') && 'Danh Sách Của Tôi'}
                                {!searchParams.get('type') && !searchParams.get('sort') && !searchParams.get('genre') && !location.pathname.includes('my-list') && 'Tất Cả Phim'}
                            </h2>
                         </div>

                         {/* ADVANCED FILTER BAR */}
                         {!location.pathname.includes('my-list') && (
                             <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-800/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm z-20 relative">
                                 <div className="flex items-center gap-2 text-slate-400 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                                     <SlidersHorizontal size={18} className="text-red-500" />
                                     <span className="text-sm font-black uppercase tracking-widest">Bộ Lọc:</span>
                                 </div>
                                 
                                 {/* Type Filter */}
                                 <div className="relative group w-full sm:w-auto flex-1 sm:flex-none">
                                     <select 
                                         value={searchParams.get('type') || ''}
                                         onChange={(e) => {
                                             const params = new URLSearchParams(searchParams);
                                             if (e.target.value) params.set('type', e.target.value); else params.delete('type');
                                             navigate(`${location.pathname}?${params.toString()}`);
                                         }}
                                         className="appearance-none w-full bg-[#161b2e] border border-white/10 text-white text-xs font-bold rounded-xl pr-10 pl-4 py-3 outline-none hover:border-white/20 transition-all cursor-pointer shadow-lg"
                                     >
                                         <option value="">Tất cả định dạng</option>
                                         <option value="phim-bo">Phim Bộ</option>
                                         <option value="phim-le">Phim Lẻ</option>
                                         <option value="hoat-hinh">Hoạt Hình</option>
                                         <option value="tv-shows">TV Shows</option>
                                     </select>
                                     <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-white transition-colors" />
                                 </div>

                                 {/* Genre Filter */}
                                 <div className="relative group w-full sm:w-auto flex-1 sm:flex-none">
                                     <select 
                                         value={searchParams.get('genre') || ''}
                                         onChange={(e) => {
                                             const params = new URLSearchParams(searchParams);
                                             if (e.target.value) params.set('genre', e.target.value); else params.delete('genre');
                                             navigate(`${location.pathname}?${params.toString()}`);
                                         }}
                                         className="appearance-none w-full bg-[#161b2e] border border-white/10 text-white text-xs font-bold rounded-xl pr-10 pl-4 py-3 outline-none hover:border-white/20 transition-all cursor-pointer shadow-lg sm:max-w-[180px]"
                                     >
                                         <option value="">Tất cả thể loại</option>
                                         {categories.map(cat => (
                                             <option key={cat.slug || cat.id} value={cat.slug}>{cat.name}</option>
                                         ))}
                                     </select>
                                     <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-white transition-colors" />
                                 </div>

                                 {/* Country Filter */}
                                 <div className="relative group w-full sm:w-auto flex-1 sm:flex-none">
                                     <select 
                                         value={searchParams.get('country') || ''}
                                         onChange={(e) => {
                                             const params = new URLSearchParams(searchParams);
                                             if (e.target.value) params.set('country', e.target.value); else params.delete('country');
                                             navigate(`${location.pathname}?${params.toString()}`);
                                         }}
                                         className="appearance-none w-full bg-[#161b2e] border border-white/10 text-white text-xs font-bold rounded-xl pr-10 pl-4 py-3 outline-none hover:border-white/20 transition-all cursor-pointer shadow-lg sm:max-w-[180px]"
                                     >
                                         <option value="">Tất cả quốc gia</option>
                                         {countries.map(cnt => (
                                             <option key={cnt.slug || cnt.id} value={cnt.slug}>{cnt.name}</option>
                                         ))}
                                     </select>
                                     <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-white transition-colors" />
                                 </div>

                                 {/* Year Filter */}
                                 <div className="relative group w-full sm:w-auto flex-1 sm:flex-none">
                                     <select 
                                         value={searchParams.get('year') || ''}
                                         onChange={(e) => {
                                             const params = new URLSearchParams(searchParams);
                                             if (e.target.value) params.set('year', e.target.value); else params.delete('year');
                                             navigate(`${location.pathname}?${params.toString()}`);
                                         }}
                                         className="appearance-none w-full bg-[#161b2e] border border-white/10 text-white text-xs font-bold rounded-xl pr-10 pl-4 py-3 outline-none hover:border-white/20 transition-all cursor-pointer shadow-lg"
                                     >
                                         <option value="">Năm phát hành</option>
                                         {Array.from({length: 15}, (_, i) => new Date().getFullYear() - i).map(year => (
                                             <option key={year} value={year}>{year}</option>
                                         ))}
                                     </select>
                                     <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-white transition-colors" />
                                 </div>

                                 {/* Reset Button */}
                                 {(searchParams.get('genre') || searchParams.get('country') || searchParams.get('year') || searchParams.get('type') || searchParams.get('sort')) && (
                                     <button 
                                         onClick={() => navigate(location.pathname)}
                                         className="w-full sm:w-auto px-5 py-3 rounded-xl bg-red-600 border border-red-500 text-white hover:bg-red-700 cursor-pointer transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 sm:ml-auto shadow-lg shadow-red-900/40 active:scale-95"
                                     >
                                         <X size={16} strokeWidth={3} /> Xóa Lọc
                                     </button>
                                 )}
                             </div>
                         )}
                    </div>

                    {loading ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="aspect-[2/3] bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                         </div>
                    ) : filteredMovies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10 animate-fade-in-up pb-20">
                            {filteredMovies.map(movie => (
                                <div key={movie.id || movie._id || movie.slug}>
                                    <NetflixCard movie={movie} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-40 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <Monitor size={64} className="mx-auto text-slate-700 mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">
                                {location.pathname.includes('my-list') ? 'Danh sách của bạn đang trống' : 'Chưa có nội dung'}
                            </h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {location.pathname.includes('my-list') 
                                   ? 'Hãy thêm những bộ phim yêu thích để xem lại sau nhé!' 
                                   : 'Nội dung này đang được cập nhật, vui lòng quay lại sau.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Back to Top */}
            <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-8 right-8 w-14 h-14 bg-red-600 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] z-50 transition-all duration-500 transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20 hover:border-white/40 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
            >
                <ChevronLeft size={28} className="rotate-90" />
            </button>

            {/* FOOTER */}
            <div className="mt-20 px-10 py-20 border-t border-slate-800 text-slate-500 text-sm container mx-auto text-center">
                 <p className="mb-4">Thiết kế bởi HouseFim Team</p>
                 <div className="flex justify-center gap-6 mb-8">
                     <span className="cursor-pointer hover:underline">Mô tả âm thanh</span>
                     <span className="cursor-pointer hover:underline">Trung tâm trợ giúp</span>
                     <span className="cursor-pointer hover:underline">Thẻ quà tặng</span>
                     <span className="cursor-pointer hover:underline">Trung tâm đa phương tiện</span>
                 </div>
                 <p>© 2026 HouseFim. All rights reserved.</p>
            </div>
        </div>
    );
}
