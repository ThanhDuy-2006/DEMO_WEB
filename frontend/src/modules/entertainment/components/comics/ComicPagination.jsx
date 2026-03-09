import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const ComicPagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const delta = 2; // Number of pages to show before/after current
        
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || 
                i === totalPages || 
                (i >= page - delta && i <= page + delta)
            ) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center border shadow-lg ${
                            page === i 
                            ? 'bg-purple-600 border-purple-500 text-white shadow-purple-500/20 scale-110' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {i}
                    </button>
                );
            } else if (
                (i === page - delta - 1 && i > 1) || 
                (i === page + delta + 1 && i < totalPages)
            ) {
                pages.push(
                    <span key={i} className="text-slate-600 text-xl font-black px-1">...</span>
                );
            }
        }
        return pages;
    };

    return (
        <div className="mt-20 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                    onClick={() => onPageChange(1)}
                    disabled={page === 1}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 shadow-xl"
                >
                    <ChevronsLeft size={20} />
                </button>
                <button 
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 shadow-xl"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                    {renderPageNumbers()}
                </div>

                <button 
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 shadow-xl"
                >
                    <ChevronRight size={20} />
                </button>
                <button 
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 shadow-xl"
                >
                    <ChevronsRight size={20} />
                </button>
            </div>
            
            <div className="px-6 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full border border-white/5 backdrop-blur-md">
                <span className="text-white font-black text-xs uppercase tracking-widest italic">
                    Trang {page} <span className="mx-2 text-slate-600">/</span> {totalPages}
                </span>
            </div>
        </div>
    );
};

export default ComicPagination;
