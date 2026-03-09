
import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0b1020]">
                <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1020] text-white p-4 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-3xl font-bold mb-2">Truy cập bị từ chối</h1>
                <p className="text-slate-400 mb-6">Bạn không có quyền truy cập trang này.</p>
                <div className="flex gap-4">
                    <button className="btn btn-primary" onClick={() => window.history.back()}>Quay lại</button>
                    <a href="/" className="btn btn-ghost">Về trang chủ</a>
                </div>
            </div>
        );
    }

    return children;
};

export default AdminRoute;
