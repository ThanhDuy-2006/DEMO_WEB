import React from 'react';
import { Link } from 'react-router-dom';
import { useComicHistory } from '../hooks/useComicHistory';

export const ChapterList = ({ chapters, comicSlug }) => {
    const { history } = useComicHistory(comicSlug);

    if (!chapters || chapters.length === 0) return <div className="text-slate-500 italic p-10 text-center">Không có chương nào.</div>;

    // The API structure for chapters is usually data.item.chapters[0].server_data
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {chapters.map((chap) => {
                const isRead = history?.readChapters?.includes(chap.chapter_name);
                const isLastRead = history?.lastRead === chap.chapter_name;

                return (
                <Link
                    key={chap.chapter_name}
                    to={`/entertainment/comics/${comicSlug}/chapter/${chap.chapter_name}`}
                    state={{ chapterApi: chap.chapter_api_data }}
                    className={`relative p-3 border rounded-xl text-center text-sm transition-all group overflow-hidden ${
                        isLastRead 
                        ? 'bg-purple-900/30 border-purple-500/50 text-white shadow-lg shadow-purple-500/10 hover:bg-purple-600'
                        : isRead 
                            ? 'bg-slate-800/30 border-white/5 text-slate-500 hover:bg-slate-800 hover:text-slate-300' 
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-primary/20 hover:border-primary/50 hover:text-white'
                    }`}
                >
                    {isLastRead && (
                        <div className="absolute top-0 right-0 bg-purple-500 text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-bl-lg">
                            Đang đọc
                        </div>
                    )}
                    <div className="font-bold relative z-10 flex flex-col items-center gap-1">
                        Chương {chap.chapter_name}
                        {isRead && !isLastRead && (
                            <span className="text-[10px] items-center gap-1 flex bg-slate-900 px-2 py-0.5 rounded-full text-green-500/70 border border-green-500/20 uppercase tracking-tighter">
                                Đã xem
                            </span>
                        )}
                    </div>
                    <div className={`text-[10px] mt-1.5 line-clamp-1 relative z-10 ${
                        isLastRead ? 'text-purple-200' : isRead ? 'text-slate-600' : 'text-slate-400 group-hover:text-primary-light'
                    }`}>
                        {chap.chapter_title || 'Mới'}
                    </div>
                </Link>
                );
            })}
        </div>
    );
};
