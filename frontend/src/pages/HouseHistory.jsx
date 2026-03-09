import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function HouseHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("purchases"); // 'purchases' | 'excel'
    const [transactions, setTransactions] = useState([]);
    const [excelHistory, setExcelHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [house, setHouse] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const h = await api.get(`/houses/${id}`);
            setHouse(h);
            
            const [transRes, excelRes] = await Promise.all([
                api.get(`/products/house/${id}/transactions`),
                h.type === 'excel' ? api.get(`/houses-excel/${id}/history`) : Promise.resolve([])
            ]);
            
            setTransactions(Array.isArray(transRes) ? transRes : []);
            setExcelHistory(Array.isArray(excelRes) ? excelRes : []);
            
            if (h.type === 'excel') {
                setActiveTab('excel');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#6d5dfc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="animate-pulse font-bold text-slate-400">Đang tải lịch sử Nhà...</p>
            </div>
        </div>
    );

    const filteredTransactions = transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const filteredExcel = excelHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="min-h-screen bg-[#0b1220] text-white p-6 animate-fade-in relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at 10% 10%, #1b2a4a, #0b1220 70%)' }}></div>
            
            <div className="relative z-10 max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 mt-4">
                    <div>
                        <button onClick={() => navigate(`/houses/${id}`)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-3 transition-all hover:-translate-x-1 font-bold text-xs uppercase tracking-widest">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Quay lại Nhà
                        </button>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                            Lịch sử Nhà <br/> 
                            <span className="text-[#6d5dfc] text-glow">{house?.name}</span>
                        </h1>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
                        <button 
                            onClick={() => setActiveTab('excel')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'excel' ? 'bg-[#6d5dfc] text-white shadow-lg shadow-[#6d5dfc]/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            ⚡ Hoạt động Excel
                        </button>
                        <button 
                            onClick={() => setActiveTab('purchases')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'purchases' ? 'bg-[#6d5dfc] text-white shadow-lg shadow-[#6d5dfc]/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            📦 Giao dịch Mua hàng
                        </button>
                    </div>
                </header>

                <div className="bg-black/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md shadow-inner min-h-[60vh]">
                    {activeTab === 'purchases' ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-1.5 h-6 bg-[#6d5dfc] rounded-full"></div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Chi tiết giao dịch kho</h2>
                            </div>
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-32 opacity-30 flex flex-col items-center gap-4">
                                    <span className="text-6xl">📥</span>
                                    <p className="font-bold uppercase tracking-widest">Chưa có giao dịch mua hàng nào được ghi lại</p>
                                </div>
                            )}
                            {filteredTransactions.map(t => (
                                <div key={t.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#6d5dfc]/30 hover:bg-white/[0.08] transition-all group cursor-default">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">🛍️</div>
                                        <div>
                                            <div className="text-base">
                                                <span className="font-black text-white">{t.buyer_name}</span>
                                                <span className="text-slate-500 mx-2 font-medium">{t.type === 'REFUND' ? 'đã được hoàn tiền' : 'đã mua đơn hàng'}</span>
                                                <span className="text-[#6d5dfc] font-black text-glow-sm">{t.product_name || t.description}</span>
                                                <span className="ml-2 px-2 py-0.5 rounded-lg bg-[#6d5dfc]/10 text-[#6d5dfc] text-[10px] font-black border border-[#6d5dfc]/20">x{t.quantity || 1}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{new Date(t.created_at).toLocaleString('vi-VN')}</div>
                                                <div className="text-[9px] text-[#6d5dfc] font-black uppercase tracking-tighter">ID: #{String(t.id).slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t border-white/5 pt-4 md:pt-0 md:border-none">
                                        <div className="flex flex-col items-end">
                                            <div className={`text-xl font-black ${t.type === 'REFUND' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === 'REFUND' ? '+' : '-'}{Number(t.total_price).toLocaleString()}đ
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Thanh toán ví</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 group-hover:border-[#6d5dfc]/50 group-hover:text-[#6d5dfc] transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Nhật ký hoạt động Excel</h2>
                            </div>
                            {filteredExcel.length === 0 && (
                                <div className="text-center py-32 opacity-30 flex flex-col items-center gap-4">
                                    <span className="text-6xl">⚡</span>
                                    <p className="font-bold uppercase tracking-widest">Hiện tại chưa có ghi nhận hoạt động nào</p>
                                </div>
                            )}
                            {filteredExcel.map(h => (
                                <div key={h.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.08] transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">⚡</div>
                                        <div>
                                            <div className="text-base">
                                                <span className="font-black text-white">{h.user_name}</span>
                                                <span className="text-slate-500 mx-2 font-medium">
                                                    {h.action === 'check' ? 'đã tích chọn sản phẩm' : h.action === 'uncheck' ? 'đã bỏ chọn mục' : h.action === 'create_item' ? 'vừa thêm mới mục' : h.action === 'update_item' ? 'đã chỉnh sửa mục' : 'đã xóa mục'}
                                                </span>
                                                <span className="text-emerald-400 font-black">{h.item_name}</span>
                                                {h.target_user_name && (
                                                    <span className="ml-2 px-2 py-0.5 rounded bg-white/5 text-[11px] text-slate-400 border border-white/5">
                                                        dành cho <span className="text-slate-200 font-bold">{h.target_user_name}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{new Date(h.created_at).toLocaleString('vi-VN')}</div>
                                                <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${h.role === 'owner' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{h.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex items-center justify-end w-full md:w-auto">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Decor Elements */}
            <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#6d5dfc]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed top-[20%] left-[-10%] w-[30%] h-[30%] bg-[#4fd1c5]/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
    );
}
