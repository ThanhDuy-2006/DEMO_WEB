import React, { useState, useEffect, useMemo } from 'react';
import { expenses, api } from '../../../services/api'; 
import { useToast } from '../../../context/ToastContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useRef } from 'react';

const COLORS = ['#6366f1', '#f43f5e', '#a855f7', '#eab308', '#f97316', '#06b6d4', '#10b981'];
const COMMON_EMOJIS = ['🍔', '🚗', '🎮', '🛍️', '🏠', '🏥', '🍿', '📚', '💻', '👕', '💡', '🚰', '⛽', '🎁', '✈️', '🚬', '🍻', '🐱', '⚽', '💈', '💰', '📉', '📈', '🏛️'];
const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN') + ' đ';

export const ExpensesTab = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [day, setDay] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [houses, setHouses] = useState([]);
    const [houseId, setHouseId] = useState('all');
    
    // Ref to trigger picker
    const datePickerRef = useRef(null);
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

    // New Category State
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [newCatData, setNewCatData] = useState({
        name: '',
        icon: '📦',
        color: '#6366f1'
    });

    // Edit State
    const [editingItem, setEditingItem] = useState(null);

    const getRandomColor = () => {
        const usedColors = categories.map(c => c.color?.toLowerCase());
        let color;
        do {
            color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        } while (usedColors.includes(color));
        return color;
    };

    useEffect(() => {
        if (showAddCategory) {
            setNewCatData(prev => ({ ...prev, color: getRandomColor() }));
        }
    }, [showAddCategory]);

    useEffect(() => {
        expenses.getCategories().then(setCategories).catch(console.error);
        api.get("/houses?scope=joined").then(setHouses).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
    }, [day, houseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const currentMonth = day.slice(0, 7);
            setMonth(currentMonth); // Keep stats in sync with selected day's month

            const params = {
                date: day,
                house_id: houseId !== 'all' ? houseId : undefined
            };

            const [statsRes, recordsRes] = await Promise.all([
                expenses.getStats(currentMonth), 
                expenses.getAll(params)
            ]);
            setStats(statsRes);
            setRecords(Array.isArray(recordsRes) ? recordsRes : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItem.amount || !newItem.category_id) return toast.error("Vui lòng nhập số tiền và chọn danh mục");
        
        try {
            await expenses.create({
                ...newItem,
                amount: parseInt(newItem.amount.replace(/\D/g, '')),
                house_id: newItem.house_id === 'none' ? null : newItem.house_id
            });
            setShowAdd(false);
            setNewItem({ 
                amount: '', 
                category_id: null, 
                transaction_date: new Date().toISOString().slice(0, 10), 
                note: '', 
                type: 'EXPENSE',
                house_id: 'none'
            });
            toast.success("Đã thêm hoá đơn mới");
            loadData();
        } catch (e) {
            toast.error("Lỗi thêm hoá đơn");
        }
    };

    const handleCreateCategory = async () => {
        if (!newCatData.name) return toast.error("Vui lòng nhập tên danh mục");
        try {
            const res = await expenses.createCategory({
                ...newCatData,
                type: editingItem ? editingItem.type : newItem.type
            });
            setCategories([...categories, res]);
            if (editingItem) setEditingItem({ ...editingItem, category_id: res.id });
            else setNewItem({ ...newItem, category_id: res.id });
            
            setShowAddCategory(false);
            setNewCatData({ name: '', icon: '📦', color: '#6366f1' });
            toast.success("Đã thêm danh mục mới");
        } catch (e) {
            toast.error("Lỗi tạo danh mục");
        }
    };

    const handleUpdate = async () => {
        try {
            await expenses.updateCategory(editingItem.id, {
                category_id: editingItem.category_id,
                note: editingItem.note
            });
            setEditingItem(null);
            toast.success("Đã cập nhật giao dịch");
            loadData();
        } catch (e) {
            toast.error("Cập nhật thất bại");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
        try {
            await expenses.delete(id);
            setEditingItem(null);
            toast.success("Đã xóa giao dịch");
            loadData();
        } catch (e) {
            toast.error("Xóa thất bại");
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

    if (!stats && loading) return <div className="p-10 text-center text-slate-400">Đang tải chi tiêu...</div>;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Unified Header Filter - Uniform Sizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/60 p-5 rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-xl">
                
                {/* Date Picker Button */}
                <div 
                    onClick={() => datePickerRef.current?.showPicker()}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4 cursor-pointer hover:border-primary/50 transition-all group h-[60px]"
                >
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Thời gian</span>
                        <span className="text-xs font-bold text-white tracking-widest">
                            {new Date(day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                    </div>
                    <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
                    <input 
                        type="date" 
                        ref={datePickerRef}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                        value={day}
                        onChange={e => setDay(e.target.value)}
                    />
                </div>

                {/* House Filter */}
                <div className="relative h-[60px]">
                    <div className="absolute left-6 top-3 text-[9px] font-black uppercase text-slate-500 tracking-widest pointer-events-none">Nhà ở</div>
                    <select 
                        className="w-full h-full bg-white/5 border border-white/10 rounded-2xl px-6 pt-6 pb-2 text-xs font-black text-white uppercase tracking-widest outline-none cursor-pointer hover:border-primary/50 transition-all appearance-none"
                        value={houseId} 
                        onChange={e => setHouseId(e.target.value)}
                    >
                        <option value="all" className="bg-slate-900 text-white">Tất cả nhà</option>
                        {houses.map(h => (
                            <option key={h.id} value={h.id} className="bg-slate-900 text-white">{h.name}</option>
                        ))}
                    </select>
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">▼</span>
                </div>
                
                {/* Add Expense Button */}
                <button 
                    onClick={() => setShowAdd(true)} 
                    className="btn-premium !p-0 h-[60px] text-xs font-black uppercase tracking-widest whitespace-nowrap flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                    <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                    Thêm chi tiêu
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="card-saas !p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase text-slate-400">Tổng thu</span>
                            <span className="text-lg font-black text-emerald-400">{formatMoney(stats?.total_income || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase text-slate-400">Tổng chi</span>
                            <span className="text-lg font-black text-rose-400">{formatMoney(stats?.total_expense || 0)}</span>
                        </div>
                    </div>

                    {stats?.categories?.length > 0 && (
                        <div className="card-saas !p-6 h-64">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-2">Phân bổ chi tiêu</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categories}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        stroke="none"
                                    >
                                        {stats.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val) => formatMoney(val)}
                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Records List */}
                <div className="lg:col-span-7 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {Object.keys(groupedRecords).map(date => (
                        <div key={date}>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                {date}
                            </h4>
                            <div className="card-saas !p-0 overflow-hidden divide-y divide-white/5 bg-white/5">
                                {groupedRecords[date].map(item => (
                                    <div 
                                        key={item.id} 
                                        className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => setEditingItem(item)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                                {item.category_icon || '📦'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">{item.category_name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{item.note || 'Không có ghi chú'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {item.type === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Chạm để sửa</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {records.length === 0 && (
                        <div className="text-center py-20 text-slate-500 italic text-sm">Chưa có dữ liệu cho tháng này</div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-fade-in" onClick={() => setShowAdd(false)}></div>
                    <div className="relative bg-[#0b1021] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_150px_rgba(0,0,0,1)] animate-modal-in overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                        <h2 className="text-3xl font-black text-white mb-10 uppercase tracking-tighter text-center">Thêm giao dịch mới</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Số tiền (VND)</span></label>
                                <input 
                                    type="text" 
                                    className="input-modern !text-2xl text-center" 
                                    value={newItem.amount ? Number(newItem.amount).toLocaleString('vi-VN') : ''} 
                                    onChange={e => setNewItem({...newItem, amount: e.target.value.replace(/\D/g, '')})} 
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Loại</span></label>
                                    <select className="input-modern" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value, category_id: null})}>
                                        <option value="EXPENSE">Chi tiền</option>
                                        <option value="INCOME">Thu tiền</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Danh mục</span></label>
                                    <div className="flex gap-2">
                                        <select 
                                            className="input-modern flex-grow" 
                                            value={newItem.category_id || ''} 
                                            onChange={e => {
                                                if (e.target.value === 'ADD_NEW') setShowAddCategory(true);
                                                else setNewItem({...newItem, category_id: e.target.value});
                                            }}
                                        >
                                            <option value="">Chọn...</option>
                                            {categories.filter(c => c.type === newItem.type).map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                            <option value="ADD_NEW" className="text-primary font-bold">+ Thêm danh mục...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Ghi chú</span></label>
                                <input type="text" className="input-modern" value={newItem.note} onChange={e => setNewItem({...newItem, note: e.target.value})} placeholder="Ví dụ: Ăn phở..." />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-4 px-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-2xl transition-all border border-white/5">Hủy</button>
                                <button onClick={handleAdd} className="btn-premium flex-1 !py-4">Lưu hóa đơn</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowAddCategory(false)}></div>
                    <div className="relative bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-modal-in overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Tạo danh mục mới</h3>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="text-[9px] uppercase font-black text-slate-500">Tên danh mục</span></label>
                                <input 
                                    type="text" 
                                    className="input-modern" 
                                    value={newCatData.name} 
                                    onChange={e => setNewCatData({...newCatData, name: e.target.value})} 
                                    placeholder="Ví dụ: Ăn vặt, Tiệm net..."
                                />
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="text-[9px] uppercase font-black text-slate-500">Biểu tượng</span></label>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        <span>{newCatData.icon}</span>
                                        <span className="text-[10px] uppercase font-black text-slate-500 group-hover:text-primary transition-colors">Thay đổi</span>
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#1e293b] border border-white/10 rounded-2xl p-4 shadow-2xl animate-fade-in">
                                            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {COMMON_EMOJIS.map(emoji => (
                                                    <button 
                                                        key={emoji}
                                                        onClick={() => {
                                                            setNewCatData({...newCatData, icon: emoji});
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        className={`w-full aspect-square flex items-center justify-center text-xl rounded-lg transition-all ${newCatData.icon === emoji ? 'bg-emerald-500/20 border border-emerald-500/50 scale-110' : 'hover:bg-white/10 border border-transparent'}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowAddCategory(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors">Hủy</button>
                                <button onClick={handleCreateCategory} className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Tạo ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-fade-in" onClick={() => setEditingItem(null)}></div>
                    <div className="relative bg-[#0b1021] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_150px_rgba(0,0,0,1)] animate-modal-in overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter text-center">Sửa giao dịch</h2>
                        <p className="text-center text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10">{formatMoney(editingItem.amount)}</p>
                        
                        <div className="space-y-6">
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Danh mục</span></label>
                                <select 
                                    className="input-modern" 
                                    value={editingItem.category_id || ''} 
                                    onChange={e => {
                                        if (e.target.value === 'ADD_NEW') setShowAddCategory(true);
                                        else setEditingItem({...editingItem, category_id: e.target.value});
                                    }}
                                >
                                    <option value="">Chọn...</option>
                                    {categories.filter(c => c.type === editingItem.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                    <option value="ADD_NEW" className="text-primary font-bold">+ Thêm danh mục...</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Ghi chú</span></label>
                                <input type="text" className="input-modern" value={editingItem.note || ''} onChange={e => setEditingItem({...editingItem, note: e.target.value})} placeholder="Ví dụ: Ăn phở..." />
                            </div>

                            <div className="flex flex-col gap-3 pt-6">
                                <button onClick={handleUpdate} className="btn-premium w-full !py-4 shadow-lg shadow-primary/20">Cập nhật thay đổi</button>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-2xl transition-all border border-white/5">Hủy</button>
                                    <button onClick={() => handleDelete(editingItem.id)} className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-2xl transition-all border border-rose-500/20">Xóa bỏ</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
