import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Shield, Check, X, AlertTriangle, Eye, Clock, Search } from 'lucide-react';

const Moderation = () => {
    const [reports, setReports] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const toast = useToast();

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/moderation/reports`, { params: { status, page, limit: 10 } });
            setReports(res.data);
            setTotalPages(Math.ceil(res.pagination.total / 10));
        } catch (error) {
            console.error("Fetch reports error", error);
            if (error.message.includes("Admin access required") || error.message.includes("Forbidden")) {
                 toast.error("Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP LẠI để cập nhật quyền Admin!");
            } else {
                 toast.error("Không thể tải danh sách báo cáo");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [status, page]);

    const handleResolve = async (id, action) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'approve' ? 'CHẤP THUẬN' : 'TỪ CHỐI'} báo cáo này?`)) return;

        try {
            await api.put(`/moderation/reports/${id}/resolve`, { action });
            toast.success(`Đã ${action === 'approve' ? 'chấp thuận' : 'từ chối'} báo cáo`);
            fetchReports(); // Refresh
        } catch (error) {
            console.error("Resolve error", error);
            toast.error("Xử lý thất bại");
        }
    };

    const StatusTab = ({ value, label, icon: Icon, color }) => (
        <button 
            onClick={() => { setStatus(value); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2
                ${status === value 
                    ? `bg-[#1e293b] text-${color}-400 border-${color}-500 shadow-lg shadow-${color}-500/10` 
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                }`}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0b1020] text-slate-200 p-6 md:p-10 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-red-500" size={32} />
                        Trung Tâm Kiểm Duyệt
                    </h1>
                    <p className="text-slate-400 mt-2">Xử lý báo cáo vi phạm từ người dùng</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-0 border-b border-slate-800">
                <StatusTab value="pending" label="Chờ Xử Lý" icon={Clock} color="yellow" />
                <StatusTab value="approved" label="Đã Chấp Thuận" icon={Check} color="emerald" />
                <StatusTab value="rejected" label="Đã Từ Chối" icon={X} color="slate" />
            </div>

            {/* Content Area */}
            <div className="bg-[#1e293b] rounded-b-2xl shadow-xl min-h-[500px] relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider border-b border-slate-700">
                                <th className="p-4 font-semibold">Ngày Báo Cáo</th>
                                <th className="p-4 font-semibold">Người Báo Cáo</th>
                                <th className="p-4 font-semibold">Đối Tượng</th>
                                <th className="p-4 font-semibold w-1/3">Lý Do</th>
                                {status === 'pending' && <th className="p-4 font-semibold text-right">Hành Động</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {reports.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-slate-500 italic">
                                        Không có báo cáo nào ở trạng thái này.
                                    </td>
                                </tr>
                            ) : (
                                reports.map(r => (
                                    <tr key={r.id} className="hover:bg-white/5 transition group">
                                        <td className="p-4 text-slate-400 text-sm">
                                            {new Date(r.created_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {r.reporter_name || `User #${r.reporter_id}`}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                ${r.target_type === 'user' ? 'bg-blue-500/20 text-blue-400' : 
                                                  r.target_type === 'product' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}
                                            `}>
                                                {r.target_type}
                                            </span>
                                            <span className="ml-2 text-xs text-slate-500">#{r.target_id}</span>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            <p className="line-clamp-2 md:line-clamp-none bg-black/20 p-2 rounded border border-white/5 text-sm">
                                                {r.reason}
                                            </p>
                                        </td>
                                        {status === 'pending' && (
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => handleResolve(r.id, 'approve')}
                                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all text-sm font-bold border border-red-500/20"
                                                    title="Chấp thuận báo cáo (Xử phạt đối tượng)"
                                                >
                                                    <AlertTriangle size={16} className="inline mr-1" /> Chặn/Xóa
                                                </button>
                                                <button 
                                                    onClick={() => handleResolve(r.id, 'reject')}
                                                    className="px-3 py-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-all text-sm font-bold"
                                                    title="Bác bỏ báo cáo (Không vi phạm)"
                                                >
                                                    <X size={16} className="inline mr-1" /> Bỏ Qua
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-800">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p-1)}
                            className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50 hover:bg-slate-700"
                        >
                            Previous
                        </button>
                        <span className="text-slate-400">Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p+1)}
                            className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50 hover:bg-slate-700"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Moderation;
