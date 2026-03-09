import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmConfig, setConfirmConfig] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmConfig({
                message,
                resolve,
                title: options.title || "Xác nhận",
                confirmLabel: options.confirmLabel || "Đồng ý",
                cancelLabel: options.cancelLabel || "Hủy"
            });
        });
    }, []);

    const handleConfirmClose = (result) => {
        if (confirmConfig) {
            confirmConfig.resolve(result);
            setConfirmConfig(null);
        }
    };

    const success = (msg, dur) => showToast(msg, 'success', dur);
    const error = (msg, dur) => showToast(msg, 'error', dur);
    const info = (msg, dur) => showToast(msg, 'info', dur);
    const warn = (msg, dur) => showToast(msg, 'warn', dur);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warn, confirm }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed top-5 right-5 z-[1000000] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmConfig && (
                <div className="fixed inset-0 z-[1000001] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => handleConfirmClose(false)}></div>
                    <div className="relative bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-modal-in overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                        <div className="flex flex-col items-center text-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{confirmConfig.title}</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">{confirmConfig.message}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleConfirmClose(false)}
                                className="flex-1 py-4 px-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-2xl transition-all border border-white/5"
                            >
                                {confirmConfig.cancelLabel}
                            </button>
                            <button 
                                onClick={() => handleConfirmClose(true)}
                                className="btn-premium flex-1 !py-4"
                            >
                                {confirmConfig.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-primary" size={24} />,
        error: <AlertCircle className="text-destructive" size={24} />,
        info: <Info className="text-accent" size={24} />,
        warn: <AlertTriangle className="text-orange-400" size={24} />,
    };

    const borders = {
        success: 'border-primary/30',
        error: 'border-destructive/30',
        info: 'border-accent/30',
        warn: 'border-orange-400/30',
    };

    return (
        <div className={`
            flex items-center gap-4 px-6 py-5 rounded-2xl border backdrop-blur-2xl shadow-2xl 
            animate-modal-in pointer-events-auto min-w-[320px] max-w-md bg-black/40
            ${borders[toast.type]}
        `}>
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 font-bold text-white text-sm leading-relaxed">{toast.message}</div>
            <button 
                onClick={onClose}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
