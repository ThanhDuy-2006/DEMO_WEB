
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Languages, Volume2, Mic2, BookOpen, Star, 
  MessageCircle, Trophy, ChevronRight, Play,
  Brain, Search, CheckCircle2, Clock, 
  Target, Zap, Flame, LayoutList, Type, Headphones,
  Plus, X
} from 'lucide-react';
import vocabularyService from '../../../services/vocabularyService';
import { useToast } from '../../../context/ToastContext';

const EnglishLearning = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_xp: 0, current_streak: 0 });
  const [dailyVocab, setDailyVocab] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [statsRes, vocabRes, leaderRes, progressRes, topicsRes] = await Promise.all([
        vocabularyService.getStreak(),
        vocabularyService.generateQuiz('mixed', 5),
        vocabularyService.getLeaderboard('daily'),
        vocabularyService.getProgress(),
        vocabularyService.getTopics()
      ]);
      
      const userStats = progressRes.data;
      setStats({
        ...statsRes.data,
        total_xp: userStats?.total_xp || 0,
        learned_words: userStats?.learned_words || 0,
        total_words: userStats?.total_words || 0,
        mastered_words: userStats?.mastered_words || 0
      });
      
      setDailyVocab(vocabRes.data.words || []);
      setLeaderboard(leaderRes.data);
      setTopics(topicsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin học tập");
    } finally {
      setLoading(false);
    }
  };

  const studyModes = [
    { id: 'flashcard', name: 'Flashcard', icon: <Star />, color: 'bg-amber-500/10 text-amber-500' },
    { id: 'multiple_choice', name: 'Quiz trắc nghiệm', icon: <Zap />, color: 'bg-blue-500/10 text-blue-500' },
    { id: 'typing', name: 'Gõ từ vựng', icon: <Type />, color: 'bg-purple-500/10 text-purple-500' },
    { id: 'dictation', name: 'Nghe chép chính tả', icon: <Headphones />, color: 'bg-emerald-500/10 text-emerald-500' },
    { id: 'mixed', name: 'Kết hợp (Mixed)', icon: <LayoutList />, color: 'bg-indigo-500/10 text-indigo-500' },
  ];

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await vocabularyService.createTopic(newTopic);
      toast.success("Đã tạo chủ đề mới!");
      setShowTopicModal(false);
      setNewTopic({ name: '', description: '' });
      fetchInitialData();
    } catch (err) {
      toast.error("Không thể tạo chủ đề");
    }
  };

  const handleStartStudy = (mode) => {
    const topicParam = selectedTopic ? `&topicId=${selectedTopic.id}` : '';
    navigate(`/learning/study?mode=${mode}&count=10${topicParam}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Languages className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Học Tiếng Anh</h1>
            <p className="text-slate-400">Cải thiện vốn từ và kỹ năng giao tiếp mỗi ngày.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/40 p-1 rounded-xl border border-white/5">
           <div className="flex items-center gap-4 px-4 py-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500 font-bold">🔥</div>
                 <span className="text-white font-black">{stats.streak || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 font-bold">XP</div>
                 <span className="text-white font-black">{stats.total_xp || 0}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Study Column */}
        <div className="xl:col-span-2 space-y-10">
          
          {/* Topics Selection */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                   <BookOpen className="w-6 h-6 text-primary" /> CHỦ ĐỀ HỌC TẬP
                </h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowTopicModal(true)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <Plus className="w-3 h-3" /> Tạo chủ đề mới
                  </button>
                  <button onClick={() => setSelectedTopic(null)} className={`text-xs font-bold uppercase tracking-widest transition-colors ${!selectedTopic ? 'text-primary' : 'text-slate-500 hover:text-white'}`}>
                    Tất cả từ vựng
                  </button>
                </div>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap border-2 transition-all
                    ${!selectedTopic ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20'}`}
                >
                   Tổng hợp
                </button>
                {topics.map(topic => (
                   <button 
                     key={topic.id}
                     onClick={() => setSelectedTopic(topic)}
                     className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap border-2 transition-all
                       ${selectedTopic?.id === topic.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20'}`}
                   >
                      {topic.name}
                   </button>
                ))}
             </div>
          </div>

          {/* Main Study Modes Grid */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                   <Target className="w-6 h-6 text-primary" /> LÀM BÀI TẬP {selectedTopic ? `[${selectedTopic.name}]` : 'HÔM NAY'}
                </h3>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tiến độ: 0/100%</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {studyModes.map((mode) => (
                   <button 
                     key={mode.id}
                     onClick={() => handleStartStudy(mode.id)}
                     className="flex flex-col items-center gap-4 p-8 bg-slate-800/30 border border-white/5 rounded-[32px] hover:bg-slate-800/60 hover:border-primary/40 transition-all group relative overflow-hidden"
                   >
                     <div className={`w-16 h-16 rounded-2xl ${mode.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ring-4 ring-transparent group-hover:ring-primary/10`}>
                        {React.cloneElement(mode.icon, { className: 'w-8 h-8' })}
                     </div>
                     <span className="font-black text-white text-sm uppercase tracking-wider">{mode.name}</span>
                     <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-primary fill-current" />
                     </div>
                   </button>
                ))}
                <button 
                  onClick={() => handleStartStudy('mixed')}
                  className="bg-gradient-to-br from-primary to-primary-dark p-8 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                >
                   <Flame className="w-10 h-10 text-white animate-bounce" />
                   <span className="text-white font-black text-lg">DAILY GOAL</span>
                </button>
             </div>
          </div>

          {/* Flashcard of the Day */}
          {dailyVocab && dailyVocab.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 rounded-[40px] p-10 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Brain className="w-60 h-60 text-white" />
              </div>
              
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-2 text-primary font-black text-xs tracking-[0.2em] uppercase">
                   <Star className="w-4 h-4 fill-primary" /> TÙ VỰNG NGẪU NHIÊN
                 </div>
                 
                 <div className="space-y-4">
                   <div>
                     <h2 className="text-6xl font-black text-white group-hover:translate-x-2 transition-transform">{dailyVocab[0].word}</h2>
                     <p className="text-primary font-bold mt-1 text-xl">{dailyVocab[0].pronounce}</p>
                   </div>
                   <p className="text-2xl text-slate-300 italic max-w-lg">"{dailyVocab[0].meaning}"</p>
                 </div>

                 <div className="flex items-center gap-4 pt-4">
                   <button className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/10">
                     <Volume2 className="w-6 h-6" /> NGHE PHÁT ÂM
                   </button>
                   <button 
                     onClick={() => navigate(`/learning/study?mode=flashcard&id=${dailyVocab[0].id}`)}
                     className="flex items-center gap-3 bg-slate-900/40 text-white px-8 py-4 rounded-2xl font-black border border-white/10 hover:border-primary transition-all backdrop-blur-sm"
                   >
                      MỞ FLASHCARD
                   </button>
                 </div>
              </div>
            </div>
          )}

          {/* Current Track Info */}
          <div className="bg-slate-800/20 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center">
             <div className="w-32 h-32 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 relative">
                <LayoutList className="w-12 h-12 text-slate-500" />
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">MASTERED</div>
             </div>
             <div className="flex-1 space-y-2 text-center md:text-left">
                <h4 className="text-2xl font-bold text-white">Lộ trình 3000 từ vựng thông dụng</h4>
                <p className="text-slate-500 font-medium">Bạn đã học được 124/3000 từ. Cố gắng lên!</p>
                <div className="h-2 bg-slate-900 rounded-full mt-4 max-w-sm">
                   <div className="h-full bg-primary rounded-full w-[12%]" />
                </div>
             </div>
             <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black transition-all">
                Tiếp tục lộ trình
             </button>
          </div>
        </div>

        {/* Right: Sidebar Column */}
        <div className="space-y-8">
           {/* Achievement Card */}
           <div className="bg-slate-800/40 border border-white/10 rounded-[32px] p-8 space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" /> BXH HÔM NAY
              </h3>
              
              <div className="space-y-4">
                 {leaderboard && leaderboard.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 italic text-sm">Chưa có dữ liệu</div>
                 ) : leaderboard && leaderboard.map((user, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                       <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-black ${i === 0 ? 'text-amber-500' : 'text-slate-500'}`}>{i + 1}</span>
                          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden">
                             {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20" />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white max-w-[100px] truncate">{user.full_name}</p>
                             <p className="text-[10px] text-slate-500 uppercase font-black">{user.score} XP</p>
                          </div>
                       </div>
                       {i === 0 && <span className="text-xl">👑</span>}
                    </div>
                 ))}
              </div>

              <button className="w-full text-center text-primary font-black text-xs uppercase tracking-widest hover:underline transition-all">
                 XEM TẤT CẢ PHÂN HẠNG
              </button>
           </div>

           {/* Quick Stats Panel */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 p-6 rounded-3xl border border-white/5 text-center space-y-2">
                 <Zap className="w-6 h-6 text-blue-400 mx-auto" />
                 <p className="text-[10px] items-center text-slate-500 font-black uppercase">Mastered</p>
                 <p className="text-2xl font-black text-white">{stats.mastered_words || 0}</p>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-3xl border border-white/5 text-center space-y-2">
                 <Languages className="w-6 h-6 text-emerald-400 mx-auto" />
                 <p className="text-[10px] text-slate-500 font-black uppercase">Words</p>
                 <p className="text-2xl font-black text-white">
                    {stats.learned_words || 0}/{stats.total_words || 0}
                 </p>
              </div>
           </div>

           {/* Call to action */}
           <div className="bg-primary/20 border border-primary/30 rounded-[40px] p-8 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 rotate-12">
                 <Mic2 className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                 <h4 className="font-black text-xl text-white">LUYỆN NÓI AI</h4>
                 <p className="text-xs text-slate-400 leading-relaxed px-4">Đánh giá phát âm chuẩn từng âm tiết cùng trợ lỹ ảo AI thông minh.</p>
              </div>
              <button className="w-full bg-white text-slate-900 hover:bg-primary hover:text-white font-black py-4 rounded-2xl transition-all shadow-xl">
                 THỬ THÁCH NGAY
              </button>
           </div>
        </div>
      </div>
      {/* Create Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-primary/10 to-transparent">
                 <h3 className="text-2xl font-black text-white">Chủ đề mới</h3>
                 <button onClick={() => setShowTopicModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateTopic} className="p-8 space-y-6">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tên chủ đề</label>
                    <input 
                      required
                      value={newTopic.name}
                      onChange={e => setNewTopic({...newTopic, name: e.target.value})}
                      placeholder="Ví dụ: IELTS Vocabulary..."
                      className="w-full bg-slate-800/50 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600 font-bold"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mô tả (Tùy chọn)</label>
                    <textarea 
                      value={newTopic.description}
                      onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                      placeholder="Ghi chú về chủ đề này..."
                      className="w-full bg-slate-800/50 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-600 min-h-[100px] resize-none font-medium"
                    />
                 </div>
                 <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                    TẠO CHỦ ĐỀ <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EnglishLearning;
