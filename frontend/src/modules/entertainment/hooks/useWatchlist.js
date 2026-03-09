
import { useState, useEffect } from 'react';

export const useWatchlist = () => {
    const [watchlist, setWatchlist] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('housefim_watchlist');
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    const toggleWatchlist = (movie) => {
        if (!movie) return;
        
        const index = watchlist.findIndex(item => item.slug === movie.slug);
        let newWatchlist;
        
        if (index === -1) {
            // Simplify movie object for storage
            const movieToSave = {
                id: movie.id || movie._id,
                slug: movie.slug,
                name: movie.name,
                poster_url: movie.poster_url || movie.thumb_url,
                thumb_url: movie.thumb_url,
                year: movie.year,
                quality: movie.quality,
                addedAt: Date.now()
            };
            newWatchlist = [movieToSave, ...watchlist];
        } else {
            newWatchlist = watchlist.filter(item => item.slug !== movie.slug);
        }
        
        setWatchlist(newWatchlist);
        localStorage.setItem('housefim_watchlist', JSON.stringify(newWatchlist));
        return index === -1; // returns true if added, false if removed
    };

    const isInWatchlist = (slug) => {
        return watchlist.some(item => item.slug === slug);
    };

    return { watchlist, toggleWatchlist, isInWatchlist };
};
