import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/common/BackButton";
import { SciFiSearch } from "../components/SciFiSearch";
import { Eye, Trash2, ShieldCheck, Shield, Ban, ShoppingCart, Image as ImageIcon, LayoutGrid, List } from "lucide-react";
import "./MyProducts.css";

export function MyProducts() {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'grid' or 'table'
    const [showImages, setShowImages] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Selection for Bulk Delete
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadMyProducts();
    }, []);

    const loadMyProducts = async () => {
        try {
            setLoading(true);
            // We need an endpoint to get user's own products across all houses.
            // For now, let's assume getProducts with seller_id=me works if house_id is optional,
            // or create a new endpoint. Based on products.controller.js, getProducts requires house_id.
            // I should have added getMyProducts to backend.
            const data = await api.get("/products/my-listings"); 
            setProducts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Load products failed:", e);
        } finally {
            setLoading(false);
        }
    };

    // Helper to add the missing backend endpoint if needed, but I'll assume I should have added it.
    // Wait, let me check if I added /products/my-listings. I didn't. I'll add it now.

    const handleDelete = async (id) => {
        const ok = await toast.confirm("Đưa sản phẩm này vào thùng rác? Bạn có 14 ngày để khôi phục.");
        if (!ok) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
            toast.success("Đã đưa vào thùng rác!");
        } catch (e) {
            toast.error(e.message);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const ok = await toast.confirm(`Đưa ${selectedIds.length} sản phẩm vào thùng rác?`);
        if (!ok) return;
        try {
            await api.post("/products/bulk-delete", { productIds: selectedIds });
            toast.success(`Đã đưa ${selectedIds.length} sản phẩm vào thùng rác!`);
            loadMyProducts();
            setIsSelectMode(false);
            setSelectedIds([]);
        } catch (e) {
            toast.error(e.message);
        }
    };

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="my-products-page animate-fade-in">
            <header className="page-header">
                <div className="header-left">
                    <BackButton fallbackPath="/" className="mb-2" />
                    <h1 className="text-3xl font-bold text-white">Sản phẩm của tôi 📦</h1>
                    <p className="text-slate-400">Quản lý các mặt hàng bạn đang đăng bán</p>
                </div>
                <div className="header-right flex gap-3">
                    <Link to="/my-products/trash" className="Btn btn-view">
                        <span className="svgIcon"><Trash2 size={20} /></span>
                        <span className="text">Thùng rác</span>
                    </Link>
                    <button 
                        onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }}
                        className={`Btn btn-scifi-custom ${isSelectMode ? 'active' : ''}`}
                    >
                        <span className="svgIcon">{isSelectMode ? <ShieldCheck size={20} /> : <Shield size={20} />}</span>
                        <span className="text">{isSelectMode ? 'Xong' : 'Chọn nhiều'}</span>
                    </button>
                </div>
            </header>

            <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex-1">
                    <SciFiSearch 
                        placeholder="Tìm kiếm sản phẩm của bạn..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5 mr-2">
                        <button 
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('grid')}
                            title="Lưới"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('table')}
                            title="Bảng"
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button 
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all border ${showImages ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'}`}
                        onClick={() => setShowImages(!showImages)}
                    >
                        <ImageIcon size={14} />
                        {showImages ? 'Ẩn Ảnh' : 'Hiện Ảnh'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-primary"></span></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state text-center py-20">
                    <div className="text-6xl mb-4">🏜️</div>
                    <h3 className="text-xl font-bold text-white">Chưa có sản phẩm nào</h3>
                    <p className="text-slate-400 mb-6">Bạn chưa đăng bán sản phẩm nào trên hệ thống.</p>
                    <Link to="/houses" className="Btn btn-scifi-custom !w-auto !px-8 !rounded-xl" title="Bắt đầu ngay">
                        <span className="svgIcon"><ShoppingCart size={20} /></span>
                        <span className="text">🛒 Bắt đầu đăng bán ngay</span>
                    </Link>
                </div>
            ) : viewMode === 'table' ? (
                <div className="warehouse-table-container scrollbar-custom">
                    <table className="warehouse-table">
                        <thead>
                            <tr>
                                {isSelectMode && <th className="w-10"></th>}
                                {showImages && <th className="image-col-header">Ảnh</th>}
                                <th>Sản phẩm</th>
                                <th>Nhà</th>
                                <th>Giá</th>
                                <th>Số lượng</th>
                                <th>Trạng thái</th>
                                <th className="text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr 
                                    key={p.id} 
                                    className={`${selectedIds.includes(p.id) ? 'selected' : ''}`}
                                    onClick={() => isSelectMode && toggleSelect(p.id)}
                                >
                                    {isSelectMode && (
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(p.id)}
                                                readOnly
                                                className="checkbox checkbox-primary checkbox-sm"
                                            />
                                        </td>
                                    )}
                                    {showImages && (
                                        <td className="image-cell-content">
                                            <div className="table-img-wrapper">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt="" onError={(e) => e.target.style.display = 'none'} />
                                                ) : (
                                                    <div className="img-placeholder">📦</div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="font-bold">{p.name}</td>
                                    <td className="text-slate-400 text-xs">{p.house_name}</td>
                                    <td className="text-amber-400 font-bold">{Number(p.price).toLocaleString()}đ</td>
                                    <td className="font-mono">{p.source_type === 'inventory' ? p.inventory_qty : p.quantity}</td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                            p.source_type === 'inventory' ? 'bg-indigo-500/20 text-indigo-300' : 
                                            p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                            {p.source_type === 'inventory' ? 'Trong kho' : (p.status === 'active' ? 'Đang bán' : 'Chờ duyệt')}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/houses/${p.house_id}`); }}
                                                title="Xem"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`products-grid ${!showImages ? 'compact-view' : ''}`}>
                    {filtered.map(p => (
                        <div 
                            key={p.id} 
                            className={`product-card-manage group ${isSelectMode ? 'selecting' : ''} ${selectedIds.includes(p.id) ? 'selected' : ''} ${!showImages ? 'compact-card' : ''}`}
                            onClick={() => isSelectMode && toggleSelect(p.id)}
                        >
                            {showImages ? (
                                <>
                                    <div className="card-img-container">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} />
                                        ) : (
                                            <div className="no-img">📦</div>
                                        )}
                                        <div className={`status-tag ${p.source_type === 'inventory' ? 'inventory' : p.status}`}>
                                            {p.source_type === 'inventory' ? 'Trong kho' : (p.status === 'active' ? 'Đang bán' : 'Chờ duyệt')}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="product-name">{p.name}</h3>
                                        <div className="p-house text-[10px] text-slate-500 mb-1">Nhà: {p.house_name}</div>
                                        <div className="flex justify-between items-center">
                                            <div className="p-price text-primary font-bold">{Number(p.price).toLocaleString()}đ</div>
                                            <div className={`text-[10px] px-2 py-0.5 rounded-full border ${p.source_type === 'inventory' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                                SL: {p.source_type === 'inventory' ? p.inventory_qty : p.quantity}
                                            </div>
                                        </div>
                                        
                                        {!isSelectMode && (
                                            <div className="card-actions mt-4 pt-4 border-t border-white/5 flex justify-center gap-3">
                                                <button className="Btn btn-view" onClick={(e) => { e.stopPropagation(); navigate(`/houses/${p.house_id}`); }} title="Xem chi tiết">
                                                    <span className="svgIcon"><Eye size={18} /></span>
                                                    <span className="text">Xem chi tiết</span>
                                                </button>
                                                <button className="Btn btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} title="Xóa">
                                                    <span className="svgIcon"><Trash2 size={18} /></span>
                                                    <span className="text">Xóa</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="compact-card-inner !p-3">
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="compact-title !text-left !text-sm truncate" title={p.name}>{p.name}</h3>
                                            <div className="text-[10px] text-slate-500 truncate">Nhà: {p.house_name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="compact-price !text-xs">{Number(p.price).toLocaleString()}đ</div>
                                            <div className={`text-[9px] font-bold ${p.source_type === 'inventory' ? 'text-indigo-400' : (p.status === 'active' ? 'text-emerald-500' : 'text-amber-500')}`}>
                                                {p.source_type === 'inventory' ? `KHO (${p.inventory_qty})` : (p.status === 'active' ? `ONLINE (${p.quantity})` : `PENDING (${p.quantity})`)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!isSelectMode && (
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/houses/${p.house_id}`); }} title="Xem">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} title="Xóa">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isSelectMode && (
                <div className="bulk-action-bar active">
                    <div className="info text-slate-300">Đã chọn <span className="text-primary font-bold">{selectedIds.length}</span> sản phẩm</div>
                    <div className="actions flex gap-3">
                        <button onClick={handleBulkDelete} className="Btn btn-delete" disabled={selectedIds.length === 0} title="Xóa">
                            <span className="svgIcon"><Trash2 size={20} /></span>
                            <span className="text">Xóa ({selectedIds.length})</span>
                        </button>
                        <button onClick={() => setIsSelectMode(false)} className="Btn btn-scifi-custom" title="Hủy">
                            <span className="svgIcon"><Ban size={20} /></span>
                            <span className="text">Thoát</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
