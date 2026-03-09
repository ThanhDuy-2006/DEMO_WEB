import React from 'react';
import ComicCard from './ComicCard';

const SkeletonCard = () => (
    <div className="flex flex-col gap-4 animate-pulse">
        <div className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/5" />
        <div className="space-y-2 px-1">
            <div className="h-4 bg-white/10 rounded-lg w-full" />
            <div className="h-4 bg-white/10 rounded-lg w-2/3" />
            <div className="flex gap-2 pt-2">
                <div className="h-3 bg-white/5 rounded-md w-12" />
                <div className="h-3 bg-white/5 rounded-md w-12" />
            </div>
        </div>
    </div>
);

const ComicGrid = ({ comics, loading }) => {
    if (loading && comics.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 sm:gap-8">
                {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (comics.length === 0) {
        return null; // Handle empty state in parent for more flexibility
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {comics.map((comic) => (
                <ComicCard key={comic._id} comic={comic} />
            ))}
            {loading && [...Array(6)].map((_, i) => <SkeletonCard key={`more-${i}`} />)}
        </div>
    );
};

export default ComicGrid;
