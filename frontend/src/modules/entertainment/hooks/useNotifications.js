
import { useState, useEffect, useCallback } from 'react';
import { ophimService } from '../services/ophimApi';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('housefim_notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotifications(parsed);
                setUnreadCount(parsed.filter(n => !n.read).length);
            } catch (e) {
                console.error("Failed to parse notifications", e);
            }
        }
    }, []);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('housefim_notifications', JSON.stringify(notifications));
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const checkUpdates = useCallback(async (watchlist) => {
        if (!watchlist || watchlist.length === 0) return;

        // Load the last known episode states to detect changes
        const savedStates = localStorage.getItem('housefim_episode_states');
        let episodeStates = {};
        try {
            if (savedStates) episodeStates = JSON.parse(savedStates);
        } catch (e) {}

        const newNotifications = [];
        const updatedStates = { ...episodeStates };

        // Check only a few at a time to avoid spamming the API
        // For simplicity, we check the whole list but we could limit this
        const checkLimit = 10; 
        const moviesToCheck = watchlist.slice(0, checkLimit);

        for (const movie of moviesToCheck) {
            try {
                const res = await ophimService.getMovieDetail(movie.slug);
                if (res.success && res.data && res.data.item) {
                    const currentMovie = res.data.item;
                    const lastKnownEpisode = episodeStates[movie.slug];

                    // If we have a record and the episode has increased
                    if (lastKnownEpisode && currentMovie.episode_current !== lastKnownEpisode) {
                        // Avoid duplicate notifications for the same new episode
                        const alreadyNotified = notifications.some(
                            n => n.movieSlug === movie.slug && n.episode === currentMovie.episode_current
                        );

                        if (!alreadyNotified) {
                            newNotifications.push({
                                id: Date.now() + Math.random(),
                                movieSlug: movie.slug,
                                movieName: movie.name,
                                poster: movie.poster_url || movie.thumb_url,
                                message: `Đã có tập mới: ${currentMovie.episode_current}`,
                                episode: currentMovie.episode_current,
                                timestamp: Date.now(),
                                read: false
                            });
                        }
                    }
                    
                    // Always update the state to the latest
                    updatedStates[movie.slug] = currentMovie.episode_current;
                }
            } catch (err) {
                console.error(`Error checking update for ${movie.slug}`, err);
            }
        }

        if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)); // Keep last 50
        }

        localStorage.setItem('housefim_episode_states', JSON.stringify(updatedStates));
    }, [notifications]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return { notifications, unreadCount, checkUpdates, markAllAsRead, clearNotifications };
};
