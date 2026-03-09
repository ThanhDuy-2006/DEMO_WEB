import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, ShieldAlert } from 'lucide-react';

export const ReportModal = ({ targetType, targetId, onClose }) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return toast.warn("Vui lòng nhập lý do");

        setSubmitting(true);
        try {
            await api.post('/moderation/report', {
                target_type: targetType,
                target_id: targetId,
                reason
            });
            toast.success("Báo cáo đã được gửi. Cảm ơn bạn!");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Gửi báo cáo thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-red-500" /> Báo Cáo Vi Phạm
                    </h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-slate-400 text-sm">
                        Hãy cho chúng tôi biết vấn đề với {targetType === 'user' ? 'người dùng' : targetType === 'house' ? 'nhà' : 'sản phẩm'} này.
                    </p>

                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Lý do báo cáo</label>
                        <textarea 
                            className="textarea w-full bg-slate-900 border-slate-700 focus:border-red-500 min-h-[100px]" 
                            placeholder="Mô tả chi tiết vi phạm..." 
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-ghost text-slate-400 hover:text-white">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="btn bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
