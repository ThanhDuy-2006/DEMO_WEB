import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Download, ExternalLink, SlidersHorizontal, Bell, Plus, ChevronDown, User, Calendar, Users, Expand, Maximize, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "../../../context/ToastContext";

const API_KEY = 'INt3Q5RjpWJ7mOyOfgTuQh3AHQJew8ROtFscwOJU8Enn4KggJ8LfKqJX';
const PEXELS_URL = 'https://api.pexels.com/v1';

export default function ImagesPage() {
    const toast = useToast();
    const [images, setImages] = useState([]);
    const [query, setQuery] = useState('Chòm Sao');
    const [searchInput, setSearchInput] = useState('Chòm Sao');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    
    // Media Type
    const [mediaType, setMediaType] = useState('photos'); // 'photos' | 'videos' | 'users'
    const [mediaCounts] = useState({ 
        photos: (Math.random() * 10 + 5).toFixed(1) + ' Nghìn+', 
        videos: (Math.random() * 9 + 1).toFixed(1) + ' Nghìn', 
        users: '9,4 Nghìn' 
    });

    // Filters state
    const [orientation, setOrientation] = useState('Bất kỳ');
    const [age, setAge] = useState('Bất kỳ');
    const [color, setColor] = useState('');
    const [date, setDate] = useState('Bất kỳ');

    // Use pagination instead of infinite scroll
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchImages = async (pageNum, searchQuery = '') => {
        if (mediaType === 'users') {
            setImages([]);
            setLoading(false);
            setHasMore(false);
            toast.info("Tính năng tìm kiếm Người dùng đang được cập nhật!");
            return;
        }

        try {
            setLoading(true);
            const isVideo = mediaType === 'videos';
            const baseUrl = isVideo ? `${PEXELS_URL}/videos` : PEXELS_URL;
            
            let endpoint = searchQuery 
                ? `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}&per_page=30&page=${pageNum}`
                : `${baseUrl}/${isVideo ? 'popular' : 'curated'}?per_page=30&page=${pageNum}`;
            
            // Apply supported filters
            if (searchQuery && !isVideo) {
                if (orientation === 'Ngang') endpoint += '&orientation=landscape';
                if (orientation === 'Dọc') endpoint += '&orientation=portrait';
                if (orientation === 'Vuông') endpoint += '&orientation=square';
                if (color) endpoint += `&color=${color.replace('#', '')}`;
            }

            const response = await fetch(endpoint, {
                headers: { Authorization: API_KEY }
            });
            if (!response.ok) throw new Error('Không thể tải dữ liệu từ hệ thống');
            
            const data = await response.json();
            const results = isVideo ? data.videos : data.photos;
            
            setImages(results || []);
            setTotalResults(data.total_results || 0);
            scrollToTop();
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchImages(page, query);
    }, [page, query, orientation, color, mediaType]);

    const handleSearch = (e) => {
        e.preventDefault();
        setIsSearching(true);
        setPage(1);
        setQuery(searchInput);
    };

    const handleDownload = async (url, filename, isVideo = false) => {
        try {
            toast.info(`Đang tải ${isVideo ? 'video' : 'ảnh'} xuống...`);
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${filename}${isVideo ? '.mp4' : '.jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success("Tải xuống hoàn tất!");
        } catch (error) {
            toast.error("Tải xuống thất bại!");
        }
    };

    // UI Components for Filters
    const FilterPill = ({ active, children, onClick }) => (
        <button 
            onClick={onClick}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${active ? 'bg-primary text-[#0b1020] border-primary shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
        >
            {children}
        </button>
    );

    const SidebarFilterPill = ({ active, children, onClick, icon: Icon }) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-start px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border mb-2 ${active ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
        >
            {Icon && <Icon size={16} className="mr-3 opacity-70" />}
            {children}
        </button>
    );

    const Pagination = () => {
        const totalPages = Math.min(Math.ceil(totalResults / 30), 100); // Pexels limit
        if (totalPages <= 1) return null;

        const maxVisible = 5;
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);

        return (
            <div className="flex items-center justify-center gap-2 mt-20 mb-10">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                    <ChevronDown size={20} className="rotate-90" />
                </button>
                
                {start > 1 && (
                    <>
                        <button onClick={() => setPage(1)} className={`w-11 h-11 rounded-xl border border-white/10 text-sm font-bold transition-all bg-white/5 text-slate-400 hover:text-white`}>1</button>
                        {start > 2 && <span className="text-slate-600 px-1">...</span>}
                    </>
                )}

                {pages.map(p => (
                    <button 
                        key={p} 
                        onClick={() => setPage(p)}
                        className={`w-11 h-11 rounded-xl border transition-all text-sm font-bold ${p === page ? 'bg-primary border-primary text-[#0b1020] shadow-lg shadow-primary/30' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {p}
                    </button>
                ))}

                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && <span className="text-slate-600 px-1">...</span>}
                        <button onClick={() => setPage(totalPages)} className={`w-11 h-11 rounded-xl border border-white/10 text-sm font-bold transition-all bg-white/5 text-slate-400 hover:text-white`}>{totalPages}</button>
                    </>
                )}

                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                    <ChevronDown size={20} className="-rotate-90" />
                </button>
            </div>
        );
    };

    const tags = ['thiên văn học', 'đẹp', 'yêu', 'không gian', 'Thiên hà', 'chiêm tinh', 'đêm'];

    return (
        <div className="min-h-screen bg-[#0b1020] text-white font-sans w-full flex flex-col relative z-10">
            {/* 2. Thanh trên cùng (Top Navigation) */}
            <header className="relative bg-[#0b1020] border-b border-white/5 px-8 py-5 flex items-center justify-between gap-8 z-20 sticky top-0 shadow-2xl">
                <div className="flex items-center gap-10 flex-1">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-4 cursor-pointer group shrink-0" onClick={() => {setSearchInput('Chòm Sao'); setQuery('Chòm Sao'); setPage(page);}}>
                        <div className="w-11 h-11 bg-slate-900/50 rounded-xl flex items-center justify-center shadow-lg shadow-white/5 group-hover:scale-110 transition-transform p-1.5 border border-white/10">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors">HouseMarket</span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-2xl flex items-center bg-[#161b2e] hover:bg-[#1c223a] rounded-xl px-2 py-1 border border-white/5 focus-within:border-primary/40 focus-within:bg-[#1c223a] transition-all">
                        <div className="flex items-center px-4 py-2 border-r border-white/10 cursor-pointer group shrink-0">
                            <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Ảnh</span>
                            <ChevronDown size={14} className="ml-2 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-transparent border-none outline-none px-4 py-2 text-white placeholder-slate-500 font-semibold"
                            placeholder="Tìm kiếm hình ảnh và video tuyệt đẹp..."
                        />
                        <button type="submit" className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                            <Search size={20} />
                        </button>
                    </form>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                    <nav className="hidden xl:flex items-center gap-8">
                        <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Khám phá</button>
                        <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Giấy phép</button>
                    </nav>
                    
                    <div className="flex items-center gap-6">
                        <button className="text-slate-400 hover:text-white transition-colors relative p-1">
                            <Bell size={24} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0b1020]"></span>
                        </button>
                        
                        <div className="w-10 h-10 rounded-xl bg-[#161b2e] flex items-center justify-center text-slate-400 cursor-pointer border border-white/5 hover:border-primary/50 transition-all">
                            <User size={20} />
                        </div>
                        
                        <button className="bg-white hover:bg-slate-100 text-[#0b1020] text-sm font-black py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-white/5 hidden sm:block active:scale-95">
                            Tải lên
                        </button>
                    </div>
                </div>
            </header>

            {/* 3. Thanh từ khóa gợi ý (Tag Filter Row) */}
            <div className="border-b border-white/5 px-8 py-4 flex items-center gap-4 overflow-x-auto scrollbar-none relative bg-[#0b1020]/50 backdrop-blur-md z-20">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border font-bold transition-all whitespace-nowrap shrink-0 ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}
                >
                    <SlidersHorizontal size={18} />
                    Bộ lọc Ứng dụng
                </button>
                <div className="w-[1px] h-8 bg-white/10 mx-2 shrink-0"></div>
                {tags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => { setSearchInput(tag); setQuery(tag); setPage(1); }}
                        className="px-6 py-3 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:border-primary/30 hover:bg-primary/5 hover:text-primary text-sm font-bold whitespace-nowrap shrink-0 transition-all active:scale-95"
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* 7. Bố cục tổng thể (Main Area) */}
            <div className="flex max-w-[1920px] mx-auto w-full">
                
                {/* 5. Sidebar Bộ Lọc (Cột bên trái) */}
                {showFilters && (
                    <aside className="w-80 shrink-0 p-8 border-r border-white/5 hidden md:block overflow-y-auto sticky top-[160px] h-[calc(100vh-160px)] custom-scrollbar">
                        
                        {/* 5.1 Hướng */}
                        <div className="mb-10">
                            <h3 className="text-[11px] font-black text-slate-500 mb-5 tracking-[0.2em] uppercase">Hướng ảnh</h3>
                            {['Bất kỳ', 'Ngang', 'Dọc', 'Vuông'].map(o => (
                                <SidebarFilterPill key={o} active={orientation === o} onClick={() => { setOrientation(o); setPage(1); }}>
                                    {o}
                                </SidebarFilterPill>
                            ))}
                        </div>

                        {/* 5.2 Độ tuổi */}
                        <div className="mb-10">
                            <h3 className="text-[11px] font-black text-slate-500 mb-5 tracking-[0.2em] uppercase">Đối tượng</h3>
                            {['Bất kỳ', 'Em bé', 'Trẻ em', 'Thanh thiếu niên', 'Người lớn', 'Người cao tuổi'].map((a, i) => (
                                <SidebarFilterPill key={a} active={age === a} onClick={() => setAge(a)} icon={i===0 ? Users : User}>
                                    {a}
                                </SidebarFilterPill>
                            ))}
                        </div>

                        {/* 5.3 Chiều rộng */}
                        <div className="mb-10">
                            <h3 className="text-[11px] font-black text-slate-500 mb-5 tracking-[0.2em] uppercase">Kích thước Rộng</h3>
                            <input type="range" className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary mb-4" min="1080" max="20000" defaultValue="1080" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <span className="block text-[9px] font-black text-slate-500 uppercase mb-1">Tối thiểu</span>
                                    <span className="text-xs font-bold text-white">1080 px</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <span className="block text-[9px] font-black text-slate-500 uppercase mb-1">Tối đa</span>
                                    <span className="text-xs font-bold text-white">5000 px</span>
                                </div>
                            </div>
                        </div>

                        {/* 5.5 Màu sắc */}
                        <div className="mb-10">
                            <h3 className="text-[11px] font-black text-slate-500 mb-5 tracking-[0.2em] uppercase">Mã màu (HEX)</h3>
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:border-primary/50 transition-all focus-within:bg-white/10 group">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 via-fuchsia-400 to-indigo-400 border border-white/20 flex items-center justify-center shrink-0 group-hover:rotate-45 transition-transform">
                                    <Palette size={14} className="text-white drop-shadow-sm" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="VD: #05a081" 
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="bg-transparent border-none outline-none w-full text-sm font-bold text-white placeholder-slate-600" 
                                />
                            </div>
                        </div>

                        {/* 5.6 Ngày */}
                        <div className="mb-10">
                            <h3 className="text-[11px] font-black text-slate-500 mb-5 tracking-[0.2em] uppercase">Thời gian</h3>
                            {['Bất kỳ', '24 giờ qua', 'Tuần trước', 'Tháng trước', 'Năm trước'].map(d => (
                                <SidebarFilterPill key={d} active={date === d} onClick={() => setDate(d)} icon={Calendar}>
                                    {d}
                                </SidebarFilterPill>
                            ))}
                        </div>

                    </aside>
                )}

                {/* Content Grid (Ảnh bên phải) */}
                <main className="flex-1 p-8 md:p-12 xl:p-16">
                    {/* 4. Tiêu đề nội dung */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className="text-5xl md:text-[64px] font-black text-white mb-8 tracking-tighter capitalize leading-tight">
                            {mediaType === 'photos' ? 'Ảnh' : mediaType === 'videos' ? 'Video' : 'Người dùng'} về <span className="text-primary">{query}</span>
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <FilterPill active={mediaType === 'photos'} onClick={() => { setMediaType('photos'); setPage(1); }}>
                                Ảnh ({mediaCounts.photos})
                            </FilterPill>
                            <FilterPill active={mediaType === 'videos'} onClick={() => { setMediaType('videos'); setPage(1); }}>
                                Video ({mediaCounts.videos})
                            </FilterPill>
                            <FilterPill active={mediaType === 'users'} onClick={() => { setMediaType('users'); setPage(1); }}>
                                Người dùng ({mediaCounts.users})
                            </FilterPill>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                        {images.map((image, index) => {
                            const isLast = images.length === index + 1;
                            const isVideo = mediaType === 'videos';
                            const src = isVideo ? image.image : image.src?.large;
                            const downloadUrl = isVideo && image.video_files ? image.video_files[0]?.link : image.src?.original;
                            const authorName = isVideo ? image.user?.name : image.photographer;
                            const authorInitial = authorName ? authorName.charAt(0) : '?';

                            return (
                                <div 
                                    className="break-inside-avoid relative group rounded-[32px] overflow-hidden bg-white/5 border border-white/5 shadow-2xl mb-8 inline-block w-full transition-all duration-500 hover:border-primary/30"
                                >
                                    {isVideo && image.video_files && image.video_files.length > 0 ? (
                                        <video 
                                            src={image.video_files[0].link}
                                            poster={image.image}
                                            className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                                            muted
                                            loop
                                            playsInline
                                            onMouseEnter={e => e.target.play().catch(()=>{})}
                                            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                        />
                                    ) : (
                                        <img
                                            src={src || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={image.alt || 'Pexels Image'}
                                            className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.03]"
                                            loading="lazy"
                                        />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 pointer-events-none">
                                        <div className="flex items-end justify-between pointer-events-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                                                    {authorInitial}
                                                </div>
                                                <span className="text-white font-medium drop-shadow-md text-base">{authorName}</span>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button 
                                                    onClick={() => window.open(image.url, '_blank')}
                                                    className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center transition-colors shadow-sm"
                                                    title={isVideo ? "Mở video gốc" : "Mở ảnh gốc"}
                                                >
                                                    <Expand size={20} className="opacity-80" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownload(downloadUrl, `pexels-${image.id}`, isVideo)}
                                                    className="w-12 h-12 bg-[#05a081] hover:bg-[#048a6f] text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
                                                    title="Tải xuống HD"
                                                >
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isVideo && (
                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg pointer-events-none">
                                            {image.duration}s
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Pagination />

                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="animate-spin h-12 w-12 text-primary shadow-lg shadow-primary/20" />
                        </div>
                    )}
                    
                    {!loading && images.length === 0 && (
                        <div className="text-center py-32">
                            <div className="text-6xl mb-6 opacity-30">🔍</div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                                Không tìm thấy {mediaType === 'photos' ? 'ảnh' : mediaType === 'videos' ? 'video' : 'kết quả'} nào
                            </h3>
                            <p className="text-slate-400 text-lg font-medium">Bạn hãy thử từ khóa khác hoặc kiểm tra lại chính tả nhé.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
