import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from "../../../components/common/BackButton";
import { BookOpen, Clapperboard, MonitorPlay, Image as ImageIcon, Music, Speaker, Radio, Youtube, ArrowRight, Sparkles, Play } from 'lucide-react';

export default function EntertainmentHome() {
    const categories = [
        {
            title: "Truyện Tranh",
            description: "Thế giới manga, manhwa sống động. Cập nhật chap mới với chất lượng cực nét.",
            icon: BookOpen,
            path: "/entertainment/comics",
            color: "from-orange-400 to-rose-500",
            bgHover: "hover:bg-orange-500/10",
            borderHover: "hover:border-orange-500/40",
            count: "10,000+"
        },
        {
            title: "Xem Phim HD",
            description: "Rạp chiếu phim thu nhỏ. Đắm chìm trong các siêu phẩm điện ảnh 4K HDR.",
            icon: Clapperboard,
            path: "/entertainment/movies",
            color: "from-blue-400 to-indigo-500",
            bgHover: "hover:bg-blue-500/10",
            borderHover: "hover:border-blue-500/40",
            count: "5,000+"
        },
        {
            title: "Truyền Hình",
            description: "Xem trực tiếp các giải đấu thể thao và hơn 100 kênh truyền hình chất lượng.",
            icon: MonitorPlay,
            path: "/entertainment/tv",
            color: "from-emerald-400 to-teal-500",
            bgHover: "hover:bg-emerald-500/10",
            borderHover: "hover:border-emerald-500/40",
            count: "100+ Kênh"
        },
        {
            title: "Thư Viện Ảnh",
            description: "Tìm kiếm cảm hứng bất tận với kho ảnh nghệ thuật 4K siêu sắc nét.",
            icon: ImageIcon,
            path: "/entertainment/images",
            color: "from-pink-400 to-fuchsia-500",
            bgHover: "hover:bg-pink-500/10",
            borderHover: "hover:border-pink-500/40",
            count: "1M+ Ảnh"
        },
        {
            title: "Nhạc Zing MP3",
            description: "Không gian âm nhạc sống động, bắt kịp mọi xu hướng với giao diện siêu mượt.",
            icon: Music,
            path: "/entertainment/music",
            color: "from-violet-400 to-purple-500",
            bgHover: "hover:bg-violet-500/10",
            borderHover: "hover:border-violet-500/40",
            count: "Top Hits"
        },
        {
            title: "Nghe Spotify",
            description: "Trình phát nhúng chính thức. Giao diện trực quan cho tín đồ Spotify.",
            icon: Speaker,
            path: "/entertainment/spotify",
            color: "from-[#1ED760] to-[#121212]",
            bgHover: "hover:bg-[#1ED760]/10",
            borderHover: "hover:border-[#1ED760]/40",
            count: "Preview"
        },
        {
            title: "SoundCloud",
            description: "Hàng triệu bản nhạc indie, lofi và podcast cực chill dành riêng cho bạn.",
            icon: Radio,
            path: "/entertainment/soundcloud",
            color: "from-[#ff7700] to-[#ff3300]",
            bgHover: "hover:bg-[#ff7700]/10",
            borderHover: "hover:border-[#ff7700]/40",
            count: "Indie"
        },
        {
            title: "YouTube Music",
            description: "Trải nghiệm nghe nhạc YouTube không quảng cáo, chạy nền mượt mà.",
            icon: Youtube,
            path: "/entertainment/youtube",
            color: "from-red-500 to-red-700",
            bgHover: "hover:bg-red-500/10",
            borderHover: "hover:border-red-500/40",
            count: "Ad-Free"
        }
    ];

    return (
        <div className="flex-1 bg-[#0b1020] p-4 sm:p-6 lg:p-10 pb-24 relative font-sans">
             {/* Dynamic Background Effects */}
             <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent pointer-events-none z-0"></div>
             <div className="absolute -top-[300px] -right-[300px] w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0"></div>
             <div className="absolute top-[20%] -left-[200px] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0"></div>

             <div className="max-w-7xl mx-auto relative z-10">
                 <BackButton fallbackPath="/" label="Quay lại hệ thống" className="mb-8 block w-max" />
                 
                 {/* Heroic Header Section */}
                 <header className="mb-16 text-left flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
                     <div className="max-w-2xl animate-slide-up">
                         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-slate-300 mb-6 uppercase tracking-[0.2em] backdrop-blur-md shadow-xl">
                             <Sparkles className="w-4 h-4 text-amber-300" />
                             Vũ Trụ Giải Trí Đa Cực
                         </div>
                         <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-blue-300 mb-6 tracking-tight leading-[1.1]">
                             Giải trí giới hạn,<br />Trong tầm tay bạn.
                         </h1>
                         <p className="text-base sm:text-lg text-slate-400/90 leading-relaxed font-medium max-w-xl">
                             Khám phá bộ sưu tập nội dung số khổng lồ được tuyển chọn khắt khe. Trải nghiệm giải trí đỉnh cao với giao diện hoàn toàn mới.
                         </p>
                     </div>
                 </header>

                 {/* Grid Cards Container */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                     {categories.map((cat, index) => (
                         <Link 
                             key={cat.title}
                             to={cat.path}
                             className={`animate-fade-in-up group relative flex flex-col p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] overflow-hidden transition-all duration-500 backdrop-blur-md ${cat.bgHover} ${cat.borderHover} hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]`}
                             style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                         >
                             {/* Ambient Hover Glow */}
                             <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-20 blur-[80px] transition-opacity duration-700 rounded-full pointer-events-none`}></div>
                             
                             <div className="relative z-10 flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-6">
                                     <div className={`w-14 h-14 rounded-[1.25rem] bg-gradient-to-br ${cat.color} p-[1px] shadow-xl`}>
                                         <div className="w-full h-full bg-[#0b1020]/90 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center relative overflow-hidden">
                                              {/* Icon Inner Glow */}
                                              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-20`}></div>
                                              <cat.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-500 relative z-10" />
                                         </div>
                                     </div>
                                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${cat.color} shadow-lg tracking-wider uppercase flex-shrink-0`}>
                                         {cat.count}
                                     </span>
                                 </div>
                                 
                                 <h2 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all font-sans tracking-tight">
                                     {cat.title}
                                 </h2>
                                 <p className="text-sm text-slate-400/80 group-hover:text-slate-300 transition-colors leading-relaxed line-clamp-3">
                                     {cat.description}
                                 </p>
                             </div>
                             
                             <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-sm mt-auto">
                                 <span className="font-bold text-white/40 group-hover:text-white/90 transition-colors uppercase tracking-wider text-[11px]">Khám phá ngay</span>
                                 <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-r ${cat.color} transition-all duration-300 shadow-lg`}>
                                     <ArrowRight className="w-4 h-4 text-white group-hover:-rotate-45 transition-transform duration-300" />
                                 </div>
                             </div>
                         </Link>
                     ))}
                 </div>

                 {/* Premium Feature Banner */}
                 <div className="mt-16 sm:mt-24 relative w-full rounded-[2.5rem] bg-gradient-to-br from-indigo-900/30 via-slate-900/60 to-purple-900/30 border border-white/10 overflow-hidden group shadow-2xl backdrop-blur-xl">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
                     <div className="absolute -left-64 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full group-hover:bg-blue-400/30 transition-colors duration-1000 pointer-events-none"></div>
                     <div className="absolute -right-64 top-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full group-hover:bg-purple-400/30 transition-colors duration-1000 pointer-events-none"></div>
                     
                     <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                         <div className="max-w-2xl text-center md:text-left">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white mb-6 uppercase tracking-[0.15em] backdrop-blur-md">
                                 <Play className="w-3 h-3 text-blue-400 fill-current" />
                                 Trải Nghiệm Mượt Mà
                             </div>
                             <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-[1.2] tracking-tight">
                                 Không gián đoạn,<br className="hidden sm:block" />
                                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Không quảng cáo.</span>
                             </h3>
                             <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
                                 Hệ thống được tối ưu hóa bằng các công nghệ API hiện đại nhất. Mang lại tốc độ tải trang cực nhanh và giao diện thiết kế độc quyền tạo cảm giác sang trọng.
                             </p>
                         </div>
                         
                         {/* Abstract Animated Decor */}
                         <div className="hidden lg:flex relative w-64 h-64 items-center justify-center flex-shrink-0">
                              <div className="absolute inset-0 border-[3px] border-dashed border-white/10 rounded-full animate-[spin_30s_linear_infinite]"></div>
                              <div className="absolute inset-8 border border-white/20 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 backdrop-blur-3xl animate-[spin_20s_linear_infinite_reverse] shadow-[0_0_40px_rgba(59,130,246,0.3)]"></div>
                              <div className="absolute inset-16 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 flex items-center justify-center">
                                  <Sparkles className="w-12 h-12 text-blue-300 animate-pulse drop-shadow-[0_0_15px_rgba(147,197,253,0.8)]" />
                              </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
}
