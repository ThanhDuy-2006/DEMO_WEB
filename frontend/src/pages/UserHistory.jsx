import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../services/api";
import BackButton from "../components/common/BackButton";
import "./UserWarehouse.css"; // Reuse existing styles

export function UserHistory() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'all';

  const [activeTab, setActiveTab] = useState("bought"); // 'bought' | 'sold'
  const [filterType, setFilterType] = useState(initialType); // 'all' | 'physical' | 'digital'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const isFetching = useRef(false);

  useEffect(() => {
    const type = queryParams.get('type') || 'all';
    setFilterType(type);
  }, [location.search]);

  const loadData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      const endpoint = activeTab === 'bought' ? '/orders/my-items' : '/orders/sold-items';
      console.log(`[UserHistory] Fetching from ${endpoint}...`);
      const data = await api.get(endpoint);
      console.log(`[UserHistory] Received ${Array.isArray(data) ? data.length : 'not an array'} items`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[UserHistory] Fetch error:", e);
      setItems([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const formatMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";
  const formatDate = (d) => new Date(d).toLocaleString('vi-VN');

    const displayedItems = items.filter(item => {
        if (filterType === 'all') return true;
        return item.type === filterType;
    });

    return (
        <div className="warehouse-page animate-fade-in">
            {/* Header */}
            <header className="warehouse-header">
                <div className="header-left">
                    <BackButton fallbackPath="/my-warehouse" label="Quay lại Kho" className="mb-2" />
                    <h1>Lịch sử giao dịch 📜</h1>
                    <p>Theo dõi các đơn hàng đã mua và đã bán</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="bg-slate-800/10 p-1 rounded-lg border border-black/5 flex">
                        <button 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            onClick={() => setFilterType('all')}
                        >
                            Tất cả
                        </button>
                        <button 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'digital' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            onClick={() => setFilterType('digital')}
                        >
                            Sản phẩm số (Key)
                        </button>
                        <button 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'physical' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            onClick={() => setFilterType('physical')}
                        >
                            Sản phẩm vật lý
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            className={`btn-tab bought ${activeTab === 'bought' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bought')}
                        >
                            Đã mua
                        </button>
                        <button 
                            className={`btn-tab sold ${activeTab === 'sold' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sold')}
                        >
                            Đã bán
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="warehouse-main">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="empty-state-container">
                        <div className="empty-state">
                            <div className="empty-icon">{activeTab === 'bought' ? '🛒' : '💰'}</div>
                            <h2>Chưa có giao dịch nào</h2>
                            <p>
                                {activeTab === 'bought' 
                                    ? "Bạn chưa mua món hàng nào." 
                                    : "Bạn chưa bán được món hàng nào."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full text-slate-700">
                            <thead>
                                <tr className="border-b border-black/5 text-slate-500 uppercase text-xs font-bold bg-white/30">
                                    <th>Thời gian</th>
                                    <th>Sản phẩm</th>
                                    <th className="hidden md:table-cell">Nhà</th>
                                    <th className="hidden md:table-cell">{activeTab === 'bought' ? 'Người bán' : 'Người mua'}</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedItems.map((item, idx) => {
                                    if (!item) return null;
                                    return (
                                    <tr key={item.id || idx} className="hover:bg-white/40 border-b border-black/5 transition-colors">
                                    <td className="text-[11px] leading-tight">
                                        <div className="font-bold text-slate-700">{new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-slate-400 font-mono">{new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {item.image_url && (
                                                <div className="w-8 h-8 rounded bg-white overflow-hidden shadow-sm border border-slate-100">
                                                    <img src={item.image_url} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-bold">{item.product_name || "Sản phẩm không tên"}</span>
                                                {item.description && (
                                                    <span className={`text-[10px] italic px-1.5 py-0.5 rounded ${
                                                        item.type === 'digital' ? 'bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20' : 
                                                        item.description.includes('Hoàn tiền') ? 'bg-emerald-500/10 text-emerald-600' : 
                                                        'text-slate-500'
                                                    }`}>
                                                        {item.type === 'digital' ? `🔑 Key: ${item.description}` : item.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs text-blue-600 hidden md:table-cell">{item.house_name}</td>
                                    <td className="text-xs hidden md:table-cell">
                                        {activeTab === 'bought' 
                                            ? <span className="text-slate-400">—</span> 
                                            : <div>
                                                <div className="font-bold text-slate-700">{item.buyer_name}</div>
                                                <div className="text-[10px] text-slate-500">{item.buyer_email}</div>
                                              </div>
                                        }
                                    </td>
                                    <td className="font-mono">x{item.quantity}</td>
                                    <td className="font-mono text-slate-600 font-medium">{formatMoney(item.price)}</td>
                                    <td className={`font-mono font-bold ${activeTab === 'bought' ? 'text-red-500' : 'text-green-600'}`}>
                                        {activeTab === 'bought' ? '-' : '+'}{formatMoney(item.price * item.quantity)}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <style>{`
            .btn-tab {
                padding: 10px 20px;
                background: rgba(255, 255, 255, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.6);
                color: var(--text-muted);
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.2s;
            }
            .btn-tab:hover {
                background: rgba(255, 255, 255, 0.8);
                color: var(--primary-custom);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(90, 138, 158, 0.15);
            }
            .btn-tab.active {
                color: white;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            .btn-tab.bought.active {
                background: var(--primary-custom);
                border-color: var(--primary-custom);
                box-shadow: 0 4px 10px rgba(117, 165, 184, 0.3);
            }
            .btn-tab.sold.active {
                background: linear-gradient(135deg, #10b981, #059669);
                border-color: #10b981;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }
        `}</style>
    </div>
  );
}
