import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

// Pages
const LearningDashboard = lazy(() => import('./pages/LearningDashboard'));
const EnglishLearning = lazy(() => import('./pages/EnglishLearning'));
const StudySession = lazy(() => import('./pages/StudySession'));

export default function LearningRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route index element={<LearningDashboard />} />
                <Route path="english" element={<EnglishLearning />} />
                <Route path="study" element={<StudySession />} />
                {/* Add more routes here as needed, e.g., courses, details, etc. */}
            </Routes>
        </Suspense>
    );
}
