import { useState, useEffect, useCallback } from 'react';

const MOVIE_HISTORY_KEY = 'housefim_movie_history';

export const useMovieHistory = (slug) => {
    const [history, setHistory] = useState(() => {
        try {
            const stored = localStorage.getItem(MOVIE_HISTORY_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    });

    const markEpisodeAsWatched = useCallback((movieSlug, episodeName) => {
        if (!movieSlug || !episodeName) return;

        setHistory(prev => {
            const currentHistory = prev[movieSlug] || { watchedEpisodes: [], lastWatched: null };
            const updatedEpisodes = new Set(currentHistory.watchedEpisodes);
            updatedEpisodes.add(episodeName);

            const next = {
                ...prev,
                [movieSlug]: {
                    watchedEpisodes: Array.from(updatedEpisodes),
                    lastWatched: episodeName,
                    timestamp: Date.now()
                }
            };

            localStorage.setItem(MOVIE_HISTORY_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const movieHistory = slug ? (history[slug] || { watchedEpisodes: [], lastWatched: null }) : history;

    return {
        history: movieHistory,
        markEpisodeAsWatched
    };
};
