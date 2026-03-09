import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  TrendingUp, 
  Code, 
  Database, 
  Cpu, 
  Layout as LayoutIcon, 
  Search,
  Star,
  Users,
  ChevronRight,
  Languages
} from 'lucide-react';

const LearningDashboard = () => {
  const stats = [
    { label: "Giờ học", value: "48h", icon: <Clock className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/10" },
    { label: "Khóa học", value: "12", icon: <BookOpen className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/10" },
    { label: "Chứng chỉ", value: "3", icon: <Award className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/10" },
    { label: "Điểm GP", value: "850", icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/10" },
  ];

  const categories = [
    { name: "Tiếng Anh", icon: <Languages className="w-6 h-6" />, count: "12 khóa", color: "from-blue-600 to-indigo-500", path: "/learning/english" },
    { name: "Frontend", icon: <LayoutIcon className="w-6 h-6" />, count: "45 khóa", color: "from-blue-500 to-cyan-400" },
    { name: "Backend", icon: <Database className="w-6 h-6" />, count: "32 khóa", color: "from-purple-500 to-indigo-400" },
    { name: "AI & ML", icon: <Cpu className="w-6 h-6" />, count: "18 khóa", color: "from-rose-500 to-pink-400" },
  ];

  const continueLearning = [
    { 
      title: "React Modern Mastery 2024", 
      instructor: "Trần Thế Duy", 
      progress: 75, 
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
      nextLesson: "Custom Hooks Deep Dive"
    },
    { 
      title: "Node.js Architecture", 
      instructor: "Nguyễn Văn A", 
      progress: 40, 
      image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=60",
      nextLesson: "Event Loop Fundamentals"
    }
  ];

  const recommendedCourses = [
    {
      title: "UI/UX Design Essentials",
      instructor: "Lê Thị B",
      rating: 4.9,
      students: "1.2k",
      price: "Miễn phí",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60"
    },
    {
      title: "Next.js 14 Fullstack App",
      instructor: "Phạm Văn C",
      rating: 4.8,
      students: "850",
      price: "199k",
      image: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=800&auto=format&fit=crop&q=60"
    },
    {
      title: "Python for Data Science",
      instructor: "Hoàng Minh D",
      rating: 4.7,
      students: "2.1k",
      price: "Miễn phí",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60"
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Học Tập & Phát Triển</h1>
          <p className="text-slate-400 mt-1">Nâng tầm kỹ năng của bạn mỗi ngày cùng HouseMarket.</p>
        </div>
        
        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm khóa học, kỹ năng..." 
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Hero Section / English Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-500/20">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold w-fit backdrop-blur-md">
                 <Languages className="w-4 h-4" /> 
                 <span>CHƯƠNG TRÌNH MỚI</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-black leading-tight">Luyện Tiếng Anh Cùng Trợ Lý AI</h2>
               <p className="text-blue-100 text-lg opacity-90">Cải thiện phát âm, mở rộng vốn từ vựng và tự tin giao tiếp chỉ với 15 phút mỗi ngày.</p>
               <Link to="/learning/english" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0">
                  Bắt đầu học ngay <Play className="w-4 h-4 fill-current" />
               </Link>
            </div>
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
               <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
               <div className="absolute inset-4 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
               <Languages className="w-24 h-24 md:w-32 md:h-32 text-white relative z-10 drop-shadow-2xl" />
            </div>
         </div>
         {/* Decorative elements */}
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-800/30 border border-white/5 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4 hover:border-white/20 transition-all cursor-default">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Continue Learning */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" /> Tiếp tục học
            </h2>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              Tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continueLearning.map((course, idx) => (
              <div key={idx} className="bg-slate-800/40 border border-white/10 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all">
                <div className="relative h-40 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold bg-primary/90 text-white px-2 py-0.5 rounded-full uppercase">Đang học</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-sm text-slate-400">Bài kế tiếp: {course.nextLesson}</p>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Tiến độ</span>
                      <span className="text-primary font-bold">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Section */}
          <div className="space-y-6 pt-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Khóa học gợi ý</h2>
                <button className="text-sm text-slate-400 hover:text-white transition-colors">Theo sở thích</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedCourses.map((course, idx) => (
                   <div key={idx} className="bg-slate-800/20 border border-white/5 rounded-xl overflow-hidden hover:bg-slate-800/40 hover:border-white/10 transition-all group">
                      <div className="h-32 relative">
                         <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                         <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                            {course.price}
                         </div>
                      </div>
                      <div className="p-3 space-y-2">
                         <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                         <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.students} học viên</span>
                            <span className="flex items-center gap-1 text-yellow-500/80"><Star className="w-3 h-3 fill-yellow-500/80" /> {course.rating}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Categories & Mentors */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Chủ đề phổ biến</h2>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat, idx) => (
                <Link 
                  key={idx} 
                  to={cat.path || "#"}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all block"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg`}>
                        {cat.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{cat.name}</h3>
                        <p className="text-xs text-slate-500">{cat.count}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
             <div className="relative z-10 space-y-4">
                <h3 className="text-lg font-bold">Trở thành Mentor?</h3>
                <p className="text-sm text-indigo-100 opacity-90">Chia sẻ kiến thức của bạn và nhận những phần thưởng hấp dẫn từ cộng đồng.</p>
                <button className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg">
                   Đăng ký ngay
                </button>
             </div>
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
