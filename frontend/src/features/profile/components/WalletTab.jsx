import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useSocket } from '../../../context/SocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

export const WalletTab = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { socket } = useSocket();
    const [wallet, setWallet] = useState(null);
    const [stats, setStats] = useState([]);
    const [depositRequests, setDepositRequests] = useState([]);
    const [depositAmount, setDepositAmount] = useState("");
    const [targetEmail, setTargetEmail] = useState("");
    const [method, setMethod] = useState("BANK_TRANSFER");
    const [proof, setProof] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => init();
        socket.on("walletUpdated", handleUpdate);
        return () => socket.off("walletUpdated", handleUpdate);
    }, [socket]);

    const init = async () => {
        setLoading(true);
        try {
            const [w, s, d] = await Promise.all([
                api.get("/wallets"),
                api.get("/wallets/stats"),
                api.get("/deposits/my-requests")
            ]);
            setWallet(w);
            setStats(s || []);
            setDepositRequests(d || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const rawAmount = parseInt(depositAmount.replace(/\./g, ''));
            if (user?.role === 'admin') {
                await api.post("/wallets/admin-deposit", { email: targetEmail, amount: rawAmount });
                toast.success("Nạp tiền thành công (Admin)");
                setTargetEmail("");
                setDepositAmount("");
            } else {
                const formData = new FormData();
                formData.append('amount', rawAmount);
                formData.append('method', method);
                if (proof) formData.append('proof', proof);
                await api.post("/deposits/request", formData);
                toast.success("Đã gửi yêu cầu nạp tiền");
                setDepositAmount("");
                setProof(null);
            }
            init();
        } catch (err) {
            toast.error(err.message || "Gửi yêu cầu thất bại");
        } finally {
            setLoading(false);
        }
    };

    if (!wallet) return <div className="p-10 text-center text-slate-400">Đang tải dữ liệu ví...</div>;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-saas !p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Số dư hiện tại</p>
                    <h2 className="text-4xl font-black text-white">{formatMoney(wallet.balance)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Đang hoạt động
                    </div>
                </div>

                <div className="card-saas !p-6 h-64">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Thống kê 30 ngày</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                            <defs>
                                <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="day" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => val ? val.split('-').slice(1).join('/') : ''}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                formatter={(val) => [formatMoney(val), ""]}
                            />
                            <Bar 
                                name="Nạp tiền"
                                dataKey="total_deposit" 
                                fill="url(#colorDeposit)" 
                                radius={[6, 6, 0, 0]} 
                                isAnimationActive={true}
                                animationDuration={1500}
                                maxBarSize={30}
                            />
                            <Bar 
                                name="Chi tiêu"
                                dataKey="total_spent" 
                                fill="url(#colorSpent)" 
                                radius={[6, 6, 0, 0]} 
                                isAnimationActive={true}
                                animationDuration={1500}
                                animationBegin={300}
                                maxBarSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Deposit Form */}
            <div className="card-saas !p-8">
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Nạp tiền vào tài khoản</h3>
                <form onSubmit={handleDeposit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user?.role === 'admin' && (
                        <div className="form-control">
                            <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email người nhận</span></label>
                            <input 
                                type="email" 
                                className="input-modern" 
                                value={targetEmail} 
                                onChange={e => setTargetEmail(e.target.value)} 
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    )}
                    <div className="form-control">
                        <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số tiền (VND)</span></label>
                        <input 
                            type="text" 
                            className="input-modern" 
                            value={depositAmount} 
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                setDepositAmount(val);
                            }} 
                            placeholder="100.000"
                            required
                        />
                    </div>
                    {user?.role !== 'admin' && (
                        <>
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phương thức</span></label>
                                <select className="input-modern" value={method} onChange={e => setMethod(e.target.value)}>
                                    <option value="BANK_TRANSFER">Ngân hàng</option>
                                    <option value="MOMO">MoMo</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Minh chứng (Bill)</span></label>
                                <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition-all" onChange={e => setProof(e.target.files[0])} />
                            </div>
                        </>
                    )}
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" disabled={loading} className="btn-premium !px-10">
                            {loading ? "Đang xử lý..." : "Xác nhận nạp tiền"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Deposit History */}
            <div className="card-saas !p-0 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Trạng thái yêu cầu nạp tiền</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4 text-left">Thời gian</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4 text-left">Số tiền</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4 text-left">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {depositRequests.map(dr => (
                                <tr key={dr.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-xs font-bold text-slate-300">{new Date(dr.created_at).toLocaleString('vi-VN')}</td>
                                    <td className="p-4 text-xs font-black text-primary">{formatMoney(dr.amount)}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                            dr.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' :
                                            dr.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' :
                                            'bg-rose-500/20 text-rose-500'
                                        }`}>
                                            {dr.status === 'PENDING' ? 'Chờ duyệt' : dr.status === 'APPROVED' ? 'Thành công' : 'Bị từ chối'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {depositRequests.length === 0 && (
                                <tr><td colSpan="3" className="p-10 text-center text-slate-500 italic text-sm">Chưa có yêu cầu nào</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
