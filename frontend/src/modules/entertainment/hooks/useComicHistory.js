import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'housefim_comic_history';

export const useComicHistory = (slug) => {
    // Return history for a specific slug. If no slug provided, return full history.
    const [history, setHistory] = useState(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    });

    const markChapterAsRead = useCallback((comicSlug, chapterNum) => {
        if (!comicSlug || !chapterNum) return;

        setHistory(prev => {
            const currentComicHistory = prev[comicSlug] || { readChapters: [], lastRead: null };
            const updatedReadChapters = new Set(currentComicHistory.readChapters);
            updatedReadChapters.add(chapterNum);

            const next = {
                ...prev,
                [comicSlug]: {
                    readChapters: Array.from(updatedReadChapters),
                    lastRead: chapterNum
                }
            };

            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const comicHistory = slug ? (history[slug] || { readChapters: [], lastRead: null }) : history;

    return {
        history: comicHistory,
        markChapterAsRead
    };
};
