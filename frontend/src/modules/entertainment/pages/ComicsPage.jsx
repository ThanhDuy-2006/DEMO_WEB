import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { entertainmentService } from '../services/entertainmentApi';
import { 
    Search, 
    ListFilter, 
    ArrowUp, 
    Library, 
    History,
    Sparkles,
    LayoutGrid,
    Info,
    SlidersHorizontal
} from 'lucide-react';
import BackButton from "../../../components/common/BackButton";

// New Components
import ComicCard from '../components/comics/ComicCard';
import ComicFilterSidebar from '../components/comics/ComicFilterSidebar';
import ComicGrid from '../components/comics/ComicGrid';
import ComicPagination from '../components/comics/ComicPagination';
import { FilterChips } from '../components/FilterChips';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const comicCache = new Map();

export default function ComicsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Core data state
    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    
    // UI state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [infiniteScroll, setInfiniteScroll] = useState(false);
    
    // Pagination & Guard state
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const isFetching = useRef(false);
    const abortControllerRef = useRef(null);
    const observer = useRef();

    // Filter state
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        status: searchParams.get('status') || '',
        sort: searchParams.get('sort') || 'updated',
        yearFrom: searchParams.get('yearFrom') || '',
        yearTo: searchParams.get('yearTo') || '',
        ratingMin: searchParams.get('ratingMin') || '',
        type: searchParams.get('type') || '',
        minChapters: searchParams.get('minChapters') || ''
    });

    // Load initial metadata
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const res = await entertainmentService.getComicCategories();
                if (res.status === 'success') {
                    setCategories(res.data.items || []);
                }
            } catch (err) {
                console.error("Failed to load comic categories", err);
            }
        };
        loadMetadata();
        
        const handleScroll = () => setShowScrollTop(window.scrollY > 800);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Last element ref for infinite scroll
    const lastComicElementRef = useCallback(node => {
        if (loading || !infiniteScroll) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && page < pagination.totalPages) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, pagination.totalPages, page, infiniteScroll]);

    const fetchComics = useCallback(async (isLoadMore = false) => {
        const cacheKey = JSON.stringify({ ...filters, q: searchTerm, page });
        
        if (!isLoadMore && comicCache.has(cacheKey)) {
            const cached = comicCache.get(cacheKey);
            if (Date.now() < cached.expiry) {
                setComics(cached.data);
                setPagination(cached.pagination);
                setLoading(false);
                return;
            }
            comicCache.delete(cacheKey);
        }

        if (isFetching.current) return;
        isFetching.current = true;
        
        if (!isLoadMore && abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const res = await entertainmentService.filterComics({ ...filters, q: searchTerm, page });
            if (res.success) {
                const items = res.data || [];
                if (isLoadMore) {
                    setComics(prev => [...prev, ...items]);
                } else {
                    setComics(items);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                
                if (res.pagination) {
                    setPagination(res.pagination);
                }
                
                if (!isLoadMore) {
                    comicCache.set(cacheKey, {
                        data: items,
                        pagination: res.pagination || { page, totalPages: 1 },
                        expiry: Date.now() + CACHE_TTL
                    });
                }
            } else {
                setError(res.error || "Không có kết quả");
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError("Không thể tải danh sách truyện. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [filters, searchTerm, page]);

    // Sync state with URL params
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = {};
            if (searchTerm) params.q = searchTerm;
            if (filters.category) params.category = filters.category;
            if (filters.status) params.status = filters.status;
            if (filters.sort !== 'updated') params.sort = filters.sort;
            if (filters.yearFrom) params.yearFrom = filters.yearFrom;
            if (filters.yearTo) params.yearTo = filters.yearTo;
            if (filters.ratingMin) params.ratingMin = filters.ratingMin;
            if (filters.type) params.type = filters.type;
            if (filters.minChapters) params.minChapters = filters.minChapters;
            if (page > 1) params.page = page;

            setSearchParams(params, { replace: true });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters, page, setSearchParams]);

    // Trigger fetch
    useEffect(() => {
        fetchComics(infiniteScroll && page > 1);
    }, [filters, searchTerm, page, fetchComics, infiniteScroll]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
        setComics([]); 
    };

    const handleReset = () => {
        setFilters({
            category: '',
            status: '',
            sort: 'updated',
            yearFrom: '',
            yearTo: '',
            ratingMin: '',
            type: '',
            minChapters: ''
        });
        setSearchTerm('');
        setPage(1);
        setComics([]);
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== 'updated').length;

    return (
        <div className="min-h-screen bg-[#0b0b0f] text-slate-200 font-sans selection:bg-purple-600 selection:text-white">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative max-w-[1800px] mx-auto p-4 sm:p-8 lg:p-12 animate-fade-in pb-32">
                <div className="flex items-center justify-between mb-12">
                    <BackButton fallbackPath="/entertainment" label="Quay lại" className="text-slate-400 hover:text-white" />

                </div>

                {/* Header Section */}
                <header className="mb-16">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-12 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/20" />
                                <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter italic">
                                    Kho Truyện <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Tranh</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-6">
                                <p className="text-slate-500 font-medium max-w-lg leading-relaxed text-sm sm:text-base">
                                    Khám phá hàng ngàn bộ truyện tranh tinh tuyển. Cập nhật mới mỗi ngày với trải nghiệm đọc cao cấp nhất.
                                </p>
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{pagination.totalItems || 0} truyện</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search Bar */}
                            <div className="relative w-full sm:w-96 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-all duration-300" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Tên truyện, tác giả..." 
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    className="w-full bg-[#1a1c23] border border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-slate-700 shadow-2xl"
                                />
                            </div>

                            <Link 
                                to="/entertainment/following"
                                className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-600/20 group"
                            >
                                <Library size={18} className="group-hover:rotate-12 transition-transform" />
                                <span>Theo dõi</span>
                            </Link>
                            
                            <button 
                                onClick={() => setIsFilterOpen(true)}
                                className="lg:hidden p-5 bg-[#1a1c23] text-white rounded-[1.5rem] shadow-xl border border-white/10 active:scale-95 transition-all relative"
                            >
                                <SlidersHorizontal size={20} />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-[#0b0b0f]">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Left Sidebar Filter */}
                    <ComicFilterSidebar 
                        categories={categories}
                        filters={filters}
                        onChange={handleFilterChange}
                        onReset={handleReset}
                        onApply={() => {
                            setIsFilterOpen(false);
                            fetchComics();
                        }}
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        activeFilterCount={activeFilterCount}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Control Bar */}
                        <div className="mb-10 flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <ListFilter size={14} className="text-purple-500" />
                                    <span>Đang lọc:</span>
                                </div>
                                <FilterChips 
                                    filters={filters} 
                                    onRemove={(key) => handleFilterChange(key, '')} 
                                />
                                {activeFilterCount > 0 && (
                                    <button 
                                        onClick={handleReset} 
                                        className="text-[10px] text-purple-400 font-black uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Làm mới tất cả
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Infinite Scroll Toggle */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Infinite</span>
                                    <button 
                                        onClick={() => setInfiniteScroll(!infiniteScroll)}
                                        className={`w-10 h-5 rounded-full transition-all relative ${infiniteScroll ? 'bg-purple-600' : 'bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${infiniteScroll ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="p-2 text-purple-500 bg-purple-500/10 rounded-lg">
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/5 border border-rose-500/10 p-12 rounded-[2.5rem] text-center mb-16 animate-in zoom-in duration-500">
                               <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                                   <Info size={32} />
                               </div>
                               <h3 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi</h3>
                               <p className="text-slate-500 mb-8 max-w-sm mx-auto">{error}</p>
                               <button onClick={() => fetchComics()} className="px-10 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-105 transition-all">Thử lại ngay</button>
                            </div>
                        )}

                        {/* Comic Grid */}
                        <ComicGrid comics={comics} loading={loading} />

                        {/* Last Element for Infinite Scroll */}
                        <div ref={lastComicElementRef} className="h-10 w-full" />

                        {/* Empty State */}
                        {!loading && comics.length === 0 && !error && (
                            <div className="py-32 flex flex-col items-center justify-center text-center bg-[#1a1c23]/30 rounded-[3rem] border-2 border-dashed border-white/5 animate-in fade-in duration-700">
                                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500/40 mb-8">
                                    <Search size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">Không có kết quả</h3>
                                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-10">Chúng tôi không tìm thấy bộ truyện nào phù hợp với bộ lọc hiện tại của bạn.</p>
                                <button onClick={handleReset} className="px-12 py-5 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-xl">Reset bộ lọc</button>
                            </div>
                        )}

                        {/* Pagination Section */}
                        {!infiniteScroll && !loading && comics.length > 0 && (
                            <ComicPagination 
                                page={page} 
                                totalPages={pagination.totalPages} 
                                onPageChange={(p) => setPage(p)} 
                            />
                        )}

                        {/* Results Count footer */}
                        {!loading && comics.length > 0 && (
                            <div className="mt-20 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
                                    Hiển thị {comics.length} / {pagination.totalItems} truyện
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scroll to Top */}
                <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`fixed bottom-10 right-10 w-16 h-16 bg-white text-slate-900 rounded-2xl shadow-2xl z-50 transition-all duration-500 flex items-center justify-center hover:scale-110 active:scale-95 border border-white/50 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                >
                    <ArrowUp size={24} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
