import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { MessageSquare, Camera, Package, Plus, Trash2, X, Shield, ShieldCheck, Check, Ban, ShoppingCart, AlertTriangle, RefreshCw, FileText, Upload, Wallet, History, CreditCard, ChevronRight, ShieldAlert, ChevronDown, ChevronUp, Users, Clock } from "lucide-react";
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
  const [memberStatus, setMemberStatus] = useState(null);
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
  const [isMembersVisible, setIsMembersVisible] = useState(false); // Default: Hidden as per user request
  const [isPendingVisible, setIsPendingVisible] = useState(false); // Default: Hidden as per user request

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
  const [excelHistory, setExcelHistory] = useState([]);

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
     if (activeTab === 'history') {
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
          
          // Force fetch house if undefined to check type
          let currentHouse = house;
          if (!currentHouse) {
             currentHouse = await api.get(`/houses/${id}`);
          }

          if (currentHouse?.type === 'excel') {
              const hist = await api.get(`/houses-excel/${id}/history`);
              setExcelHistory(Array.isArray(hist) ? hist : []);
          }
      } catch (e) {
          console.error("Transactions load failed", e);
      }
  };

  const handleBuyProduct = async (p) => {
      if (buyingId) return;
      if (!user) return toast.error("Vui lòng đăng nhập để mua hàng");
      if (memberStatus === 'blocked') return toast.error("Tài khoản đã bị khóa trong nhà này!");
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
        let p2 = Promise.resolve({ role: null, status: null });
        if (user) {
            p2 = api.get(`/houses/${id}/membership`).catch(() => ({ role: null, status: null }));
        }

        // Load excel history
        if (h.type === 'excel') {
             api.get(`/houses-excel/${id}/history`).then(res => setExcelHistory(Array.isArray(res) ? res : [])).catch(() => []);
        }

        const [prods, membership] = await Promise.all([p1, p2]);
        setProducts(Array.isArray(prods) ? prods : []);
        const currentRole = membership?.role;
        setRole(currentRole);
        setMemberStatus(currentRole === 'blocked' ? 'blocked' : membership?.status);

        // Always load members so the list is visible
        loadMembers(currentRole);

        // If owner or admin, load pending products
        if (currentRole === 'owner' || user?.role?.toLowerCase() === 'admin') {
             const pending = await api.get(`/products?house_id=${id}&status=pending`).catch(() => []);
             setPendingProducts(Array.isArray(pending) ? pending : []);
        }

    } catch (e) {
        console.error("Load house data error:", e);
        if (!house) navigate("/houses");
    }
  };

  const loadMembers = async (passedRole) => {
      try {
        const currentRole = passedRole || role;
        // Only load pending members if current user is owner/admin
        if (currentRole === 'owner' || user?.role === 'admin') {
            const pMembers = await api.get(`/houses/${id}/members?status=pending`).catch(() => []);
            setPendingMembers(Array.isArray(pMembers) ? pMembers : []);
        } else {
            setPendingMembers([]);
        }
        
        const all = await api.get(`/houses/${id}/members`);
        const safeAll = Array.isArray(all) ? all : [];
        // Filter to show existing members (case-insensitive role check)
        const validRoles = ['member', 'owner', 'admin', 'blocked'];
        setActiveMembers(safeAll.filter(m => {
            if (!m.role) return true; // Show members even if role is missing
            return validRoles.includes(m.role.toLowerCase());
        }));
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
          const msgs = { 'member': 'Đã duyệt/mở khóa!', 'rejected': 'Đã từ chối/xóa!', 'blocked': 'Đã khóa thành viên!' };
          toast.success(msgs[status] || "Thành công!");
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
      if (memberStatus === 'blocked') return toast.error("Tài khoản đã bị khóa!");
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
    <div className="house-vip-container animate-fade-in relative z-10 w-full min-h-screen">
      {/* BACKGROUND GRADIENT */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ background: 'radial-gradient(circle at 20% 20%, #1b2a4a, #0b1220 60%)' }}></div>

      <div className="topbar">
        <div className="back-btn" onClick={() => navigate('/houses')}>← Quay lại danh sách</div>
      </div>

      <div className="banner group">
        {/* EDIT COVER LOGIC */}
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
                let currentPosVal = 50;
                const currentPosStr = img.style.objectPosition.split(' ')[1];
                if (currentPosStr && currentPosStr.includes('%')) {
                     currentPosVal = parseFloat(currentPosStr);
                }
                const startPos = currentPosVal;
                const onMouseMove = (moveEvent) => {
                    moveEvent.preventDefault();
                    const deltaY = moveEvent.clientY - startY;
                    let newPos = startPos - (deltaY * 0.3);
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
        >
            {house.cover_image ? (
                <img 
                    src={house.cover_image} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${!isEditingCover ? 'pointer-events-none opacity-50' : 'opacity-100'}`}
                    style={{ objectPosition: house.cover_position || 'center 50%' }}
                    alt="Cover" 
                    draggable={false}
                    id="cover-img-preview"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 opacity-50"></div>
            )}
        </div>

        {isEditingCover && (
            <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-50 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-xl cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-white/80 text-xs flex items-center mr-2 font-medium">✨ Kéo ảnh để chỉnh</span>
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
                >💾 Lưu</button>
                <button 
                    className="btn btn-sm bg-white/10 text-white hover:bg-white/20 border-none shadow-none hover:scale-105 transition-transform"
                    onClick={() => {
                        setIsEditingCover(false);
                        const img = document.getElementById('cover-img-preview');
                        img.style.objectPosition = house.cover_position || 'center 50%';
                    }}
                >❌ Hủy</button>
            </div>
        )}

        <div className="banner-content">
          <h1 className="text-4xl md:text-5xl font-black text-white text-glow tracking-tighter uppercase whitespace-nowrap">{house.name}</h1>
          <p className="text-sm mt-2 opacity-80 max-w-lg line-clamp-2">{house.description}</p>
          <div className="pills mt-4">
            <div className="pill">👥 {activeMembers.length} thành viên</div>
            <div className="pill">📦 {products.length} sản phẩm</div>
            {user && <div className="pill">💰 Ví của tôi: {wallet ? Number(wallet.balance).toLocaleString() : '0'}đ</div>}
          </div>
        </div>
        
        <div className="actions">
          {(!role && user?.role?.toLowerCase() !== 'admin' && user) ? (
              <button className="btn-primary btn-sm px-6 rounded-full" onClick={handleJoin}>Tham gia Nhà</button>
          ) : (role || user?.role?.toLowerCase() === 'admin') && (
            <>
                <div className="action tooltip tooltip-top" data-tip="Trò chuyện" onClick={() => {
                    if (memberStatus === 'blocked') return toast.error("Bạn đã bị khóa khỏi kênh chat!");
                    setShowChat(true);
                }}>💬</div>
                
                <div className="action tooltip tooltip-top" data-tip="Sửa ảnh bìa" onClick={() => document.getElementById('update_cover_modal').showModal()}>📷</div>
                
                {house.cover_image && (
                    <div className="action tooltip tooltip-top" data-tip="Xóa ảnh bìa" onClick={handleDeleteCover} style={{ position: 'relative' }}>
                        <div className="text-xl opacity-60">🖼️</div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 font-bold text-lg select-none" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8)' }}>✕</div>
                    </div>
                )}
                
                <div className="action tooltip tooltip-top" data-tip="Kho hàng" onClick={() => navigate(`/houses/${id}/warehouse`)}>📦</div>
                
                <div className="action tooltip tooltip-top" data-tip="Đăng bán SP" onClick={() => setShowCreate(!showCreate)}>➕</div>

                <div className="action tooltip tooltip-top" data-tip="Quản lý" onClick={() => {
                    const nextState = !isMembersVisible;
                    setIsMembersVisible(nextState);
                    setIsPendingVisible(nextState);
                    if (!isMembersVisible) {
                        setTimeout(() => document.getElementById('management-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                    }
                }} style={{ position: 'relative' }}>
                    👥
                    {(pendingMembers.length > 0 || (house.type !== 'excel' && pendingProducts.length > 0)) && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1 rounded-full animate-pulse border border-black/50">
                            {pendingMembers.length + (house.type !== 'excel' ? pendingProducts.length : 0)}
                        </span>
                    )}
                </div>

                <div className="action tooltip tooltip-top" data-tip="Lịch sử" onClick={() => navigate(`/houses/${id}/history`)}>📜</div>

                {(role === 'owner' || role === 'admin' || user?.role?.toLowerCase() === 'admin') && (
                    <div className="action tooltip tooltip-top" data-tip="Xóa nhà" onClick={handleDeleteHouse} style={{backgroundColor: 'rgba(239, 68, 68, 0.2)'}}>🗑</div>
                )}

                <div className="action tooltip tooltip-top" data-tip="Báo cáo vi phạm" onClick={() => { setReportConfig({ type: 'house', id: id }); setShowReportModal(true); }}>🛡</div>
            </>
          )}
        </div>
      </div>

       {/* Sửa ảnh bìa modal */}
       <dialog id="update_cover_modal" className="modal">
            <div className="modal-box bg-[#1a1f2e] border border-white/10 text-left">
                <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button></form>
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
                    <input type="file" id="update-cover-file" className="file-input file-input-bordered file-input-md w-full mt-2 bg-black/20" accept="image/*,.jpn,.jpeg,.jpg,.png,.webp,.JPG,.JPN" />
                    <input type="text" id="update-cover-url" placeholder="Dán link ảnh tại đây..." className="input input-bordered w-full mt-2 hidden bg-black/20" />
                    <div className="modal-action">
                        <button className="btn btn-primary" onClick={() => {
                                const fileInput = document.getElementById('update-cover-file');
                                const urlInput = document.getElementById('update-cover-url');
                                const isUrl = !urlInput.classList.contains('hidden');
                                const mockEvent = { target: { type: isUrl ? 'url' : 'file', value: isUrl ? urlInput.value : '', files: fileInput.files } };
                                handleUpdateCover(mockEvent);
                                document.getElementById('update_cover_modal').close();
                        }}>Lưu thay đổi</button>
                    </div>
                </div>
            </div>
        </dialog>

      {/* House Chat Modal */}
      {showChat && (
          <HouseChat houseId={id} currentUserId={user?.id} onClose={() => setShowChat(false)} initialConversationId={initialConversationId} />
      )}

      {/* CREATE FORM (Conditional) */}
      {showCreate && <div className="section mb-8"><h3 className="text-lg font-bold text-white mb-4">📝 Đăng bán sản phẩm mới</h3><div className="max-w-xl mx-auto"><div className="flex flex-col items-center"><p className="text-sm font-bold text-success mb-4 uppercase tracking-wider text-center">Import Sản phẩm từ Excel & Ảnh</p><div className={`border-2 border-dashed rounded-xl p-4 flex flex-col gap-4 w-full transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-white/10 bg-black/20'}`} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}><div className="text-center py-2"><span className="text-2xl mb-1 block">{isDragging ? '📥' : '📄'}</span><p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Kéo thả File Excel hoặc Ảnh vào đây</p></div><div className="h-px bg-white/5 w-full"></div><div><label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">1. File Excel (.xlsx)</label><input type="file" accept=".xlsx, .xls" className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white" onChange={(e) => setExcelFile(e.target.files[0])} />{excelFile && (<div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 font-bold"><span>✓</span><span className="truncate">{excelFile.name}</span></div>)}</div><div><label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">2. Ảnh SP (Nếu cần)</label><input type="file" multiple accept="image/*" className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white" onChange={(e) => setImportImages(e.target.files)} />{importImages?.length > 0 && (<div className="mt-1 flex items-center gap-1 text-[10px] text-green-400 font-bold"><span>📸</span><span>Đã chọn {importImages.length} ảnh</span></div>)}</div><button onClick={handleImportSubmit} disabled={!excelFile} className={`btn btn-sm btn-primary w-full disabled:opacity-50 mt-2 ${excelFile ? 'animate-pulse' : ''}`}>🚀 Tiến hành Import</button></div></div></div></div>}

      {/* EXCEL TABLE */}
      {house.type === 'excel' && (
          <div className="section mb-8">
              <ExcelTable houseId={id} myRole={role || (user?.role === 'admin' ? 'admin' : null)} user={user} onActivityChange={(userIds) => setActiveInExcel(userIds)} hideHistory={true} />
          </div>
      )}

      {house.type !== 'excel' && (
        <div className="section mb-8" id="management-section">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Quản Lý</h2>
            </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black/20 rounded-xl border border-white/10 overflow-hidden">
               <div className="flex items-center px-3 border-r border-white/10 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
               <input type="text" placeholder="Tên" className="bg-transparent px-3 py-2 text-xs text-white outline-none w-24 border-r border-white/10" />
               <input type="text" placeholder="Giá" className="bg-transparent px-3 py-2 text-xs text-white outline-none w-20" />
            </div>
            {(role === 'owner' || role === 'member' || user?.role === 'admin') && (
              <button onClick={() => setShowCreate(!showCreate)} className="btn btn-sm bg-[#6d5dfc] hover:bg-[#5b4dfc] text-white border-none rounded-xl px-4 flex items-center gap-2 capitalize">
                <span className="text-lg">+</span> Thêm sản phẩm
              </button>
            )}
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="overflow-x-auto w-full responsive-table-wrapper">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr>
                  <th className="!opacity-70 !font-semibold">TÊN</th>
                  <th className="!opacity-70 !font-semibold">SL</th>
                  <th className="!opacity-70 !font-semibold">TIỀN (Đ)</th>
                  <th className="!opacity-70 !font-semibold">IMG URL</th>
                  <th className="!opacity-70 !font-semibold text-right">Thêm <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded ml-1">✓</span></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan="5" className="text-center py-10 opacity-40">Chưa có sản phẩm.</td></tr>}
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.description}</div>
                    </td>
                    <td><span className="font-bold text-[#facc15]">{p.quantity}</span></td>
                    <td>
                      <div className="price">{Number(p.price).toLocaleString()}</div>
                      <div className="text-[9px] text-slate-500 opacity-70">(Chưa chia)</div>
                    </td>
                    <td>
                       <div className="text-xs text-white font-medium">{p.owner_name}</div>
                       <div className="text-[9px] bg-amber-500/20 text-amber-500 px-1 rounded w-fit font-bold uppercase">ADMIN</div>
                    </td>
                    <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {(isMembersVisible || isPendingVisible) && (
        <div className="space-y-6 mb-8 mt-4 animate-fade-in" id="management-section">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-2xl bg-[#6d5dfc]/20 flex items-center justify-center text-[#6d5dfc]">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Quản lý Nhà</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Members & Approvals Control Center</p>
                </div>
                <button 
                    onClick={() => { setIsMembersVisible(false); setIsPendingVisible(false); }}
                    className="ml-auto w-8 h-8 rounded-full bg-white/5 text-slate-500 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid md:grid-cols-4 grid-cols-1 gap-6">
                {/* Cột Thành viên (vẫn 1/4) */}
                <div className="member md:col-span-1 border border-white/10 bg-black/40 rounded-3xl overflow-hidden h-fit backdrop-blur-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Thành viên</h3>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black">{activeMembers.length}</span>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <input type="text" placeholder="Tìm tên..." className="w-full bg-black/20 text-white text-xs border border-white/10 rounded-xl px-10 py-3 outline-none focus:border-[#6d5dfc]/50 transition-all font-medium" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
                        </div>
            
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                            {filteredMembers.map(m => (
                              <div key={m.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-orange-200 flex items-center justify-center font-black text-xs overflow-hidden">
                                         {m.full_name ? <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=${m.role === 'owner' ? 'ff4444' : 'ffcc33'}&color=${m.role === 'owner' ? 'fff' : '000'}`} className="w-full h-full" /> : '👤'}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate max-w-[100px]">{m.full_name || m.email}</div>
                                        <div className={`text-[8px] font-black uppercase tracking-tighter ${m.role === 'owner' ? 'text-rose-500' : (m.role === 'blocked' ? 'text-slate-500' : (m.role === 'admin' ? 'text-amber-500' : 'text-blue-400'))}`}>
                                          {m.role === 'owner' ? 'CHỦ' : (m.role === 'blocked' ? 'KHÓA' : (m.role === 'admin' ? 'ADM' : 'MBR'))}
                                        </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                      {((role === 'owner' || user?.role?.toLowerCase() === 'admin') && m.id !== user?.id && m.role !== 'owner') && (
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                              <button onClick={(e) => { e.stopPropagation(); handleDeleteMember(m.id); }} className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X className="w-3 h-3" /></button>
                                              <button onClick={(e) => { e.stopPropagation(); handleMemberAction(m.id, m.role === 'blocked' ? 'member' : 'blocked'); }} className={`w-6 h-6 rounded-lg ${m.role === 'blocked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'} flex items-center justify-center hover:bg-current hover:text-white transition-all`}>
                                                  {m.role === 'blocked' ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                              </button>
                                          </div>
                                      )}
                                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:hidden" />
                                  </div>
                              </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cột Yêu cầu (3/4) */}
                <div className="md:col-span-3 space-y-6">
                    {(role === 'owner' || role === 'admin' || user?.role?.toLowerCase() === 'admin') ? (
                        <div className="border border-white/10 bg-black/40 rounded-3xl overflow-hidden backdrop-blur-xl h-full">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-rose-400" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">Yêu cầu chờ duyệt</h3>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-black">
                                        {pendingMembers.length + (house.type !== 'excel' ? pendingProducts.length : 0)} MỤC
                                    </span>
                                </div>
                            </div>
      
                            <div className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Duyệt Thành Viên */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Thành viên mới</h4>
                                        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-hide">
                                            {pendingMembers.length === 0 ? (
                                                <div className="py-20 text-center opacity-20 text-[10px] uppercase font-black tracking-widest border border-dashed border-white/10 rounded-2xl">Trống</div>
                                            ) : (
                                                pendingMembers.map(m => (
                                                    <div key={m.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-[#6d5dfc]/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#6d5dfc]/20 flex items-center justify-center text-xs">👤</div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-white truncate max-w-[120px]">{m.full_name || m.email}</div>
                                                                <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{m.email}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => handleMemberAction(m.id, 'member')} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">✓</button>
                                                            <button onClick={() => handleMemberAction(m.id, 'rejected')} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
            
                                    {/* Duyệt Sản Phẩm */}
                                    {house.type !== 'excel' && (
                                        <div className="space-y-4 border-l border-white/5 pl-6">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Sản phẩm ký gửi</h4>
                                            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-hide">
                                                {pendingProducts.length === 0 ? (
                                                    <div className="py-20 text-center opacity-20 text-[10px] uppercase font-black tracking-widest border border-dashed border-white/10 rounded-2xl">Trống</div>
                                                ) : (
                                                    pendingProducts.map(p => (
                                                        <div key={p.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-indigo-500/30 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs">📦</div>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-bold text-white truncate max-w-[100px]">{p.name}</div>
                                                                    <div className="text-[9px] text-indigo-400 font-black uppercase">{Number(p.price).toLocaleString()}đ</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => handleApproveOne(p.id, 'active')} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">✓</button>
                                                                <button onClick={() => handleApproveOne(p.id, 'rejected')} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Giao diện cho member thường khi mở Quản lý (Chỉ xem thành viên) */
                        <div className="h-full border border-white/10 bg-black/40 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Khu vực hạn chế</h3>
                                <p className="text-xs text-slate-500 max-w-[300px]">Chỉ có Chủ nhà và Admin mới có quyền truy cập vào bảng điều khiển duyệt yêu cầu.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="footer">
        © 2026 Được Phát Triển Bởi Duy Đẹp Trai. Liên Hệ Gmail Để Được Hỗ Trợ
      </div>
      
      {/* Report Modal */}
      {showReportModal && <ReportModal targetType={reportConfig.type} targetId={reportConfig.id || id} onClose={() => setShowReportModal(false)} />}
      
      <div className={`bulk-action-bar active ${isSelectMode ? '' : '!translate-y-[150px]'}`} style={{position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1a1f2e', padding: '15px 25px', borderRadius: '15px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s'}}>
            <div className="text-slate-300 text-sm font-bold">Đà chọn <span className="text-primary">{productSelectedIds.length}</span> sản phẩm</div>
            <div className="flex gap-4">
                <button className="w-8 h-8 rounded-full bg-white/10 text-slate-400 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></button>
                <button onClick={handleBulkDeleteProducts} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                <button onClick={() => setIsSelectMode(false)} className="w-8 h-8 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg></button>
            </div>
      </div>

    </div>
  )
}
