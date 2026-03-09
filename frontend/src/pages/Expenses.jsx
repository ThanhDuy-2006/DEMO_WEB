import { useState, useEffect, useMemo } from 'react';
import { api, expenses } from '../services/api'; 
import BackButton from '../components/common/BackButton';
import { ExpenseDetail } from './ExpenseDetail';
import { useToast } from '../context/ToastContext';
import './Expenses.css';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';

// --- ICONS ---
const ICONS = {
    'Food': '🍜', 'Shopping': '🛍️', 'Living': '🏠', 'Transport': '🚗', 
    'Entertainment': '🎮', 'Health': '🏥', 'Other': '📦',
    'Salary': '💰', 'Invest': '📈', 'Bonus': '🎁'
};

const COLORS = ['#0066FF', '#FF3B30', '#AF52DE', '#FFCC00', '#FF9500', '#5AC8FA', '#4CD964'];

const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN') + ' đ';

export function Expenses() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [day, setDay] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [filterType, setFilterType] = useState('month'); // 'month' or 'day'
    
    const [selectedId, setSelectedId] = useState(null);
    const [houseId, setHouseId] = useState('all');
    const [houses, setHouses] = useState([]);
    const toast = useToast();

    // Modal State
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({
        amount: '',
        category_id: null,
        transaction_date: new Date().toISOString().slice(0, 10),
        note: '',
        type: 'EXPENSE',
        house_id: 'none'
    });

    useEffect(() => {
        expenses.getCategories().then(setCategories).catch(console.error);
        api.get("/houses?scope=joined").then(setHouses).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
    }, [month, day, filterType, houseId]);

    const loadData = async () => {
        if (loading && stats) return;
        setLoading(true);
        try {
            const params = {
                ...(filterType === 'month' ? { month } : { date: day }),
                house_id: houseId !== 'all' ? houseId : undefined
            };

            const [statsRes, recordsRes] = await Promise.all([
                expenses.getStats(month), 
                expenses.getAll(params)
            ]);
            setStats(statsRes);
            setRecords(Array.isArray(recordsRes) ? recordsRes : []);
        } catch (e) {
            console.error("Load expenses failed", e);
            toast.error(`Lỗi: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItem.amount || !newItem.category_id) return toast.error("Vui lòng nhập số tiền và chọn danh mục");
        
        try {
            // If it's today, append current time for better sorting
            let finalDate = newItem.transaction_date;
            const today = new Date().toISOString().slice(0, 10);
            if (finalDate === today) {
                const now = new Date();
                finalDate = `${today} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            }

            await expenses.create({
                ...newItem,
                amount: parseInt(newItem.amount.replace(/\D/g, '')),
                transaction_date: finalDate,
                house_id: newItem.house_id === 'none' ? null : newItem.house_id
            });
            setShowAdd(false);
            setNewItem({ 
                amount: '', 
                category_id: null, 
                transaction_date: new Date().toISOString().slice(0, 10), 
                note: '', 
                type: 'EXPENSE' 
            });
            toast.success("Đã thêm hoá đơn mới");
            loadData(); // Reload
        } catch (e) {
            toast.error("Lỗi thêm hoá đơn");
        }
    };

    const groupedRecords = useMemo(() => {
        const groups = {};
        records.forEach(r => {
            const date = new Date(r.transaction_date).toLocaleDateString('vi-VN');
            if (!groups[date]) groups[date] = [];
            groups[date].push(r);
        });
        return groups;
    }, [records]);

    if (loading && !stats) return <div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div>;

    return (
        <div className="expenses-page p-4 md:p-8 max-w-5xl mx-auto min-h-screen relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[40%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 mb-4 md:mb-8">
                <BackButton fallbackPath="/" className="mb-4" />
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-between items-start md:items-center">
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] uppercase tracking-widest">
                        Quản lý chi tiêu
                    </h1>
                    
                    <div className="flex bg-slate-800/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-lg w-full md:w-auto">
                        <button 
                            className={`flex-1 md:flex-none px-6 py-2 text-xs md:text-sm uppercase font-bold rounded-lg transition-all duration-300 ${filterType === 'month' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setFilterType('month')}
                        >Tháng</button>
                        <button 
                            className={`flex-1 md:flex-none px-6 py-2 text-xs md:text-sm uppercase font-bold rounded-lg transition-all duration-300 ${filterType === 'day' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setFilterType('day')}
                        >Ngày</button>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">

                
                <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex-1 shadow-inner">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-400 text-lg">
                        🗓️
                    </div>
                    {filterType === 'month' ? (
                        <input 
                            type="month" 
                            className="w-full bg-transparent text-white pl-12 pr-4 py-3 text-sm md:text-base outline-none font-bold"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    ) : (
                        <input 
                            type="date" 
                            className="w-full bg-transparent text-white pl-12 pr-4 py-3 text-sm md:text-base outline-none font-bold"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* LEFT COL: Overview & Chart */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Overview Cards */}
                    <div className="expense-summary-grid">
                        <div className="summary-card income">
                            <h3>Thu nhập</h3>
                            <span className="value">{formatMoney(stats?.total_income || 0)}</span>
                        </div>
                        <div className="summary-card expense">
                            <h3>Chi tiêu</h3>
                            <span className="value">{formatMoney(stats?.total_expense || 0)}</span>
                            
                            {stats?.comparison && (
                                <div className={`comparison-badge ${stats.comparison.diff > 0 ? 'up' : 'down'}`}>
                                    {stats.comparison.diff > 0 ? '▲' : '▼'} {Math.abs(stats.comparison.percent)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    {stats?.categories?.length > 0 && (
                        <div className="expense-card h-72 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"></div>
                            <h3 className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest text-center">Phân bổ chi tiêu</h3>
                            <div className="flex-1 min-h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.categories}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {stats.categories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(val) => formatMoney(val)}
                                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'white' }}
                                            itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center mt-4 z-10 relative">
                                {stats.categories.slice(0, 4).map((c, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{background: c.color || COLORS[i % COLORS.length], boxShadow: `0 0 8px ${c.color || COLORS[i % COLORS.length]}`}}></span>
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COL: Records */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lịch sử giao dịch</h3>
                        <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/5 shadow-inner">{records.length} giao dịch</span>
                    </div>

                    <div className="records-scroll-container">
                        <div className="records-list">
                        {Object.keys(groupedRecords).map((date, idx) => (
                            <div key={date} className="mb-6 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="expense-group-header">
                                    <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-white/5 backdrop-blur-sm shadow-sm">{date}</span>
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md shadow-lg">
                                    {groupedRecords[date].map(item => (
                                        <div key={item.id} className="expense-item group" onClick={() => setSelectedId(item.id)}>
                                            <div className="cat-icon group-hover:scale-110 transition-transform duration-300" style={{background: item.category_color + '20', color: item.category_color}}>
                                                {item.category_icon || '📦'}
                                            </div>
                                            <div className="expense-details">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="expense-cat">{item.category_name}</span>
                                                    <span className="text-[10px] bg-black/30 text-slate-400 px-2 py-0.5 rounded-md font-mono border border-white/5 shadow-inner">
                                                        {new Date(item.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="expense-note">{item.note || 'Không có ghi chú'}</div>
                                            </div>
                                            <div className={`expense-amount ${item.type === 'INCOME' ? 'income' : 'expense'}`}>
                                                {item.type === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {records.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <div className="text-6xl mb-4">📭</div>
                                <div className="text-slate-400 text-sm font-medium">Không có dữ liệu cho thời gian này</div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
            <button className="fab-add" onClick={() => setShowAdd(true)}>
                <span>+</span>
            </button>

            {/* Add Modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
                    <div className="bottom-sheet">
                        <div className="sheet-header">
                            <h2 className="sheet-title">Thêm giao dịch</h2>
                            <button onClick={() => setShowAdd(false)} className="text-slate-400 p-2">✕</button>
                        </div>
                        
                        <div className="amount-input-group">
                            <label className="text-xs text-slate-400">Số tiền</label>
                            <input 
                                type="text" 
                                className="amount-input" 
                                placeholder="0" 
                                autoFocus
                                value={newItem.amount ? Number(newItem.amount).toLocaleString('vi-VN') : ''}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setNewItem({...newItem, amount: val});
                                }}
                            />
                            <span className="text-right text-xs text-slate-500">VND</span>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-2 block">Danh mục</label>
                            <div className="cat-grid">
                                {categories.filter(c => c.type === newItem.type).map(c => (
                                    <div 
                                        key={c.id} 
                                        className={`cat-item ${newItem.category_id === c.id ? 'active' : ''}`}
                                        onClick={() => setNewItem({...newItem, category_id: c.id})}
                                    >
                                        <div className="cat-circle" style={{color: c.color}}>
                                            {c.icon}
                                        </div>
                                        <span className="cat-name">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <input 
                                type="date" 
                                className="date-picker flex-1"
                                value={newItem.transaction_date}
                                onChange={e => setNewItem({...newItem, transaction_date: e.target.value})}
                             />
                             <select 
                                className="date-picker w-auto"
                                value={newItem.house_id}
                                onChange={e => setNewItem({...newItem, house_id: e.target.value})}
                             >
                                <option value="none">Không có nhà</option>
                                {houses.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                             </select>
                             <select 
                                className="date-picker w-auto"
                                value={newItem.type}
                                onChange={e => setNewItem({...newItem, type: e.target.value})}
                             >
                                <option value="EXPENSE">Chi tiền</option>
                                <option value="INCOME">Thu tiền</option>
                             </select>
                        </div>
                        
                        <input 
                            type="text" 
                            className="bg-slate-800 text-white p-3 rounded-xl w-full border border-slate-700 outline-none"
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={newItem.note}
                            onChange={e => setNewItem({...newItem, note: e.target.value})}
                        />

                        <button onClick={handleAdd} className="btn btn-primary w-full py-3 text-lg mt-2">
                            Lưu hoá đơn
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedId && (
                <ExpenseDetail 
                    id={selectedId} 
                    onClose={() => setSelectedId(null)} 
                    onUpdate={loadData}
                />
            )}
        </div>
    );
}
