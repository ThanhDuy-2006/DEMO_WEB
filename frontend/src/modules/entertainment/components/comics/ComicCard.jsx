import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Heart, Eye, Star, BookOpen, Flame, Loader2 } from 'lucide-react';
import { entertainmentService, COMIC_IMG_CDN } from '../../services/entertainmentApi';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../context/ToastContext';
import { useEffect } from 'react';

const ComicCard = ({ comic }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [isHovered, setIsHovered] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial check if following
    useEffect(() => {
        if (user && comic.slug) {
            entertainmentService.checkFollowing(comic.slug)
                .then(res => setIsFollowing(res.isFollowing))
                .catch(() => {});
        }
    }, [user, comic.slug]);
    const handleReadNow = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/entertainment/comics/${comic.slug}`);
    };

    const handleFollow = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            toast.warn("Vui lòng đăng nhập để theo dõi truyện!");
            return;
        }

        setLoading(true);
        try {
            if (isFollowing) {
                await entertainmentService.unfollowComic(comic.slug);
                setIsFollowing(false);
                toast.success("Đã bỏ theo dõi");
            } else {
                await entertainmentService.followComic({
                    slug: comic.slug,
                    name: comic.name,
                    thumb: comic.thumb_url,
                    lastChapter: comic.last_chapter || "1"
                });
                setIsFollowing(true);
                toast.success("Đã theo dõi truyện");
            }
        } catch (error) {
            toast.error("Thao tác thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="group relative flex flex-col bg-[#1a1c23] rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 border border-white/5 hover:border-purple-500/30"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <Link to={`/entertainment/comics/${comic.slug}`} className="relative aspect-[2/3] overflow-hidden">
                <img 
                    src={`${COMIC_IMG_CDN}/${comic.thumb_url}`} 
                    alt={comic.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Multi-layered Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent opacity-80 transition-opacity duration-300 ${isHovered ? 'opacity-95' : 'opacity-60'}`} />
                <div className={`absolute inset-0 bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {comic.status === 'ongoing' ? (
                        <span className="px-3 py-1 bg-blue-600/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-500/20">
                            Đang ra
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-green-600/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-green-500/20">
                            Hoàn thành
                        </span>
                    )}
                    {comic.sub_docquyen && (
                        <span className="px-3 py-1 bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-1">
                            <Flame size={10} className="text-amber-400" /> Hot
                        </span>
                    )}
                </div>

                {/* Hover Actions */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <button 
                        onClick={handleReadNow}
                        className="w-3/4 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all shadow-xl"
                    >
                        <Play size={16} fill="currentColor" /> Đọc ngay
                    </button>
                    <button 
                        onClick={handleFollow}
                        disabled={loading}
                        className={`w-3/4 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                            isFollowing 
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-black/40 border-white/20 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/40'
                        } disabled:opacity-50`}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Heart size={16} fill={isFollowing ? "currentColor" : "none"} /> 
                                {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                            </>
                        )}
                    </button>
                </div>

                {/* Stats Overlay (Bottom) */}
                <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/70 text-[10px] font-bold transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400" fill="currentColor" />
                        <span>{comic.view || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen size={12} className="text-blue-400" />
                        <span>Chương {comic.last_chapter || '??'}</span>
                    </div>
                </div>
            </Link>

            {/* Info Container */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <Link to={`/entertainment/comics/${comic.slug}`}>
                    <h3 className="text-white font-bold group-hover:text-purple-400 transition-colors line-clamp-2 text-sm sm:text-base leading-tight">
                        {comic.name}
                    </h3>
                </Link>
                
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {comic.category?.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-medium uppercase tracking-wider">
                            {cat.name}
                        </span>
                    ))}
                    {comic.category?.length > 2 && (
                        <span className="text-[9px] text-slate-600 px-1 py-0.5 font-medium">
                            +{comic.category.length - 2}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComicCard;
