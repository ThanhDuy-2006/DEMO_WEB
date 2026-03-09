import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { SciFiSearch } from "../components/SciFiSearch";
import { 
    Shield, 
    ShieldCheck, 
    History, 
    ShoppingCart, 
    Trash2, 
    Edit3, 
    Coins, 
    Ban,
    Check,
    Edit,
    Image as ImageIcon,
    LayoutGrid,
    List,
    Eye
} from "lucide-react";
import "./UserWarehouse.css";
import BackButton from "../components/common/BackButton";
import { useToast } from "../context/ToastContext";

export function UserWarehouse() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState([]);
  const navigate = useNavigate();
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [showImages, setShowImages] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'selling', 'warehouse'

  // Modals
  const [viewItem, setViewItem] = useState(null);
  const [resellItem, setResellItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  
  // Form States
  const [resellPrice, setResellPrice] = useState("");
  const [resellQty, setResellQty] = useState(1);
  const [targetHouse, setTargetHouse] = useState("");
  
  // New States for Resell Logic
  const [calcMethod, setCalcMethod] = useState("normal"); // 'normal' | 'food'
  const [totalCost, setTotalCost] = useState("");
  
  const [editQty, setEditQty] = useState(1);
  const [houseSearchTerm, setHouseSearchTerm] = useState(""); // New state for house search
  
  // Bulk Delete
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const isFetchingData = useRef(false);
  const isFetchingHouses = useRef(false);

  useEffect(() => {
    loadData();
    loadHouses();
  }, []);

  const loadData = () => {
    if (isFetchingData.current) return;
    isFetchingData.current = true;
    setLoading(true);
    api.get("/inventories")
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        isFetchingData.current = false;
      });
  };

  const loadHouses = () => {
      if (isFetchingHouses.current) return;
      isFetchingHouses.current = true;
      // Only load houses user has joined
      api.get("/houses?scope=joined").then(data => {
          if (Array.isArray(data)) setHouses(data);
      }).catch(console.error)
      .finally(() => {
          isFetchingHouses.current = false;
      });
  };

  const handleCancelSell = async (newItem) => {
      const ok = await toast.confirm(`Bạn có chắc muốn HỦY BÁN món "${newItem.name}" không?`);
      if (!ok) return;
      
      try {
          await api.post(`/inventories/${newItem.id}/cancel-sell`);
          toast.success("Đã hủy bán thành công! Vật phẩm đã quay về kho.");
          loadData();
      } catch (e) {
          console.error(e);
          toast.error("Lỗi: " + (e.response?.data?.error || e.message));
      }
  };

  const handleResellSubmit = async () => {
      console.log("Resell Submit Triggered");
      
      // 1. Validate House
      if (!targetHouse) {
          toast.warn("Vui lòng chọn Nhà để bán!");
          return;
      }

      // 2. Validate Quantity
      const qty = parseInt(resellQty);
      if (!qty || qty <= 0) {
          toast.warn("Số lượng bán không hợp lệ!");
          return;
      }
      if (resellItem && qty > resellItem.quantity) {
          toast.warn(`Bạn chỉ có ${resellItem.quantity} cái, không thể bán ${qty}!`);
          return;
      }

      // 3. Validate Price
      if (calcMethod === 'food' && !totalCost) {
          toast.warn("Vui lòng nhập Tổng tiền cho hình thức ăn uống!");
          return;
      }

      // Remove dots, convert to number
      const rawPrice = resellPrice.replace(/\./g, '');
      const price = parseInt(rawPrice);
      if (isNaN(price) || price < 0) {
         toast.error(calcMethod === 'food' ? "Không thể tính đơn giá. Vui lòng kiểm tra lại Tổng tiền và Số lượng!" : "Giá bán không hợp lệ!");
         return;
      }

      const payload = {
          inventory_id: resellItem.id,
          house_id: targetHouse,
          price: price, // Send number
          quantity: qty
      };
      
      console.log("Sending API Payload:", payload);

      try {
          await api.post("/inventories/resell", payload);
          toast.success("Đăng bán thành công! Vật phẩm đã được chuyển sang trạng thái 'Đang bán'.");
          setResellItem(null);
          loadData();
      } catch (e) {
          console.error("Resell Error:", e);
          toast.error("Lỗi: " + (e.response?.data?.error || e.message));
      }
  };

  const handleEditSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.patch(`/inventories/${editItem.id}`, {
              quantity: editQty
          });
          toast.success("Đã cập nhật số lượng thành công!");
          setEditItem(null);
          loadData();
      } catch (e) {
          toast.error(e.message);
      }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleDelete = async (id) => {
      const ok = await toast.confirm("Bạn có chắc chắn muốn xóa món hàng này khỏi kho? Hành động này không thể hoàn tác.");
      if (!ok) return;
      
      try {
          await api.delete(`/inventories/${id}`);
          setItems(items.filter(i => i.id !== id));
          toast.success("Đã xóa khỏi kho thành công!");
      } catch (e) {
          toast.error("Xóa thất bại: " + (e.response?.data?.error || e.message));
      }
  };

  const toggleSelectMode = () => {
      setIsSelectMode(!isSelectMode);
      setSelectedIds([]);
  };

  const handleSelectAll = () => {
      if (selectedIds.length === filteredItems.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredItems.map(i => i.id));
      }
  };

  const handleToggleSelect = (id) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedIds.length === 0) return;
      const ok = await toast.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} món hàng đã chọn?`);
      if (!ok) return;

      try {
          await api.post("/inventories/bulk-delete", { ids: selectedIds });
          toast.success(`Đã xóa thành công ${selectedIds.length} món hàng!`);
          
          setIsSelectMode(false);
          setSelectedIds([]);
          loadData();
      } catch (e) {
          toast.error("Xóa thất bại: " + (e.response?.data?.error || e.message));
      }
  };

  const filteredItems = items.filter(item => {
      if (!item) return false;
      const matchesSearch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'selling' && item.is_selling === 1) ||
                           (filterStatus === 'warehouse' && item.is_selling === 0);
      
      return matchesSearch && matchesStatus;
  });

  return (
    <div className="warehouse-page animate-fade-in">
        {/* Header */}
        <header className="warehouse-header">
            <div className="header-left">
                <BackButton fallbackPath="/" className="mb-2" />
                <h1>Kho Của Tôi 🎒</h1>
                <p>Quản lý các sản phẩm bạn đã mua</p>
            </div>

            <div className="header-right">
                <button 
                    onClick={toggleSelectMode} 
                    className={`Btn btn-scifi-custom ${isSelectMode ? 'active !bg-blue-600 !text-white' : ''}`}
                    title={isSelectMode ? 'Xong' : 'Chọn nhiều'}
                >
                    <span className="svgIcon">{isSelectMode ? <ShieldCheck size={20} /> : <Shield size={20} />}</span>
                    <span className="text">{isSelectMode ? 'Xong' : 'Chọn nhiều'}</span>
                </button>
                <Link to="/history" className="Btn btn-scifi-custom" title="Lịch sử">
                    <span className="svgIcon"><History size={20} /></span>
                    <span className="text">Lịch sử</span>
                </Link>
                <Link to="/houses" className="Btn btn-scifi-custom" title="Mua thêm">
                    <span className="svgIcon"><ShoppingCart size={20} /></span>
                    <span className="text">Mua thêm</span>
                </Link>
            </div>
        </header>

        {/* Main */}
        <div className="warehouse-main">
            <div className="mb-8 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
                <div className="w-full lg:w-auto lg:max-w-xl flex-1">
                    <SciFiSearch 
                        placeholder="Tìm kiếm vật phẩm trong kho..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        showFilter={false}
                    />
                </div>

                <div className="flex w-full lg:w-auto bg-slate-800/50 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setFilterStatus("all")}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:text-white'}`}
                    >
                        Tất cả
                    </button>
                    <button 
                        onClick={() => setFilterStatus("selling")}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'selling' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:text-white'}`}
                    >
                        Đang bán
                    </button>
                    <button 
                        onClick={() => setFilterStatus("warehouse")}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'warehouse' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-400 hover:text-white'}`}
                    >
                        Trong kho
                    </button>
                </div>

                    <button 
                        className={`flex justify-center lg:justify-start items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all border ${showImages ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'}`}
                        onClick={() => setShowImages(!showImages)}
                    >
                        <ImageIcon size={16} />
                        {showImages ? 'Ẩn Ảnh' : 'Hiện Ảnh'}
                    </button>
            </div>

            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                 </div>
            ) : items.length === 0 ? (
                // Empty State
                <div className="empty-state-container">
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h2>Kho của bạn đang trống</h2>
                        <p>
                            Mua sản phẩm đầu tiên để bắt đầu sử dụng các tính năng
                            của HouseMarket Pro.
                        </p>

                        <div className="empty-actions">
                            <Link to="/houses" className="Btn btn-scifi-custom !w-auto !px-6 !rounded-xl" title="Mua sắm">
                                <span className="svgIcon"><ShoppingCart size={20} /></span>
                                <span className="text">🛒 Đi chợ ngay</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                 <div className="text-center py-20 opacity-50">
                    <p>Không tìm thấy sản phẩm nào khớp với từ khóa.</p>
                 </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block warehouse-table-container scrollbar-custom responsive-table-wrapper">
                        <table className="warehouse-table min-w-[700px]">
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
                                {filteredItems.map(item => (
                                    <tr 
                                        key={item.id} 
                                        className={`${selectedIds.includes(item.id) ? 'selected' : ''}`}
                                        onClick={() => isSelectMode && handleToggleSelect(item.id)}
                                    >
                                        {isSelectMode && (
                                            <td>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(item.id)}
                                                    readOnly
                                                    className="checkbox checkbox-primary checkbox-sm border-white/20"
                                                />
                                            </td>
                                        )}
                                        {showImages && (
                                            <td className="image-cell-content">
                                                <div className="table-img-wrapper">
                                                    {item.image_url ? (
                                                        <img src={getImageUrl(item.image_url)} alt="" onError={(e) => e.target.style.display = 'none'} />
                                                    ) : (
                                                        <div className="img-placeholder">📦</div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-[10px] text-blue-500 opacity-80">{item.seller_name || 'Hệ thống'}</div>
                                        </td>
                                        <td className="text-slate-400 text-xs">{item.house_name || 'Không xác định'}</td>
                                        <td className="text-amber-400 font-bold">{item.price ? Number(item.price).toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</td>
                                        <td className="font-mono">{item.quantity}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                item.is_selling === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {item.is_selling === 1 ? 'Đang bán' : 'Trong kho'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            {!isSelectMode && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); setViewItem(item); }}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {item.is_selling === 1 ? (
                                                        <button 
                                                            className="p-2 hover:bg-yellow-500/10 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleCancelSell(item); }}
                                                            title="Hủy bán"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setResellItem(item);
                                                                setResellQty(1);
                                                                setResellPrice("");
                                                                setTotalCost("");
                                                                setHouseSearchTerm(""); 
                                                                const defaultHouse = houses[0] || null;
                                                                setTargetHouse(defaultHouse?.id || "");
                                                                if (defaultHouse?.type === 'food') setCalcMethod("food");
                                                                else setCalcMethod("normal");
                                                            }}
                                                            title="Đăng bán lại"
                                                        >
                                                            <Coins size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditItem(item);
                                                            setEditQty(item.quantity);
                                                        }}
                                                        title="Sửa số lượng"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                        title="Xóa vật phẩm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 animate-fade-in-up">
                        {filteredItems.map(item => (
                            <div 
                                key={item.id} 
                                className={`flex flex-col p-4 rounded-2xl bg-[#111a33]/80 border backdrop-blur-sm transition-all shadow-lg ${selectedIds.includes(item.id) ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500' : 'border-white/5'} ${isSelectMode ? 'cursor-pointer active:scale-95' : ''}`}
                                onClick={() => isSelectMode && handleToggleSelect(item.id)}
                            >
                                <div className="flex gap-4">
                                    {isSelectMode && (
                                        <div className="flex items-center justify-center pt-2">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(item.id)}
                                                readOnly
                                                className="checkbox checkbox-primary checkbox-sm border-white/20"
                                            />
                                        </div>
                                    )}
                                    {showImages && (
                                        <div className="w-16 h-16 shrink-0 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                                            {item.image_url ? (
                                                <img src={getImageUrl(item.image_url)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                            ) : (
                                                <div className="text-2xl opacity-50">📦</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className="font-bold text-white text-base truncate pr-2">{item.name}</h4>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${item.is_selling === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                {item.is_selling === 1 ? 'Đang bán' : 'Trong kho'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-blue-400/80 mb-2 truncate">NSX: {item.seller_name || 'Hệ thống'}</p>
                                        <div className="flex justify-between items-end mt-auto">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Giá / SL</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-amber-400 font-bold">{item.price ? Number(item.price).toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</span>
                                                    <span className="text-slate-500 select-none">•</span>
                                                    <span className="font-mono text-slate-300">x{item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {!isSelectMode && (
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 w-full">
                                        <button 
                                            className="flex-1 flex justify-center items-center py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 text-xs font-bold gap-1.5"
                                            onClick={(e) => { e.stopPropagation(); setViewItem(item); }}
                                        >
                                            <Eye size={14} /> Chi tiết
                                        </button>
                                        {item.is_selling === 1 ? (
                                            <button 
                                                className="flex-1 flex justify-center items-center py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition-colors active:scale-95 text-xs font-bold gap-1.5"
                                                onClick={(e) => { e.stopPropagation(); handleCancelSell(item); }}
                                            >
                                                <Ban size={14} /> Hủy bán
                                            </button>
                                        ) : (
                                            <button 
                                                className="flex-1 flex justify-center items-center py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-colors active:scale-95 text-xs font-bold gap-1.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setResellItem(item);
                                                    setResellQty(1);
                                                    setResellPrice("");
                                                    setTotalCost("");
                                                    setHouseSearchTerm(""); 
                                                    const defaultHouse = houses[0] || null;
                                                    setTargetHouse(defaultHouse?.id || "");
                                                    if (defaultHouse?.type === 'food') setCalcMethod("food");
                                                    else setCalcMethod("normal");
                                                }}
                                            >
                                                <Coins size={14} /> Bán lại
                                            </button>
                                        )}
                                        <button 
                                            className="w-10 flex justify-center items-center py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditItem(item);
                                                setEditQty(item.quantity);
                                            }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            className="w-10 flex justify-center items-center py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors active:scale-95"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>

        {/* Bulk Action Bar */}
        <div className={`bulk-action-bar ${isSelectMode ? 'active' : ''}`}>
            <div className="bulk-info">
                Đã chọn <span>{selectedIds.length}</span> sản phẩm
            </div>
            <div className="bulk-btns">
                <button onClick={handleSelectAll} className="Btn btn-scifi-custom" title={selectedIds.length === filteredItems.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}>
                    <span className="svgIcon"><Shield size={18} /></span>
                    <span className="text">{selectedIds.length === filteredItems.length ? 'Bỏ chọn' : 'Tất cả'}</span>
                </button>
                <button 
                    onClick={handleBulkDelete} 
                    className="Btn btn-delete"
                    disabled={selectedIds.length === 0}
                    title={`Xóa ${selectedIds.length} món`}
                >
                    <span className="svgIcon"><Trash2 size={18} /></span>
                    <span className="text">Xoá ({selectedIds.length})</span>
                </button>
                <button onClick={toggleSelectMode} className="Btn btn-scifi-custom" title="Hủy chọn">
                    <span className="svgIcon"><Ban size={18} /></span>
                    <span className="text">Hủy</span>
                </button>
            </div>
        </div>

        {/* Footer */}
        <footer className="footer">
              Được Phát Triển Bởi Duy Đẹp Trai. Liên Hệ Gmai Để Được Hỗ Trợ
        </footer>

        {/* Modals (Identical Logic, Wrapped in Divs) */}
        
        {/* Resell Modal */}
        {resellItem && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                <div className="modal-box fire-modal w-full max-w-lg">
                    <h3 className="font-bold text-lg mb-4">Đăng bán: {resellItem.name}</h3>
                    
                    {houses.length === 0 && (
                        <div className="alert alert-warning text-xs py-2 mb-4 bg-yellow-900/50 text-yellow-200 border-yellow-700">
                            ⚠️ Không tìm thấy Nhà nào. Bạn cần tham gia một Nhà trước khi bán hàng!
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label text-xs font-semibold">Chọn Nhà để bán</label>
                            
                            {/* House Search Input */}
                            <div className="w-full mb-4">
                                <SciFiSearch 
                                    placeholder="🔍 Tìm nhà..." 
                                    value={houseSearchTerm}
                                    onChange={(e) => setHouseSearchTerm(e.target.value)}
                                    scale={0.9} // Slight scale down to fit nicely
                                    theme="fire"
                                />
                            </div>

                            <select 
                                className="select select-bordered w-full" 
                                value={targetHouse} 
                                onChange={e => {
                                    const houseId = e.target.value;
                                    setTargetHouse(houseId);
                                    const selectedHouse = houses.find(h => h.id == houseId);
                                    if (selectedHouse?.type === 'food') {
                                        setCalcMethod('food');
                                    } else {
                                        setCalcMethod('normal');
                                    }
                                }}
                            >
                                <option value="" disabled>-- Chọn Nhà --</option>
                                {houses
                                    .filter(h => h.name.toLowerCase().includes(houseSearchTerm.toLowerCase()))
                                    .map(h => (
                                    <option key={h.id} value={h.id}>{h.name} {h.type === 'food' ? '(Dịch vụ/Ăn uống)' : ''}</option>
                                ))}
                            </select>
                            {houses.filter(h => h.name.toLowerCase().includes(houseSearchTerm.toLowerCase())).length === 0 && (
                                <span className="text-xs text-error mt-1">Không tìm thấy nhà nào khớp với từ khóa.</span>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label text-xs font-semibold">Cách tính tiền</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-slate-700 flex-1 hover:bg-slate-800 transition-colors">
                                    <input type="radio" className="radio radio-primary radio-sm" name="calcMethod" checked={calcMethod === 'normal'} onChange={() => setCalcMethod('normal')} />
                                    <span className="text-xs font-medium text-slate-300">Thường</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-slate-700 flex-1 hover:bg-slate-800 transition-colors">
                                    <input type="radio" className="radio radio-secondary radio-sm" name="calcMethod" checked={calcMethod === 'food'} onChange={() => {
                                        setCalcMethod('food');
                                        if (totalCost && resellQty) {
                                            const price = Math.ceil(parseInt(totalCost.replace(/\./g, '')) / parseInt(resellQty));
                                            setResellPrice(price.toLocaleString('vi-VN'));
                                        }
                                    }} />
                                    <span className="text-xs font-medium text-slate-300">Ăn uống (Chia SL)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4">
                             <div className="form-control flex-1">
                                <label className="label text-xs font-semibold">Số lượng bán</label>
                                <input 
                                    type="number" 
                                    className="input input-bordered" 
                                    min="1" 
                                    max={resellItem.quantity}
                                    value={resellQty} 
                                    onChange={e => {
                                        const qty = e.target.value === "" ? "" : parseInt(e.target.value);
                                        setResellQty(qty);
                                        if (calcMethod === 'food' && totalCost) {
                                            const validQty = qty || 1;
                                            const price = Math.ceil(parseInt(totalCost.replace(/\./g, '')) / validQty);
                                            setResellPrice(price.toLocaleString('vi-VN'));
                                        }
                                    }} 
                                />
                            </div>

                            {calcMethod === 'food' ? (
                                <div className="form-control flex-1">
                                    <label className="label text-xs text-secondary font-semibold">Tổng tiền</label>
                                    <div className="relative">
                                        <input 
                                            className="input input-bordered w-full font-mono text-secondary focus:border-secondary pr-12" 
                                            placeholder="Tổng bill..."
                                            value={totalCost} 
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                setTotalCost(val);
                                                const rawVal = parseInt(val.replace(/\./g, '')) || 0;
                                                const qty = parseInt(resellQty) || 1;
                                                const price = Math.ceil(rawVal / qty);
                                                setResellPrice(price.toLocaleString('vi-VN'));
                                            }} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#e64f25]">VNĐ</span>
                                    </div>
                                </div>
                            ) : null}

                            <div className="form-control flex-1">
                                <label className="label text-xs text-warning font-bold">Giá {calcMethod === 'food' ? '(Tự tính)' : '(Bán)'}</label>
                                <div className="relative">
                                    <input 
                                        className="input input-bordered w-full font-mono text-warning focus:border-warning pr-12" 
                                        value={resellPrice} 
                                        readOnly={calcMethod === 'food'}
                                        onChange={e => {
                                            if (calcMethod === 'food') return;
                                            const val = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                            setResellPrice(val);
                                        }} 
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">VNĐ</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-action mt-6">
                            <button type="button" onClick={() => {
                                console.log("Closing Resell Modal");
                                setResellItem(null);
                            }} className="btn btn-ghost hover:bg-white/10">Hủy</button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    console.log("Submit clicked, calling handleResellSubmit");
                                    handleResellSubmit();
                                }} 
                                className="btn btn-primary px-8 border-none"
                                disabled={!targetHouse || !resellPrice}
                            >
                                Đăng bán ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Modal - Standard UI */}
        {editItem && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                <div className="modal-box bg-white/95 backdrop-blur-xl border border-white/40 w-full max-w-lg shadow-2xl">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Cập nhật kho: {editItem.name}</h3>
                     <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                        <p className="text-sm text-slate-500">Điều chỉnh số lượng hàng bạn đang giữ.</p>
                        <div className="form-control">
                            <label className="label text-slate-600 text-xs font-semibold">Số lượng</label>
                            <input 
                                type="number" 
                                className="input input-bordered bg-slate-50 text-slate-800 border-slate-200 focus:border-primary-custom" 
                                min="0" 
                                value={editQty} 
                                onChange={e => setEditQty(e.target.value === "" ? "" : parseInt(e.target.value))} 
                                required 
                            />
                            <label className="label">
                                <span className="label-text-alt text-warning">Nếu đặt 0, vật phẩm sẽ bị xóa khỏi kho.</span>
                            </label>
                        </div>
                        <div className="modal-action mt-6">
                             <button type="button" onClick={() => setEditItem(null)} className="btn btn-ghost text-slate-500 hover:text-slate-700 hover:bg-slate-100">Hủy</button>
                            <button type="submit" className="btn btn-primary px-8">Lưu thay đổi</button>
                        </div>
                     </form>
                </div>
            </div>
        )}

        {/* View Details Modal */}
        {viewItem && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setViewItem(null)}>
                <div 
                    className="bg-[#111a33] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative aspect-[4/3] bg-black/50 flex items-center justify-center overflow-hidden">
                        {viewItem.image_url ? (
                            <img src={getImageUrl(viewItem.image_url)} alt={viewItem.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-6xl p-10 opacity-30">📦</div>
                        )}
                        <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-md border ${viewItem.is_selling === 1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                            {viewItem.is_selling === 1 ? 'Đang bán' : 'Trong kho'}
                        </span>
                        
                        <button 
                            className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                            onClick={() => setViewItem(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6 gap-4 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight mb-1">{viewItem.name}</h3>
                                <p className="text-slate-400 text-sm flex items-center gap-1">
                                    <ShoppingCart size={14} className="opacity-70" /> {viewItem.house_name || 'Không xác định'}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xl font-bold text-amber-400">
                                    {viewItem.price ? Number(viewItem.price).toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}
                                </div>
                                <div className="text-slate-400 text-sm mt-1 bg-white/5 inline-block px-2 py-0.5 rounded-md">
                                    Kho còn: <span className="font-bold text-white">{viewItem.quantity}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Người bán / Cung cấp</p>
                                <div className="text-slate-300 font-medium">
                                    {viewItem.seller_name || 'Hệ thống'}
                                </div>
                            </div>

                            {viewItem.description && (
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Mô tả sản phẩm</p>
                                    <div className="text-slate-300 text-sm leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto mt-1">
                                        {viewItem.description}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                             <button
                                className="flex-1 py-3 text-sm font-bold text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                                onClick={() => navigate(`/houses/${viewItem.house_id}`)}
                             >
                                 Đi tới Nhà
                             </button>
                             {viewItem.is_selling === 0 && (
                                 <button
                                    className="flex-1 py-3 text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        const item = viewItem;
                                        setViewItem(null);
                                        setResellItem(item);
                                        setResellQty(1);
                                        setResellPrice("");
                                        setTotalCost("");
                                        setHouseSearchTerm(""); 
                                        const defaultHouse = houses[0] || null;
                                        setTargetHouse(defaultHouse?.id || "");
                                        if (defaultHouse?.type === 'food') setCalcMethod("food");
                                        else setCalcMethod("normal");
                                    }}
                                 >
                                     <Coins size={16} /> Đăng Bán
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
