import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Check, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';

const ComicFilterSidebar = ({ 
    categories = [], 
    filters = {}, 
    onChange, 
    onReset,
    onApply,
    isOpen,
    onClose,
    activeFilterCount = 0
}) => {
    const [catSearch, setCatSearch] = useState("");
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        status: true,
        sort: true,
        advanced: false
    });

    const STATUS_OPTIONS = [
        { id: 'ongoing', name: 'Đang tiến hành' },
        { id: 'completed', name: 'Hoàn thành' },
        { id: 'upcoming', name: 'Sắp ra mắt' }
    ];

    const SORT_OPTIONS = [
        { id: 'updated', name: 'Mới cập nhật' },
        { id: 'newest', name: 'Truyện mới' },
        { id: 'views', name: 'Lượt xem' },
        { id: 'follows', name: 'Theo dõi' },
        { id: 'rating', name: 'Đánh giá' },
        { id: 'az', name: 'A-Z' },
        { id: 'za', name: 'Z-A' }
    ];

    const TYPE_OPTIONS = [
        { id: 'manga', name: 'Manga' },
        { id: 'manhwa', name: 'Manhwa' },
        { id: 'manhua', name: 'Manhua' },
        { id: 'comic-viet', name: 'Truyện Việt' }
    ];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCategoryToggle = (slug) => {
        const currentCats = filters.category ? filters.category.split(',') : [];
        let newCats;
        if (currentCats.includes(slug)) {
            newCats = currentCats.filter(c => c !== slug);
        } else {
            newCats = [...currentCats, slug];
        }
        onChange('category', newCats.join(','));
    };

    const FilterContent = () => (
        <div className="space-y-8 pb-32 lg:pb-0">
            {/* Status Section */}
            <div className="group">
                <button 
                    onClick={() => toggleSection('status')}
                    className="flex items-center justify-between w-full mb-4 text-white font-black text-xs uppercase tracking-[0.2em] group-hover:text-purple-400 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <SlidersHorizontal size={14} /> Tình trạng
                    </span>
                    {expandedSections.status ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {expandedSections.status && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {STATUS_OPTIONS.map(opt => {
                            const isActive = filters.status === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onChange('status', isActive ? '' : opt.id)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                        isActive 
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                                    }`}
                                >
                                    {opt.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sort Section */}
            <div>
                <button 
                    onClick={() => toggleSection('sort')}
                    className="flex items-center justify-between w-full mb-4 text-white font-black text-xs uppercase tracking-[0.2em] hover:text-purple-400 transition-colors"
                >
                    <span>Sắp xếp theo</span>
                    {expandedSections.sort ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {expandedSections.sort && (
                    <div className="grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {SORT_OPTIONS.map(opt => {
                            const isActive = filters.sort === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onChange('sort', opt.id)}
                                    className={`text-left px-4 py-3 rounded-xl text-xs transition-all relative overflow-hidden group/opt ${
                                        isActive 
                                        ? 'bg-purple-600/10 text-purple-400 font-bold border border-purple-500/30' 
                                        : 'text-slate-400 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />}
                                    {opt.name}
                                    <div className={`absolute right-4 opacity-0 group-hover/opt:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                                        <Check size={14} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Categories Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button 
                        onClick={() => toggleSection('categories')}
                        className="flex items-center justify-between flex-1 text-white font-black text-xs uppercase tracking-[0.2em] hover:text-purple-400 transition-colors"
                    >
                        <span>Thể loại</span>
                        {expandedSections.categories ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                </div>
                
                {expandedSections.categories && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input 
                                type="text" 
                                placeholder="Tìm thể loại..."
                                value={catSearch}
                                onChange={(e) => setCatSearch(e.target.value)}
                                className="w-full bg-[#0b0b0f] border border-white/5 rounded-xl px-9 py-2.5 text-[11px] text-white outline-none focus:border-purple-500 transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="space-y-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                            {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(cat => {
                                const isChecked = filters.category?.split(',').includes(cat.slug);
                                return (
                                    <label key={cat._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={(e) => { e.preventDefault(); handleCategoryToggle(cat.slug); }}
                                                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                    isChecked ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-600/20' : 'border-white/10 bg-white/5 group-hover:border-white/20'
                                                }`}
                                            >
                                                {isChecked && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <span 
                                                onClick={(e) => { e.preventDefault(); handleCategoryToggle(cat.slug); }}
                                                className={`text-[13px] transition-colors ${isChecked ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}
                                            >
                                                {cat.name}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Filters */}
            <div className="border-t border-white/5 pt-8">
                 <button 
                    onClick={() => toggleSection('advanced')}
                    className="flex items-center justify-between w-full text-white font-black text-xs uppercase tracking-[0.2em] hover:text-purple-400 transition-colors"
                >
                    <span>Bộ lọc nâng cao</span>
                    {expandedSections.advanced ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>

                {expandedSections.advanced && (
                    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Type Selection */}
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Kiểu truyện</p>
                            <div className="grid grid-cols-2 gap-2">
                                {TYPE_OPTIONS.map(opt => {
                                    const isActive = filters.type === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => onChange('type', isActive ? '' : opt.id)}
                                            className={`px-2 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                                isActive 
                                                ? 'bg-blue-600 border-blue-500 text-white' 
                                                : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                                            }`}
                                        >
                                            {opt.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Year range or other advanced filters can go here */}
                    </div>
                )}
            </div>

            {/* Sticky Actions Container in Sidebar */}
            <div className="pt-8 flex flex-col gap-3">
                <button 
                    onClick={onApply}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Áp dụng
                </button>
                <button 
                    onClick={onReset}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 shrink-0 h-[calc(100vh-120px)] sticky top-28 overflow-y-auto custom-scrollbar pr-4">
                <div className="bg-[#1a1c23]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-500/20">
                                <Filter size={20} />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bộ lọc</h2>
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full animate-pulse">
                                {activeFilterCount}
                            </div>
                        )}
                    </div>
                    <FilterContent />
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
                <div 
                    className={`absolute inset-0 bg-[#0b0b0f]/90 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                />
                <div className={`absolute top-0 left-0 w-[85%] max-w-sm h-full bg-[#1a1c23] shadow-2xl transition-transform duration-500 ease-out p-8 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-500/20">
                                <Filter size={20} />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bộ lọc</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <FilterContent />
                </div>
            </div>
        </>
    );
};

export default ComicFilterSidebar;
