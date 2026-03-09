
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  X, Check, ChevronRight, HelpCircle, Volume2, 
  RotateCcw, Trophy, Brain, Gamepad2, Timer,
  CheckCircle2, AlertCircle, PlayCircle
} from 'lucide-react';
import vocabularyService from '../../../services/vocabularyService';
import { useToast } from '../../../context/ToastContext';

const StudySession = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'mixed';
  const count = parseInt(searchParams.get('count')) || 10;
  const topicId = searchParams.get('topicId') || '';

  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sessionId, setSessionId] = useState(null);
  
  // Quiz specific states
  const [selectedOption, setSelectedOption] = useState(null);
  const [typingInput, setTypingInput] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [matchingPairs, setMatchingPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      setLoading(true);
      const res = await vocabularyService.generateQuiz(mode, count, topicId);
      const { words: fetchedWords, sessionId: sid } = res.data;
      if (!fetchedWords || fetchedWords.length === 0) {
         toast.error("Không có từ nào để học trong chủ đề này!");
         navigate('/learning/english');
         return;
      }
      setWords(fetchedWords);
      setSessionId(sid);
      setStartTime(Date.now());
    } catch (err) {
      toast.error("Không thể tải bài học");
      navigate('/learning/english');
    } finally {
      setLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord && (mode === 'multiple_choice' || mode === 'mixed' || mode === 'matching')) {
      const otherWords = words.filter(w => w.id !== currentWord.id);
      const randomOptions = otherWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.meaning);
      setOptions([...randomOptions, currentWord.meaning].sort(() => 0.5 - Math.random()));
    }
  }, [currentIndex, currentWord, mode]);

  const handleNext = (isCorrect) => {
    const timeTaken = Date.now() - startTime;
    const newResult = {
      vocabId: currentWord.id,
      isCorrect,
      timeMs: timeTaken
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setTypingInput('');
      setIsFlipped(false);
      setShowAnswer(false);
      setStartTime(Date.now());
    } else {
      finishSession(updatedResults);
    }
  };

  const finishSession = async (finalResults) => {
    try {
      setLoading(true);
      const res = await vocabularyService.submitQuiz({
        sessionId,
        mode,
        results: finalResults
      });
      setIsCompleted(true);
      setResults(res.data.data); 
    } catch (err) {
      toast.error("Lỗi khi nộp bài");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isCompleted) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Đang chuẩn bị bài học...</p>
    </div>
  );

  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto p-4 py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
         <div className="relative">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 relative">
               <Trophy className="w-16 h-16 text-primary" />
               <div className="absolute inset-0 border-2 border-primary/50 rounded-full animate-ping opacity-20" />
            </div>
         </div>
         
         <div className="space-y-2">
            <h2 className="text-4xl font-black text-white">Tuyệt vời!</h2>
            <p className="text-slate-400 font-medium">Bạn đã hoàn thành bài học hôm nay.</p>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-white/5 p-6 rounded-3xl">
               <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">XP Nhận được</p>
               <p className="text-4xl font-black text-primary">+{results?.xp_earned || 0}</p>
            </div>
            <div className="bg-slate-800/40 border border-white/5 p-6 rounded-3xl">
               <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Độ chính xác</p>
               <p className="text-4xl font-black text-white">
                 {results?.total ? Math.round((results.correct / results.total) * 100) : 0}%
               </p>
            </div>
         </div>

         <div className="bg-slate-800/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500">🔥</div>
               <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Streak Hiện tại</p>
                  <p className="text-white font-bold">{results?.current_streak || 0} ngày</p>
               </div>
            </div>
            <button onClick={() => navigate('/learning/english')} className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2 rounded-xl transition-all">
               Tiếp tục
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8 h-full flex flex-col pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/learning/english')} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 mx-8 h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 rounded-full" 
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-black text-xs font-mono">
           <span className="text-white">{currentIndex + 1}</span> / {words.length}
        </div>
      </div>

      {/* Main Study Area */}
      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {(mode === 'flashcard' || (mode === 'mixed' && currentIndex % 5 === 0)) ? (
           <div 
             onClick={() => setIsFlipped(!isFlipped)}
             className={`w-full max-w-lg aspect-[5/4] relative cursor-pointer group [perspective:1000px]`}
           >
              <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                 <div className="absolute inset-0 bg-slate-800/40 border-2 border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-6 p-8 [backface-visibility:hidden]">
                    <h2 className="text-6xl font-black text-white tracking-tight">{currentWord?.word}</h2>
                    <p className="text-primary font-bold text-xl">{currentWord?.pronounce}</p>
                    <div className="mt-8 flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                       <HelpCircle className="w-4 h-4" /> Nhấp để xem nghĩa
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-primary/10 border-2 border-primary/20 rounded-[40px] flex flex-col items-center justify-center gap-8 p-12 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="text-center space-y-2">
                       <p className="text-xs text-primary font-black uppercase tracking-widest">Ý nghĩa</p>
                       <h3 className="text-4xl font-black text-white">{currentWord?.meaning}</h3>
                    </div>
                    <div className="text-center space-y-2 bg-white/5 p-6 rounded-3xl w-full">
                       <p className="text-[10px] text-slate-500 uppercase font-black">Ví dụ</p>
                       <p className="text-slate-200 italic font-medium leading-relaxed">"{currentWord?.example_sentence}"</p>
                    </div>
                 </div>
              </div>
           </div>
        ) : (mode === 'multiple_choice' || mode === 'mixed' || (mode === 'matching' && currentIndex % 5 === 1)) ? (
           <div className="w-full max-w-2xl space-y-12 text-center">
              <div className="space-y-4">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Chọn nghĩa đúng của từ</p>
                 <h2 className="text-6xl font-black text-white">{currentWord?.word}</h2>
                 <p className="text-primary font-bold text-xl">{currentWord?.pronounce}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {options.map((opt, i) => (
                   <button 
                     key={i}
                     onClick={() => {
                        setSelectedOption(opt);
                        setTimeout(() => handleNext(opt === currentWord.meaning), 500);
                     }}
                     className={`p-6 rounded-3xl font-bold text-lg text-left transition-all border-2 border-white/5 flex items-center justify-between group
                        ${selectedOption === opt 
                           ? (opt === currentWord.meaning ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-red-500/20 border-red-500 text-red-500')
                           : 'bg-slate-800/30 hover:border-primary/50 text-slate-300 hover:text-white'
                        }`}
                   >
                     {opt}
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${selectedOption === opt ? 'border-current' : 'border-white/10 group-hover:border-primary/50'}`}>
                        {selectedOption === opt && (opt === currentWord.meaning ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)}
                     </div>
                   </button>
                 ))}
              </div>
           </div>
        ) : (mode === 'typing' || (mode === 'mixed' && currentIndex % 5 === 2)) ? (
           <div className="w-full max-w-xl space-y-12 text-center">
              <div className="space-y-4">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Dịch từ này sang tiếng Anh</p>
                 <h2 className="text-5xl font-black text-white">{currentWord?.meaning}</h2>
              </div>

              <div className="relative group">
                 <input 
                   autoFocus
                   value={typingInput}
                   onChange={e => setTypingInput(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && typingInput.trim()) {
                       handleNext(typingInput.toLowerCase().trim() === currentWord.word.toLowerCase().trim());
                     }
                   }}
                   placeholder="Nhập từ tiếng Anh..."
                   className="w-full bg-slate-800/50 border-2 border-white/10 rounded-[30px] px-10 py-6 text-3xl font-black text-center text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-700"
                 />
              </div>
           </div>
        ) : (mode === 'dictation' || (mode === 'mixed' && currentIndex % 5 === 3)) ? (
           <div className="w-full max-w-xl space-y-12 text-center">
              <div className="space-y-4">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Nghe và viết lại từ</p>
                 <div 
                   onClick={() => {
                      const audio = new Audio(currentWord?.audio_url || `https://api.dictionaryapi.dev/media/pronunciations/en/${currentWord.word.toLowerCase()}-us.mp3`);
                      audio.play();
                   }}
                   className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:scale-110 transition-transform shadow-xl shadow-primary/20"
                 >
                    <Volume2 className="w-10 h-10 text-primary" />
                 </div>
              </div>

              <div className="relative group">
                 <input 
                   autoFocus
                   value={typingInput}
                   onChange={e => setTypingInput(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && typingInput.trim()) {
                       handleNext(typingInput.toLowerCase().trim() === currentWord.word.toLowerCase().trim());
                     }
                   }}
                   placeholder="Bạn nghe được gì?"
                   className="w-full bg-slate-800/50 border-2 border-white/10 rounded-[30px] px-10 py-6 text-3xl font-black text-center text-white focus:outline-none focus:border-primary transition-all"
                 />
              </div>
           </div>
        ) : (mode === 'matching' || (mode === 'mixed' && currentIndex % 5 === 4)) ? (
           <div className="w-full max-w-4xl space-y-8">
              <div className="text-center space-y-2">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Nối từ với nghĩa đúng</p>
                 <h2 className="text-2xl font-black text-white">Thử thách nối từ</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-12 pt-8">
                 <div className="space-y-4">
                    <div className="p-6 bg-slate-800/40 border-2 border-primary rounded-3xl font-black text-2xl text-center text-white">
                       {currentWord?.word}
                    </div>
                 </div>
                 <div className="space-y-4">
                    {options.map((opt, i) => (
                       <button 
                         key={i}
                         onClick={() => handleNext(opt === currentWord.meaning)}
                         className="w-full p-6 bg-slate-800/30 border-2 border-white/5 hover:border-primary rounded-3xl font-bold text-center text-slate-300 hover:text-white"
                       >
                          {opt}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        ) : null}

      </div>

      <div className="h-24 flex items-center justify-between border-t border-white/5 px-4">
         {mode === 'flashcard' ? (
           <div className="w-full flex gap-4">
              <button onClick={() => handleNext(false)} className="flex-1 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 border border-white/5 font-black py-4 rounded-2xl transition-all">CHƯA NHỚ</button>
              <button onClick={() => handleNext(true)} className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20">ĐÃ NHỚ</button>
           </div>
         ) : (
           <div className="w-full flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-2">
                 <button className="p-3 hover:bg-white/5 rounded-full transition-colors">
                    <Volume2 className="w-5 h-5 text-primary" />
                 </button>
                 <span className="text-[10px] uppercase font-black tracking-widest">Nghe lại từ</span>
              </div>
              
              <button 
                disabled={(mode === 'typing' || mode === 'dictation') && !typingInput.trim()}
                onClick={() => {
                   if (mode === 'typing' || mode === 'dictation') {
                     handleNext(typingInput.toLowerCase().trim() === currentWord.word.toLowerCase().trim());
                   }
                }}
                className="group flex items-center gap-3 bg-white text-slate-900 px-10 py-4 rounded-[20px] font-black hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500"
              >
                 TIẾP THEO <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
         )}
      </div>
    </div>
  );
};

export default StudySession;
