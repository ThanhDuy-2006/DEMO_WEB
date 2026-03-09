import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { MessageSquare, Camera, Package, Plus, Trash2, X, Shield, ShieldCheck, Check, Ban, ShoppingCart, AlertTriangle, RefreshCw, FileText, Upload, Wallet, History, CreditCard, ChevronRight, ShieldAlert } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import BackButton from "../components/common/BackButton";
import { SciFiSearch } from "../components/SciFiSearch";
import { HouseChat } from "../components/HouseChat";
import { HouseSkeleton } from "../components/common/Skeleton";
import ExcelTable from "../components/ExcelManagement/ExcelTable";
import { ReportModal } from "../components/ReportModal";
import "./House.css";

const removeAccents = (str) => {
  return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
};

export function HouseList() {
  const [houses, setHouses] = useState([]);
  const { user } = useAuth();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("excel");
  const [isImagesHidden, setIsImagesHidden] = useState(true);
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    const data = await api.get("/houses");
    setHouses(Array.isArray(data) ? data : []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("description", newDesc);
      formData.append("type", newType);
      
      if (useImageUrl && coverUrl) {
          formData.append("cover_url", coverUrl);
      } else {
          const fileInput = e.target.querySelector('input[name="cover_image"]');
          if (fileInput && fileInput.files[0]) {
              formData.append("cover_image", fileInput.files[0]);
          }
      }

      await api.post("/houses", formData, {
          headers: { "Content-Type": "multipart/form-data" }
      });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      toast.success("Tạo Nhà thành công!");
      loadHouses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHouses = houses.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <header className="house-page-header">
        <div>
          <h1>Cộng đồng Nhà</h1>
          <p>Quản lý và truy cập các cộng đồng bạn đang tham gia</p>
        </div>
        {user && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary-custom !p-0">
            <Plus className="svgIcon" />
            <span className="text">Tạo Nhà mới</span>
          </button>
        )}
      </header>

      {/* Sci-Fi Search Bar */}
      <div className="mb-10 flex justify-start">
          <div className="w-full max-w-xl">
            <SciFiSearch 
                placeholder="Tìm kiếm Nhà..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                showFilter={false}
            />
          </div>
      </div>

      {showCreate && (
        <div className="card glass mb-12 p-8 animate-fade-in max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6">Tạo Nhà mới</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-6">
            <div className="form-control">
                <label className="label text-muted text-xs uppercase font-bold">Tên Nhà</label>
                <input className="input" placeholder="Ví dụ: Chung cư A..." value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="form-control">
                <label className="label text-muted text-xs uppercase font-bold">Mô tả</label>
                <textarea className="input" placeholder="Mô tả ngắn về cộng đồng..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows="3" />
            </div>

            <div className="form-control">
                <label className="label text-muted text-xs uppercase font-bold">Mô hình hoạt động</label>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            className="radio radio-accent" 
                            name="houseType" 
                            checked={true} 
                            readOnly
                        />
                        <span className="text-white">Quản lý Excel (Công việc/Vật phẩm)</span>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Hệ thống quản lý công việc chung hoặc danh sách vật phẩm dưới dạng bảng Spreadsheet chuyên nghiệp.
                </p>
            </div>

            <div className="form-control">
                <label className="label text-muted text-xs uppercase font-bold">Ảnh bìa (Tùy chọn)</label>
                
                {/* Toggle Type */}
                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="coverType" className="radio radio-primary radio-sm" checked={!useImageUrl} onChange={() => setUseImageUrl(false)} />
                        <span className="text-sm">Tải ảnh lên</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="coverType" className="radio radio-primary radio-sm" checked={useImageUrl} onChange={() => setUseImageUrl(true)} />
                        <span className="text-sm">Link ảnh</span>
                    </label>
                </div>

                {useImageUrl ? (
                    <input 
                        type="url" 
                        className="input bg-white/5" 
                        placeholder="https://example.com/image.jpg" 
                        value={coverUrl} 
                        onChange={e => setCoverUrl(e.target.value)} 
                    />
                ) : (
                    <input 
                        type="file" 
                        accept="image/*,.jpn,.jpeg,.jpg,.png,.webp,.JPG,.JPN" 
                        className="file-input file-input-bordered w-full bg-white/5" 
                        onChange={e => e.target.files[0] && (e.target.file = e.target.files[0])} 
                        name="cover_image" 
                    />
                )}
                {useImageUrl && coverUrl && (
                    <div className="mt-2 h-32 rounded-lg overflow-hidden border border-white/10">
                        <img src={coverUrl} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} alt="Preview" />
                    </div>
                )}
            </div>
            <div className="flex gap-4 justify-end mt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary-custom !p-0">
                <X className="svgIcon" />
                <span className="text">Hủy bỏ</span>
              </button>
              <button type="submit" className="btn-primary-custom !p-0">
                <Check className="svgIcon" />
                <span className="text">Tạo Nhà</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="house-grid">
        {filteredHouses.map(h => (
          <div key={h.id} className="house-card group overflow-hidden relative">
            {/* Cover Image Background */}
            <div className="absolute inset-0 h-32 w-full z-0">
                {h.cover_image ? (
                    <img src={h.cover_image} alt={h.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
            </div>

            <div className="relative z-10 pt-28 px-4 pb-4">
                <div className="house-card-top mb-1.5 flex justify-between items-start gap-2">
                  <h3 className="text-xl font-bold text-white text-glow line-clamp-1 flex-1">{h.name}</h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`status-badge ${h.id % 2 === 0 ? 'active' : 'private'} !text-[10px] !py-0.5 !px-2 !leading-tight !bg-slate-800/80 !backdrop-blur-sm`}>
                        {h.id % 2 === 0 ? 'Hoạt động' : 'Riêng tư'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 backdrop-blur-sm">
                        📊 Quản lý Excel
                    </span>
                  </div>
                </div>
                <p className="house-desc text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px] !mt-1">{h.description || "Không có mô tả"}</p>
                <div className="house-meta flex justify-between text-[11px] text-primary-300 mb-4 font-mono">
                <span>👥 {h.member_count || 0} thành viên</span>
                <span>🛒 {h.product_count || 0} bài đăng</span>
                </div>
                <Link to={`/houses/${h.id}`} className="btn-primary-custom !w-full !p-0 !rounded-lg !h-10">
                  <ChevronRight className="svgIcon" />
                  <span className="text">Truy cập ngay</span>
                </Link>
            </div>
          </div>
        ))}
      </section>
      
      {filteredHouses.length === 0 && (
          <div className="text-center py-20">
              <p className="text-muted text-lg">Chưa có Nhà nào. Hãy tạo mới!</p>
          </div>
      )}
    </div>
  );
}

export function HouseDetail() {
  const toast = useToast();
  // --- DRAG AND DROP LOGIC (NEW) ---
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const filesArr = Array.from(droppedFiles);
      const excel = filesArr.find(f => f.name.match(/\.(xlsx|xls)$/i));
      const imgs = filesArr.filter(f => f.type.startsWith('image/'));
      
      if (excel) {
          setExcelFile(excel);
      }
      if (imgs.length > 0) {
          setImportImages(prev => {
              const current = prev ? Array.from(prev) : [];
              return [...current, ...imgs];
          });
      }
      
      if (!excel && imgs.length === 0) {
          toast.warn("Vui lòng chỉ kéo thả file Excel hoặc các file ảnh sản phẩm.");
      }
    }
  };

  const { id } = useParams();
  const [house, setHouse] = useState(null);
  const [role, setRole] = useState(null);
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  
  // Create Product Form State
  const [showCreate, setShowCreate] = useState(false);
  const [newProd, setNewProd] = useState({ 
      name: "", 
      description: "", 
      price: "", 
      quantity: 1,
      totalCost: "", // Only for 'food' type UI
      image: null 
  });
  
  const { user } = useAuth();
  const { socket, joinHouse, leaveHouse } = useSocket();
  const navigate = useNavigate();
  const [memberSearch, setMemberSearch] = useState("");
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [showChat, setShowChat] = useState(false); // Chat state
  const [isImagesHidden, setIsImagesHidden] = useState(false); // Default: Show images

  // Bulk Delete Products
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [productSelectedIds, setProductSelectedIds] = useState([]);
  
  // Excel Activity Tracking
  const [activeInExcel, setActiveInExcel] = useState([]); // List of user IDs who have checked something
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({ type: 'house', id: null });

  // Handle URL Params for Chat
  const [searchParams] = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');

  const [wallet, setWallet] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'transactions'
  const [transactions, setTransactions] = useState([]);
  const [transactionFilters, setTransactionFilters] = useState({
      date: '',
      userId: ''
  });

  const filteredTransactions = transactions.filter(t => {
      // Date filter (matches YYYY-MM-DD)
      const tDate = new Date(t.created_at);
      const transactionDateString = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
      const matchesDate = !transactionFilters.date || transactionDateString === transactionFilters.date;
      
      // User filter (matches user_id from backend)
      const matchesUser = !transactionFilters.userId || t.user_id === parseInt(transactionFilters.userId);
      return matchesDate && matchesUser;
  });

  // Member Sidebar Resize Logic
  const memberSidebarRef = React.useRef(null);
  const [memberSidebarHeight, setMemberSidebarHeight] = useState(450);
  const [isResizingMembers, setIsResizingMembers] = useState(false);

  const startResizingMembers = React.useCallback((e) => {
      e.preventDefault();
      setIsResizingMembers(true);
  }, []);

  const stopResizingMembers = React.useCallback(() => {
      setIsResizingMembers(false);
  }, []);

  const resizeMembers = React.useCallback((e) => {
      if (isResizingMembers && memberSidebarRef.current) {
          const newHeight = e.clientY - memberSidebarRef.current.getBoundingClientRect().top;
          if (newHeight > 150 && newHeight < 800) {
              setMemberSidebarHeight(newHeight);
          }
      }
  }, [isResizingMembers]);

  useEffect(() => {
      if (isResizingMembers) {
          window.addEventListener('mousemove', resizeMembers);
          window.addEventListener('mouseup', stopResizingMembers);
      } else {
          window.removeEventListener('mousemove', resizeMembers);
          window.removeEventListener('mouseup', stopResizingMembers);
      }
      return () => {
          window.removeEventListener('mousemove', resizeMembers);
          window.removeEventListener('mouseup', stopResizingMembers);
      };
  }, [isResizingMembers, resizeMembers, stopResizingMembers]);

  useEffect(() => {
    loadData();
    if (user) loadWallet();
    
    // Join house room for realtime updates
    joinHouse(id);
    
    return () => {
        leaveHouse(id);
    };
  }, [id, user]);

  // Realtime Listeners
  useEffect(() => {
      if (!socket) return;

      socket.on("productUpdated", (data) => {
          setProducts(prev => prev.map(p => 
              p.id === data.productId ? { ...p, quantity: data.newQuantity } : p
          ));
          setPendingProducts(prev => prev.map(p => 
              p.id === data.productId ? { ...p, quantity: data.newQuantity } : p
          ));
          loadTransactions(); // Auto-update transaction history across the house
      });

      // Wallet update is already handled globally in Layout, 
      // but we might want to update local wallet state if needed
      socket.on("walletUpdated", (data) => {
          setWallet(prev => prev ? { ...prev, balance: data.newBalance } : { balance: data.newBalance });
      });

      socket.on("houseUpdated", (data) => {
          setHouse(prev => ({ ...prev, ...data }));
      });

      return () => {
          socket.off("productUpdated");
          socket.off("walletUpdated");
          socket.off("houseUpdated");
      };
  }, [socket, id]);

  useEffect(() => {
     if (activeTab === 'transactions') {
         loadTransactions();
     }
  }, [activeTab]);

  const loadWallet = async () => {
      try {
          const data = await api.get("/wallets/me");
          setWallet(data);
      } catch (e) {
          console.error("Wallet load failed", e);
      }
  };

  const loadTransactions = async () => {
      try {
          const data = await api.get(`/products/house/${id}/transactions`);
          setTransactions(Array.isArray(data) ? data : []);
      } catch (e) {
          console.error("Transactions load failed", e);
      }
  };

  const handleBuyProduct = async (p) => {
      if (buyingId) return;
      if (!user) return toast.error("Vui lòng đăng nhập để mua hàng");
      if (p.quantity <= 0) return toast.error("Sản phẩm đã hết hàng");
      
      const price = parseFloat(p.unit_price);
      if (wallet && parseFloat(wallet.balance) < price) {
          return toast.error("Số dư ví không đủ. Vui lòng nạp thêm!");
      }

      // --- OPTIMISTIC UPDATE ---
      const oldWallet = { ...wallet };
      const oldProducts = [...products];

      // Update UI immediately
      setWallet(prev => prev ? { ...prev, balance: (parseFloat(prev.balance) - price).toString() } : prev);
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity - 1 } : item));
      setBuyingId(p.id);

      try {
          await api.post(`/products/${p.id}/buy`);
          toast.success(`Đã mua 1 ${p.name}!`);
          // Real data will be synced via Socket.IO events (productUpdated, walletUpdated)
      } catch (e) {
          // --- ROLLBACK ---
          setWallet(oldWallet);
          setProducts(oldProducts);
          toast.error(e.response?.data?.error || e.message || "Mua hàng thất bại");
      } finally {
          setBuyingId(null);
      }
  };

  useEffect(() => {
      const action = searchParams.get('action');
      if (action === 'chat') {
          setShowChat(true);
      }
  }, [searchParams]);

  const filteredMembers = activeMembers.filter(m => {
      const searchNorm = removeAccents(memberSearch);
      const nameNorm = removeAccents(m.full_name || "");
      const emailNorm = removeAccents(m.email || "");
      
      const matchesSearch = nameNorm.includes(searchNorm) || emailNorm.includes(searchNorm);
      
      if (house?.type === 'excel' && showOnlyInactive) {
          return matchesSearch && !activeInExcel.includes(m.id);
      }
      return matchesSearch;
  });

  // Load Data
  const loadData = async () => {
    try {
        const h = await api.get(`/houses/${id}`);
        setHouse(h);
        
        // Load active products safely
        const p1 = api.get(`/products?house_id=${id}&status=active`).catch(err => {
            console.error("Fetch products error:", err);
            return [];
        });
        
        // Load user role safely
        let p2 = Promise.resolve(null);
        if (user) {
            p2 = api.get(`/houses/${id}/membership`).then(r => r.role).catch(() => null);
        }

        const [prods, myRole] = await Promise.all([p1, p2]);
        setProducts(Array.isArray(prods) ? prods : []);
        setRole(myRole);

        // If owner or admin, load pending products & members
        if (myRole === 'owner' || user?.role === 'admin') {
             const pending = await api.get(`/products?house_id=${id}&status=pending`).catch(() => []);
             setPendingProducts(Array.isArray(pending) ? pending : []);
             loadMembers();
        }

    } catch (e) {
        console.error("Load house data error:", e);
        if (!house) navigate("/houses");
    }
  };

  const loadMembers = async () => {
      try {
        const pMembers = await api.get(`/houses/${id}/members?status=pending`);
        setPendingMembers(Array.isArray(pMembers) ? pMembers : []);
        
        const all = await api.get(`/houses/${id}/members`);
        const safeAll = Array.isArray(all) ? all : [];
        // Filter to show existing members (including owner, admin)
        setActiveMembers(safeAll.filter(m => m.role === 'member' || m.role === 'owner' || m.role === 'admin'));
      } catch (e) {
          console.error("Load members error:", e);
          setActiveMembers([]); 
      }
  };

  // Actions
  const handleJoin = async () => {
    try {
      await api.post(`/houses/${id}/memberships`);
      loadData();
      toast.info("Đã gửi yêu cầu tham gia!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMemberAction = async (userId, status) => {
      try {
          await api.patch(`/houses/${id}/memberships/${userId}`, { status });
          toast.success(status === 'member' ? "Đã duyệt thành viên!" : "Đã từ chối!");
          loadMembers();
      } catch (e) {
          toast.error(e.message);
      }
  };

  const handleDeleteMember = async (userId) => {
      const ok = await toast.confirm("Bạn có chắc muốn xóa thành viên này?");
      if(!ok) return;
      try {
          await api.patch(`/houses/${id}/memberships/${userId}`, { status: 'rejected' });
          toast.success("Đã xóa thành viên!");
          loadMembers();
      } catch(e) {
          toast.error(e.message);
      }
  };

  const handleDelete = async (pid) => {
      const ok = await toast.confirm("Bạn có chắc muốn xóa sản phẩm này không?");
      if (!ok) return;
      try {
          await api.delete(`/products/${pid}`);
          toast.success("Đã xóa sản phẩm!");
          loadData();
      } catch (e) {
          toast.error(e.response?.data?.error || e.message);
      }
  };

  const toggleProductSelect = (pid) => {
      setProductSelectedIds(prev => 
          prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
      );
  };

  const toggleSelectAllProducts = () => {
      if (productSelectedIds.length === products.length) {
          setProductSelectedIds([]);
      } else {
          setProductSelectedIds(products.map(p => p.id));
      }
  };

  const handleBulkDeleteProducts = async () => {
      if (productSelectedIds.length === 0) return;
      const ok = await toast.confirm(`Bạn có chắc muốn xóa ${productSelectedIds.length} sản phẩm đã chọn?`);
      if (!ok) return;

      try {
          await api.post("/products/bulk-delete", { productIds: productSelectedIds });
          toast.success(`Đã xóa thành công ${productSelectedIds.length} sản phẩm!`);
          setIsSelectMode(false);
          setProductSelectedIds([]);
          loadData();
      } catch (e) {
          toast.error("Xóa thất bại: " + (e.response?.data?.error || e.message));
      }
  };

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  const handleToggleSelect = (pid) => {
      setSelectedIds(prev => 
          prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
      );
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) setSelectedIds(pendingProducts.map(p => p.id));
      else setSelectedIds([]);
  };

  const handleBulkApprove = async (status) => {
      if (selectedIds.length === 0) return;
      try {
          await api.patch("/products/bulk-status", { productIds: selectedIds, status });
          toast.success("Đã cập nhật trạng thái!");
          setSelectedIds([]);
          loadData();
      } catch (e) {
          toast.error(e.message);
      }
  };

  const handleApproveOne = async (id, status) => {
      try {
          await api.patch(`/products/${id}/status`, { status });
          toast.success(status === 'active' ? "Đã duyệt!" : "Đã từ chối!");
          loadData();
      } catch (e) {
          toast.error(e.message);
          loadData();
      }
  };

  const handleCreateProduct = async (e) => {
      e.preventDefault();
      try {
          const formData = new FormData();
          formData.append("house_id", id);
          formData.append("name", newProd.name);
          formData.append("description", newProd.description || "");
          
          // If totalCost exists (Food mode), send that as the 'price' base
          const submitPrice = newProd.totalCost ? newProd.totalCost : newProd.price;
          formData.append("price", submitPrice);
          formData.append("quantity", newProd.quantity);

          if (newProd.image) {
              formData.append("image", newProd.image);
          }

          await api.post("/products", formData, {
              headers: { "Content-Type": "multipart/form-data" }
          });

          toast.success("Sản phẩm đã tạo và đang chờ duyệt!");
          setShowCreate(false);
          setNewProd({ name: "", description: "", price: "", quantity: 1, totalCost: "", image: null });
          
          if (role === 'owner' || user?.role === 'admin') {
              // Refresh pending list explicitly if owner
              const pending = await api.get(`/products?house_id=${id}&status=pending`);
              setPendingProducts(Array.isArray(pending) ? pending : []);
          }
      } catch (e) {
          toast.error(e.message);
      }
  };
  const handleAddToCart = async (product) => {
      if (product.quantity <= 0) return toast.error("Sản phẩm đã hết hàng");
      try {
          await api.post("/cart/add", { product_id: product.id, qty: 1 });
          toast.success("Đã thêm vào giỏ hàng!");
      } catch (e) {
          toast.error(e.message);
      }
  };

  const [importImages, setImportImages] = useState([]);
  const [excelFile, setExcelFile] = useState(null);

  const handleImportSubmit = async () => {
      if (!excelFile) {
          toast.warn("Vui lòng chọn file Excel!");
          return;
      }

      const formData = new FormData();
      formData.append("house_id", id);
      formData.append("file", excelFile);
      
      // Append images if any
      if (importImages && importImages.length > 0) {
          for (let i = 0; i < importImages.length; i++) {
              formData.append("images", importImages[i]);
          }
      }
      
      try {
          const res = await api.post(`/products/import?house_id=${id}`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
          });
          
          toast.success(res.message || "Import thành công!");
          setShowCreate(false);
          setImportImages([]);
          setExcelFile(null);
          loadData();
      } catch (err) {
          console.error(err);
          toast.error("Import thất bại: " + (err.response?.data?.error || err.message));
      }
  };

  const handleUpdateCover = async (e) => {
      let formData = new FormData();
      
      if (e.target.type === 'url') {
          if (!e.target.value) return;
          formData.append("cover_url", e.target.value);
      } else {
          const file = e.target.files[0];
          if (!file) return;
          formData.append("cover_image", file);
      }

      try {
          await api.patch(`/houses/${id}/cover`, formData, {
               headers: { "Content-Type": "multipart/form-data" }
          });
          
          toast.success("Đã cập nhật ảnh bìa!");
          loadData();
      } catch(err) {
          toast.error(err.message);
      }
  };

  const handleDeleteCover = async () => {
      const ok = await toast.confirm("Bạn có chắc muốn xóa ảnh bìa?");
      if (!ok) return;
      try {
          await api.delete(`/houses/${id}/cover`);
          toast.success("Đã xóa ảnh bìa!");
          loadData();
      } catch (err) {
          toast.error(err.message);
      }
  };

  const handleDeleteHouse = async () => {
      const ok1 = await toast.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ nhà này? Mọi sản phẩm, thành viên và dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục!", { title: "CẢNH BÁO NGUY HIỂM", confirmLabel: "Xóa vĩnh viễn" });
      if (!ok1) return;
      
      const ok2 = await toast.confirm("Xác nhận lần cuối: Bạn thực sự muốn xóa nhà này?", { title: "XÁC NHẬN LẦN CUỐI" });
      if (!ok2) return;
      
      try {
          await api.delete(`/houses/${id}`);
          toast.success("Đã xóa nhà thành công!");
          navigate("/houses");
      } catch (err) {
          toast.error("Lỗi khi xóa nhà: " + (err.response?.data?.error || err.message));
      }
  };

  if (!house) return <HouseSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 house-detail-container animate-fade-in relative">
      <BackButton fallbackPath="/houses" label="Quay lại danh sách" className="mb-4" />
      
      {/* 1. HOUSE OVERVIEW */}
      <section className="house-overview relative overflow-hidden rounded-2xl mb-8 border border-white/10 group">
        {/* Cover Image Background */}
        <div 
            className={`absolute inset-0 z-0 group-hover:opacity-90 transition-opacity select-none ${isEditingCover ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onDoubleClick={() => {
                if ((role === 'owner' || user?.role === 'admin') && !isEditingCover) {
                    setIsEditingCover(true);
                }
            }}
            onMouseDown={(e) => {
                if (!isEditingCover) return;
                
                const img = e.currentTarget.querySelector('img');
                if (!img) return;

                e.preventDefault();
                const startY = e.clientY;
                
                // Parse start position safely
                let currentPosVal = 50;
                const currentPosStr = img.style.objectPosition.split(' ')[1];
                if (currentPosStr && currentPosStr.includes('%')) {
                     currentPosVal = parseFloat(currentPosStr);
                }
                
                const startPos = currentPosVal;
                
                const onMouseMove = (moveEvent) => {
                    moveEvent.preventDefault();
                    const deltaY = moveEvent.clientY - startY;
                    const sensitivity = 0.3; 
                    let newPos = startPos - (deltaY * sensitivity);
                    newPos = Math.max(0, Math.min(100, newPos)); 
                    img.style.objectPosition = `center ${newPos}%`;
                };

                const onMouseUp = () => {
                   document.removeEventListener('mousemove', onMouseMove);
                   document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }}
            title={role === 'owner' || user?.role === 'admin' ? (isEditingCover ? "Kéo để chỉnh" : "Nhấp đúp để chỉnh vị trí") : ""}
        >
            {house.cover_image ? (
                <img 
                    src={house.cover_image} 
                    className={`w-full h-full object-cover transition-all duration-0 ${!isEditingCover ? 'pointer-events-none' : ''}`}
                    style={{ objectPosition: house.cover_position || 'center 50%' }}
                    alt="Cover" 
                    draggable={false}
                    id="cover-img-preview"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 opacity-50"></div>
            )}
            <div className={`absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/80 to-transparent pointer-events-none transition-opacity ${isEditingCover ? 'opacity-0' : 'opacity-100'}`}></div>
            
            {(role === 'owner' || user?.role === 'admin') && !isEditingCover && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    ↕ Nhấp đúp để chỉnh vị trí
                </div>
            )}

            {isEditingCover && (
                <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-50 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-xl cursor-default"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="text-white/80 text-xs flex items-center mr-2 font-medium">
                        ✨ Kéo ảnh để chỉnh
                    </span>
                    <button 
                        className="btn btn-sm btn-primary border-none shadow-none hover:scale-105 transition-transform"
                        onClick={async () => {
                            const img = document.getElementById('cover-img-preview');
                            const finalPos = img.style.objectPosition.split(' ')[1];
                             try {
                                await api.patch(`/houses/${id}/cover-position`, { cover_position: `center ${finalPos}` });
                                setIsEditingCover(false);
                                toast.success("Đã lưu vị trí ảnh bìa!");
                            } catch (err) {
                                console.error("Failed to save position", err);
                                toast.error("Lỗi khi lưu vị trí!");
                            }
                        }}
                    >
                        💾 Lưu
                    </button>
                    <button 
                        className="btn btn-sm bg-white/10 text-white hover:bg-white/20 border-none shadow-none hover:scale-105 transition-transform"
                        onClick={() => {
                            setIsEditingCover(false);
                            const img = document.getElementById('cover-img-preview');
                            img.style.objectPosition = house.cover_position || 'center 50%';
                        }}
                    >
                        ❌ Hủy
                    </button>
                </div>
            )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white text-glow tracking-tighter uppercase whitespace-nowrap">{house.name}</h1>
            </div>
            <p className="text-gray-300 max-w-2xl text-lg">{house.description || "Hệ thống quản lý vật phẩm và công việc"}</p>
            <div className="flex gap-4 mt-4 text-sm font-mono text-primary-300">
                <span className="bg-black/40 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-inner">👥 {activeMembers.length} thành viên</span>
                <span className="bg-black/40 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-inner">🛒 {products.length} sản phẩm</span>
                
                {/* WALLET DISPLAY (Sci-Fi Style) - READ ONLY */}
                {user && (
                    <div className="group relative flex items-center gap-2 bg-indigo-500/10 px-4 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                         <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                         <Wallet size={14} className="text-indigo-400" />
                         <span className="text-indigo-400 font-bold uppercase tracking-tighter text-[11px]">Ví của tôi:</span>
                         <span className="text-white font-black text-xs">{wallet ? Number(wallet.balance).toLocaleString() : '0'}đ</span>
                    </div>
                )}
            </div>
            </div>
            
            <div className="flex flex-col gap-2 items-start md:items-end w-full md:w-auto">
                <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
                    {/* CHAT BUTTON */}
                    {(role === 'owner' || role === 'member' || user?.role === 'admin') && (
                        <button 
                            onClick={() => setShowChat(true)}
                            className="Btn btn-scifi-custom !bg-indigo-600/20 !text-indigo-400 !border-indigo-500/30"
                        >
                            <span className="svgIcon"><MessageSquare size={20} /></span>
                            <span className="text">Trò chuyện</span>
                        </button>
                    )}

                    {/* Delete Cover (if exists) */}
                    {(role === 'owner' || role === 'member' || user?.role === 'admin') && house.cover_image && (
                         <button onClick={handleDeleteCover} className="Btn btn-delete" title="Xóa ảnh bìa">
                            <span className="svgIcon"><Trash2 size={20} /></span>
                            <span className="text">Xóa bìa</span>
                        </button>
                    )}

                    {/* DELETE HOUSE - OWNER/ADMIN ONLY */}
                    {(role === 'owner' || user?.role === 'admin') && (
                        <button 
                            onClick={handleDeleteHouse} 
                            className="Btn btn-delete !bg-red-600/20 !text-red-400 !border-red-500/30" 
                            title="Xóa toàn bộ nhà"
                        >
                            <span className="svgIcon"><Trash2 size={20} /></span>
                            <span className="text">Xóa nhà</span>
                        </button>
                    )}

                    {/* ACTIONS FOR OWNER/ADMIN */}
                    
                    {/* Report House Button */}
                    {user && (
                        <button 
                            onClick={() => { setReportConfig({ type: 'house', id: id }); setShowReportModal(true); }}
                            className="Btn btn-scifi-custom !bg-red-600/10 !text-red-400 !border-red-500/20"
                            title="Báo cáo vi phạm"
                        >
                            <span className="svgIcon"><ShieldAlert size={20} /></span>
                            <span className="text">Báo cáo</span>
                        </button>
                    )}

                    {(role === 'owner' || role === 'member' || user?.role === 'admin') && !isEditingCover && (
                        <>
                            {/* Update Cover */}
                            <button 
                                onClick={() => document.getElementById('update_cover_modal').showModal()}
                                className="Btn btn-scifi-custom"
                            >
                                <span className="svgIcon"><Camera size={20} /></span>
                                <span className="text">Sửa ảnh</span>
                            </button>

                             {/* Warehouse */}
                             <Link to={`/houses/${id}/warehouse`} className="Btn btn-view !bg-blue-600/20 !text-blue-400 !border-blue-500/30">
                                <span className="svgIcon"><Package size={20} /></span>
                                <span className="text">Kho Hàng</span>
                            </Link>

                            {/* Create Product */}
                            <button onClick={() => setShowCreate(!showCreate)} className="Btn btn-scifi-custom !bg-blue-600/40 !text-white !border-blue-400/50">
                                <span className="svgIcon">{showCreate ? <X size={20} /> : <Plus size={20} />}</span>
                                <span className="text">{showCreate ? 'Đóng' : 'Đăng bán'}</span>
                            </button>

                            {/* Update Cover Modal */}
                            <dialog id="update_cover_modal" className="modal">
                                <div className="modal-box bg-[#1a1f2e] border border-white/10 text-left">
                                    <form method="dialog">
                                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                                    </form>
                                    <h3 className="font-bold text-lg mb-4 text-white">📷 Cập nhật ảnh bìa</h3>
                                    
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-4">
                                            <span className="label-text text-white">Loại ảnh:</span>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="updateCoverType" className="radio radio-sm radio-primary" defaultChecked onClick={() => {
                                                    document.getElementById('update-cover-file').classList.remove('hidden');
                                                    document.getElementById('update-cover-url').classList.add('hidden');
                                                }}/>
                                                <span className="label-text text-sm">Tải ảnh lên</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="updateCoverType" className="radio radio-sm radio-primary" onClick={() => {
                                                    document.getElementById('update-cover-file').classList.add('hidden');
                                                    document.getElementById('update-cover-url').classList.remove('hidden');
                                                }}/>
                                                <span className="label-text text-sm">Link ảnh</span>
                                            </label>
                                        </label>

                                        {/* File Input */}
                                        <input 
                                            type="file" 
                                            id="update-cover-file" 
                                            className="file-input file-input-bordered file-input-md w-full mt-2 bg-black/20" 
                                            accept="image/*,.jpn,.jpeg,.jpg,.png,.webp,.JPG,.JPN"
                                        />
                                        
                                        {/* URL Input */}
                                        <input 
                                            type="text" 
                                            id="update-cover-url" 
                                            placeholder="Dán link ảnh tại đây..." 
                                            className="input input-bordered w-full mt-2 hidden bg-black/20" 
                                        />

                                        <div className="modal-action">
                                            <button className="btn btn-primary" onClick={() => {
                                                 const fileInput = document.getElementById('update-cover-file');
                                                 const urlInput = document.getElementById('update-cover-url');
                                                 // Mock event
                                                 const isUrl = !urlInput.classList.contains('hidden');
                                                 const mockEvent = {
                                                     target: {
                                                         type: isUrl ? 'url' : 'file',
                                                         value: isUrl ? urlInput.value : '',
                                                         files: fileInput.files
                                                     }
                                                 };
                                                 handleUpdateCover(mockEvent);
                                                 document.getElementById('update_cover_modal').close();
                                            }}>Lưu thay đổi</button>
                                        </div>
                                    </div>
                                </div>
                            </dialog>
                        </>
                    )}

                    {/* Join Button for Non-Members */}
                    {!role && user && (
                        <button onClick={handleJoin} className="btn-primary btn-sm">Tham gia Nhà</button>
                    )}
                </div>
            </div>
        </div>
      </section>
       
       {/* House Chat Modal */}
       {showChat && (
           <HouseChat 
               houseId={id} 
               currentUserId={user?.id} 
               onClose={() => setShowChat(false)} 
               initialConversationId={initialConversationId}
            />
       )}

       {/* CREATE FORM (Conditional) */}
      {showCreate && (
          <div className="card glass mb-8 animate-fade-in border border-primary/20 shadow-lg shadow-primary/5">
              <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-bold text-white">📝 Đăng bán sản phẩm mới</h3>
              </div>
              
              <div className="p-6">
                  <div className="max-w-xl mx-auto">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-bold text-success mb-4 uppercase tracking-wider text-center">Import Sản phẩm từ Excel & Ảnh</p>
                        
                        {/* Drag & Drop Area */}
                        <div 
                            className={`border-2 border-dashed rounded-xl p-4 flex flex-col gap-4 transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-white/10 bg-black/20'}`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="text-center py-2">
                                <span className="text-2xl mb-1 block">{isDragging ? '📥' : '📄'}</span>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Kéo thả File Excel hoặc Ảnh vào đây</p>
                            </div>

                            <div className="h-px bg-white/5 w-full"></div>

                            {/* Excel Options */}
                            <div>
                                <label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">1. File Excel (.xlsx)</label>
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls" 
                                    className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white" 
                                    onChange={(e) => setExcelFile(e.target.files[0])}
                                />
                                {excelFile && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                                         <span>✓</span>
                                         <span className="truncate">{excelFile.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Image Options */}
                            <div>
                                 <label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">2. Ảnh SP (Nếu cần)</label>
                                 <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white"
                                    onChange={(e) => setImportImages(e.target.files)}
                                 />
                                 {importImages?.length > 0 && (
                                     <div className="mt-1 flex items-center gap-1 text-[10px] text-green-400 font-bold">
                                         <span>📸</span>
                                         <span>Đã chọn {importImages.length} ảnh</span>
                                     </div>
                                 )}
                            </div>

                            {/* Submit Button */}
                            <button 
                                onClick={handleImportSubmit}
                                disabled={!excelFile}
                                className={`btn btn-sm btn-primary w-full disabled:opacity-50 mt-2 ${excelFile ? 'animate-pulse' : ''}`}
                            >
                                🚀 Tiến hành Import
                            </button>

                            {/* Instructions */}
                            <div className="bg-black/30 p-3 rounded text-[10px] text-muted font-mono text-left">
                                <div className="flex justify-between items-center mb-2">
                                     <span className="text-white/40">Yêu cầu cột:</span>
                                     <a href="/sample_products.xlsx" download className="text-blue-400 hover:underline">⬇ Tải mẫu</a>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 opacity-60">
                                    <p className="text-success">Name</p>
                                    <p className="text-success">Price</p>
                                    <p className="text-success">Qty</p>
                                    <p className="text-success">Desc</p>
                                </div>
                                
                                <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                                    <p className="text-yellow-500 font-bold">Lưu ý:</p>
                                    <p>• Điền <span className="text-white">Tên Ảnh</span> vào cột Image.</p>
                                    <p>• Kéo toàn bộ ảnh vào ô trên.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. EXCEL TABLE (Optional) */}
      {house.type === 'excel' && (
          <section className="mb-8">
              <ExcelTable 
                houseId={id} 
                myRole={role || (user?.role === 'admin' ? 'admin' : null)} 
                user={user} 
                onActivityChange={(userIds) => setActiveInExcel(userIds)}
              />
          </section>
      )}

      {/* 3. MAIN LAYOUT (Columns) */}
      <section className={`house-detail-layout ${(role === 'owner' || user?.role === 'admin') ? 'with-approve' : ''} ${house.type === 'excel' ? 'excel-mode' : ''}`}>

        {/* LEFT: MEMBERS */}
        <aside className="members-sidebar">
          <h3>👥 Thành viên</h3>
          
          {/* Member Search */}
          <div className="mb-4 space-y-3">
              <SciFiSearch 
                  placeholder="Tìm..." 
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  showFilter={false}
              />
              {house?.type === 'excel' && (
                  <button 
                    onClick={() => setShowOnlyInactive(!showOnlyInactive)}
                    className={`text-[10px] uppercase font-bold tracking-tighter w-full py-1.5 rounded border transition-colors ${showOnlyInactive ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                  >
                    {showOnlyInactive ? '⚡ Đang hiện: Không hoạt động' : `🔍 Lọc: Chưa hoạt động (${activeMembers.filter(m => !activeInExcel.includes(m.id)).length})`}
                  </button>
              )}
          </div>

          <div 
            ref={memberSidebarRef}
            className="flex flex-col relative"
            style={{ height: `${memberSidebarHeight}px` }}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
                {filteredMembers.map(m => (
                  <div key={m.id} className={`member-item ${m.role === 'owner' ? 'admin' : ''} ${house?.type === 'excel' && !activeInExcel.includes(m.id) ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col">
                      <span className="text-sm">{m.role === 'owner' ? '👑' : '🟢'} {m.full_name || m.email}</span>
                      {(house?.type === 'excel' && !activeInExcel.includes(m.id)) && (
                          <span className="text-[9px] text-orange-500/70 font-bold uppercase tracking-widest leading-none mt-0.5">Không hoạt động</span>
                      )}
                    </div>
                    {/* Report & Delete Actions */}
                    <div className="ml-auto flex items-center gap-1">
                        {/* Report User */}
                        {user && m.id !== user.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setReportConfig({ type: 'user', id: m.id }); setShowReportModal(true); }}
                                className="text-xs text-yellow-500/50 hover:text-yellow-400 p-1 rounded hover:bg-white/5 transition"
                                title="Báo cáo người này"
                            >
                                <ShieldAlert size={12} />
                            </button>
                        )}

                        {/* Delete button only if admin/owner and not self */}
                        {( (role === 'owner' || user?.role === 'admin') && m.id !== user?.id && m.role !== 'owner' ) && (
                            <button onClick={() => handleDeleteMember(m.id)} className="text-xs text-red-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition">✕</button>
                        )}
                    </div>
                  </div>
                ))}
                {filteredMembers.length === 0 && <p className="text-muted text-sm px-2">Không tìm thấy.</p>}
            </div>

            {/* Tap Bar for Resizing */}
            <div 
                className={`excel-grab-bar min-h-[16px] !h-[16px] !rounded-b-xl !bg-white/5 border-none mt-2 ${isResizingMembers ? 'resizing' : ''}`}
                onMouseDown={startResizingMembers}
            >
                <div className="grab-handle !gap-1">
                    <div className="dots !gap-1">
                        <span className="!w-1 !h-1"></span><span className="!w-1 !h-1"></span><span className="!w-1 !h-1"></span>
                    </div>
                </div>
            </div>
          </div>
        </aside>

        {/* CENTER: PRODUCTS & HISTORY */}
        <main className="products-center">
            {/* TABS HEADER */}
            <div className="flex gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-6 w-fit backdrop-blur-md">
                 {house.type !== 'excel' && (
                     <button 
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                     >
                        <Package size={14} />
                        Gian hàng
                     </button>
                 )}
                 <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'transactions' || (house.type === 'excel' && activeTab === 'products') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                 >
                    <History size={14} />
                    {house.type === 'excel' ? 'Lịch sử Ví' : 'Lịch sử mua bán'}
                 </button>
            </div>

            {(activeTab === 'products' && house.type !== 'excel') ? (
                <>
                <div className="products-header flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                     <span className="text-2xl">✨</span>
                     <div>
                        <h2 className="text-2xl font-bold text-white leading-none">Sản phẩm</h2>
                        <span className="text-xs text-slate-400 font-mono">trong Nhà</span>
                     </div>
                </div>

                <div className="flex items-center gap-3">
                     {/* Holo Toggle */}
                    <div className="toggle-container scale-75 origin-right">
                        <div className="toggle-wrap">
                            <input 
                                className="toggle-input" 
                                id="holo-toggle-house" 
                                type="checkbox" 
                                checked={isImagesHidden}
                                onChange={(e) => setIsImagesHidden(e.target.checked)}
                            />
                            <label className="toggle-track" htmlFor="holo-toggle-house">
                                <div className="track-lines"><div className="track-line"></div></div>
                                <div className="toggle-thumb">
                                    <div className="thumb-core"></div>
                                    <div className="thumb-inner"></div>
                                    <div className="thumb-scan"></div>
                                    <div className="thumb-particles">
                                        {[...Array(5)].map((_, i) => <div key={i} className="thumb-particle"></div>)}
                                    </div>
                                </div>
                                <div className="toggle-data">
                                    <div className="data-text off" style={{fontSize: '10px'}}>ẢNH: BẬT</div>
                                    <div className="data-text on" style={{fontSize: '10px'}}>ẢNH: TẮT</div>
                                    <div className="status-indicator off"></div>
                                    <div className="status-indicator on"></div>
                                </div>
                                <div className="energy-rings">
                                    {[...Array(3)].map((_, i) => <div key={i} className="energy-ring"></div>)}
                                </div>
                                <div className="interface-lines">
                                    {[...Array(6)].map((_, i) => <div key={i} className="interface-line"></div>)}
                                </div>
                                <div className="toggle-reflection"></div>
                                <div className="holo-glow"></div>
                            </label>
                        </div>
                    </div>

                    {(role === 'member' || role === 'owner' || user?.role === 'admin') && products.length > 0 && (
                        <button 
                            onClick={() => { setIsSelectMode(!isSelectMode); setProductSelectedIds([]); }}
                            className={`Btn btn-scifi-custom !scale-90 ${isSelectMode ? 'active !bg-blue-600 !text-white' : ''}`}
                            title={isSelectMode ? 'Xong' : 'Chọn nhiều'}
                        >
                            <span className="svgIcon">{isSelectMode ? <ShieldCheck size={18} /> : <Shield size={18} />}</span>
                            <span className="text">{isSelectMode ? 'Xong' : 'Chọn nhiều'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Grid Area */}
            <div className="products-scroll-wrapper scrollbar-hide">
                <div className="products-grid">
                    {products.map(p => (
                        <div 
                            key={p.id} 
                            className={`product-card-manage ${isSelectMode ? 'selecting' : ''} ${productSelectedIds.includes(p.id) ? 'selected' : ''}`}
                            onClick={() => isSelectMode && toggleProductSelect(p.id)}
                        >
                            <div className="product-card-manage-inner">
                                {/* Image Area */}
                                {!isImagesHidden && (
                                    <div className="card-img-container">
                                        {p.image_url ? (
                                            <img src={p.image_url.startsWith('http') ? p.image_url : `${p.image_url}`} onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <div className="no-img">🎁</div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="product-card-body">
                                    <div className="product-info-row mb-1">
                                         <h3 className="product-name" title={p.name}>{p.name}</h3>
                                         <div className="flex flex-col items-end">
                                            <div className="product-price">{Number(p.price).toLocaleString()}đ</div>
                                            {(p.quantity > 1 || (p.unit_price && p.unit_price != p.price)) && (
                                                <div className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter opacity-80">
                                                    {Number(p.unit_price).toLocaleString()}đ / cái
                                                </div>
                                            )}
                                         </div>
                                    </div>

                                    <div className="product-meta mb-3">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px]">👤</div>
                                            <span className="text-slate-400 text-xs truncate">{p.owner_name}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${p.quantity > 0 ? 'bg-slate-800 text-slate-300' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                                            📦 {p.quantity > 0 ? `Còn: ${p.quantity}` : 'Hết hàng'}
                                        </div>
                                    </div>

                                    {!isSelectMode ? (
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleBuyProduct(p); }}
                                                disabled={p.quantity <= 0 || buyingId === p.id}
                                                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all
                                                    ${p.quantity > 0 
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-95' 
                                                        : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                                            >
                                                {buyingId === p.id ? (
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                ) : (
                                                    <>
                                                        <CreditCard size={14} />
                                                        Mua 1
                                                    </>
                                                )}
                                            </button>
                                            
                                            <div className="grid grid-cols-4 gap-2">
                                                <button className="h-9 rounded-xl bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>
                                                    <Package size={14} />
                                                </button>
                                                <button className={`h-9 rounded-xl transition-all flex items-center justify-center ${p.quantity <= 0 ? 'bg-white/5 text-slate-600 cursor-not-allowed opacity-40' : 'bg-white/5 hover:bg-pink-500/20 text-slate-400 hover:text-pink-400'}`} disabled={p.quantity <= 0} title="Thêm vào giỏ" onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}>
                                                    <ShoppingCart size={14} />
                                                </button>
                                                {(role === 'owner' || user?.role === 'admin') && (
                                                    <button className="h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center" title="Xóa" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                <button className="h-9 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center" title="Kho" onClick={(e) => { e.stopPropagation(); navigate(`/inventories/${p.id}`); }}>
                                                    <span className="text-[10px] font-bold">💎</span> 
                                                </button>
                                                <button className="h-9 rounded-xl bg-white/5 hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-all flex items-center justify-center" title="Báo cáo" onClick={(e) => { e.stopPropagation(); setReportConfig({ type: 'product', id: p.id }); setShowReportModal(true); }}>
                                                    <ShieldAlert size={14} /> 
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-auto text-center py-2 bg-black/20 rounded text-xs font-bold text-blue-400 uppercase tracking-wider">
                                            {productSelectedIds.includes(p.id) ? 'Selected' : 'Select'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
            </>
            ) : (
                /* TRANSACTIONS TAB */
                <div className="flex-1 overflow-hidden flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <History className="text-indigo-400" />
                            Toàn bộ giao dịch trong Nhà
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Date Filter */}
                            <div className="relative group">
                                <input 
                                    type="date" 
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all custom-calendar-icon"
                                    value={transactionFilters.date}
                                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, date: e.target.value }))}
                                />
                                {transactionFilters.date && (
                                    <button 
                                        onClick={() => setTransactionFilters(prev => ({ ...prev, date: '' }))}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
                                    >✕</button>
                                )}
                            </div>

                            {/* Member Filter */}
                            <select 
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                                value={transactionFilters.userId}
                                onChange={(e) => setTransactionFilters(prev => ({ ...prev, userId: e.target.value }))}
                            >
                                <option value="" className="bg-[#1a1f2e]">Lọc theo người...</option>
                                {activeMembers.map(m => (
                                    <option key={m.id} value={m.id} className="bg-[#1a1f2e]">
                                        {m.full_name || m.email}
                                    </option>
                                ))}
                            </select>

                            <button onClick={loadTransactions} className="btn btn-ghost btn-sm text-[10px] uppercase tracking-widest font-bold text-indigo-400 hover:bg-indigo-500/10 h-auto py-2">
                                <RefreshCw size={12} className="mr-1" /> Làm mới
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 h-[600px] mt-4">
                        <div className="space-y-3">
                            {filteredTransactions.map(t => (
                                <div key={t.id} className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all">
                                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-inner">🛍️</div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-0.5">
                                             <span className="text-sm font-bold text-white truncate">{t.buyer_name}</span>
                                             <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                                 {t.type === 'REFUND' ? 'đã nhận hoàn tiền' : 'đã mua từ'}
                                             </span>
                                             {t.seller_name && <span className="text-[10px] text-primary/80 font-bold">{t.seller_name}</span>}
                                         </div>
                                          <div className="text-sm text-indigo-400 font-medium truncate">{t.product_name || t.description}</div>
                                         <div className="flex flex-col text-[10px] mt-1 font-mono leading-tight">
                                            <span className="text-slate-400 font-bold">{new Date(t.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-slate-500 opacity-60">{new Date(t.created_at).toLocaleDateString('vi-VN')}</span>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                          <div className={`text-sm font-black ${t.type === 'REFUND' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {t.type === 'REFUND' ? '+' : '-'}{Number(t.total_price).toLocaleString()}đ
                                          </div>
                                         <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Ví User</div>
                                     </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                     <CreditCard size={48} className="mx-auto mb-4 text-slate-700" />
                                     <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Chưa có giao dịch nào được ghi nhận</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* RIGHT: APPROVE BOX */}
        {(role === 'owner' || user?.role === 'admin') && (
            <aside className="approve-box">
                <div className="approve-header">
                    <h3>⏳ {house.type === 'excel' ? 'Duyệt thành viên' : 'Cần duyệt'}</h3>
                    {house.type !== 'excel' && pendingProducts.length > 0 && <span className="count-badge">{pendingProducts.length}</span>}
                </div>

                <div className="approve-list">
                    {house.type !== 'excel' && pendingProducts.map(p => (
                        <div key={p.id} className="approve-item">
                            <div className="approve-item-info min-w-0 flex-1 mr-2">
                                <strong className="truncate">{p.name}</strong>
                                <p className="truncate">Đăng bởi: {p.owner_name}</p>
                                <p className="text-xs text-yellow-500">{Number(p.price).toLocaleString()}đ</p>
                            </div>
                            <div className="approve-actions">
                                <button onClick={() => handleApproveOne(p.id, 'active')} className="btn-accept" title="Duyệt">✓</button>
                                <button onClick={() => handleApproveOne(p.id, 'rejected')} className="btn-reject" title="Từ chối">✕</button>
                            </div>
                        </div>
                    ))}
                    {(house.type !== 'excel' && pendingProducts.length === 0) && <p className="text-center text-muted text-sm py-4">Không có yêu cầu nào.</p>}
                    
                    {pendingMembers.length > 0 && (
                        <>
                            <div className="bg-white/5 p-2 text-xs font-bold text-muted uppercase mt-4 mb-2 text-center">Thành viên chờ ({pendingMembers.length})</div>
                            {pendingMembers.map(m => (
                                <div key={m.id} className="approve-item">
                                    <div className="approve-item-info min-w-0 flex-1">
                                        <strong>{m.full_name}</strong>
                                        <p>{m.email}</p>
                                    </div>
                                    <div className="approve-actions">
                                        <button onClick={() => handleMemberAction(m.id, 'member')} className="btn-accept">✓</button>
                                        <button onClick={() => handleMemberAction(m.id, 'rejected')} className="btn-reject">✕</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </aside>
        )}

      </section>

        {/* Bulk Action Bar for Products */}
        <div className={`bulk-action-bar active ${isSelectMode ? '' : '!translate-y-[150px]'}`}>
            <div className="bulk-info text-slate-300 !border-white/10">
                Đã chọn <span className="text-primary font-bold">{productSelectedIds.length}</span> sản phẩm
            </div>
            <div className="bulk-btns flex gap-3">
                <button onClick={toggleSelectAllProducts} className="Btn btn-scifi-custom" title={productSelectedIds.length === products.length ? 'Bỏ chọn' : 'Tất cả'}>
                    <span className="svgIcon"><Shield size={18} /></span>
                    <span className="text">{productSelectedIds.length === products.length ? 'Bỏ chọn' : 'Tất cả'}</span>
                </button>
                <button 
                    onClick={handleBulkDeleteProducts} 
                    className="Btn btn-delete"
                    disabled={productSelectedIds.length === 0}
                    title="Xoá"
                >
                    <span className="svgIcon"><Trash2 size={18} /></span>
                    <span className="text">Xoá ({productSelectedIds.length})</span>
                </button>
                <button onClick={() => setIsSelectMode(false)} className="Btn btn-scifi-custom" title="Hủy">
                    <span className="svgIcon"><Ban size={18} /></span>
                    <span className="text">Thoát</span>
                </button>
            </div>
        </div>
        
        {/* Report Modal */}
        {showReportModal && (
            <ReportModal 
                targetType={reportConfig.type} 
                targetId={reportConfig.id || id} 
                onClose={() => setShowReportModal(false)} 
            />
        )}


    </div>
  );
}
