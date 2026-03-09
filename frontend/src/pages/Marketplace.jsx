import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../features/marketplace/components/ProductCard';
import { useToast } from '../context/ToastContext';
import './Marketplace.css';

export const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [purchasedKeys, setPurchasedKeys] = useState([]);
  const [loadingPurchased, setLoadingPurchased] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchPurchasedKeys = async () => {
    try {
        setLoadingPurchased(true);
        const res = await api.get('/orders/my-items');
        if (Array.isArray(res)) {
            setPurchasedKeys(res.filter(item => item.type === 'digital'));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingPurchased(false);
    }
  };

  useEffect(() => {
    if (showPurchasedModal) {
        fetchPurchasedKeys();
    }
  }, [showPurchasedModal]);

  const categories = ['Tất cả', 'Gemini', 'AI Chat', 'Design & Video'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fallback sample data if API is not yet migrated/linked
        const data = [
          {
            id: 1,
            name: 'CapCut Pro',
            category: 'Design & Video',
            duration: '1 tháng',
            features: ['Chỉnh sửa video chuyên nghiệp', 'Xuất video 4K không watermark', 'Truy cập kho template Premium', 'Hiệu ứng & bộ lọc Pro'],
            price: 35000,
            originalPrice: 99000,
            badgeType: 'NEW'
          },
          {
            id: 2,
            name: 'ChatGPT Plus',
            category: 'AI Chat',
            duration: '1 tháng',
            features: ['Truy cập GPT-4/GPT-o mới nhất', 'Codex 5.3 hỗ trợ lập trình', 'DALL-E 3 tạo ảnh AI', 'Browsing & Plugins'],
            price: 36000,
            originalPrice: 550000,
            badgeType: 'BEST SELLER'
          },
          {
            id: 3,
            name: 'Gemini AI Pro',
            category: 'Gemini',
            duration: '1 năm',
            features: ['Gói Gemini AI Pro — Cả Family', 'Phân tích, viết nội dung, học tập', 'Hỗ trợ Gemini Canvas', 'Guided Learning', 'Add được 5 slot thành viên'],
            price: 165000,
            originalPrice: 500000,
            badgeType: 'ADD-ON'
          }
        ];
        
        // Try real API
        try {
            const res = await api.get('/digital-products');
            if (res && res.length > 0) setProducts(res);
            else setProducts(data);
        } catch(e) {
            setProducts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleActivate = (id) => {
     navigate(`/product/${id}`);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = filter === 'Tất cả' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="marketplace-container animate-fade-in px-4 py-8 md:px-10 min-h-screen">
      {/* Decorative Background Blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Search & Header Section */}
      <div className="marketplace-header mb-12 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    CHỢ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">KỸ THUẬT SỐ</span>
                </h1>
                <p className="text-slate-400 font-medium">Khám phá các gói dịch vụ AI, thiết kế và giải trí cao cấp.</p>
            </div>
            
            <button 
              onClick={() => setShowPurchasedModal(true)}
              className="btn-premium group"
            >
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xl">🔑</span> 
                    <span>Sản phẩm đã mua</span>
                </span>
            </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-8 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap border ${
                  filter === cat 
                  ? 'bg-primary text-white border-primary shadow-[0_0_25px_rgba(99,102,241,0.4)]' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5'
                }`}
              >
                {cat} 
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${filter === cat ? 'bg-white/20' : 'bg-white/10'}`}>
                    {cat === 'Tất cả' ? products.length : products.filter(p => p.category === cat).length}
                </span>
              </button>
          ))}
        </div>

        <div className="search-layer flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
            <div className="relative flex-1 group w-full">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-xl">🔍</span>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm tài khoản, công cụ, AI..."
                    className="input-modern !pl-14"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button 
                        className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <GridIcon />
                    </button>
                    <button 
                         className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                         onClick={() => setViewMode('list')}
                    >
                        <ListIcon />
                    </button>
                </div>
                
                <div className="flex-1 md:flex-none text-xs font-black text-slate-500 bg-white/5 px-5 py-4 rounded-2xl border border-white/10 uppercase tracking-widest text-center">
                    📦 {filteredProducts.length} Items
                </div>
            </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className={`marketplace-grid ${viewMode}`}>
            {filteredProducts.map(product => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onActivate={handleActivate}
                />
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-500 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>
      )}

      {/* Floating Social Icons */}
      <div className="fixed bottom-20 right-8 flex flex-col gap-3 z-50">
          <a href="#" className="floating-btn fb hover:scale-110 transition-transform">
              <span className="btn-icon">🔵</span>
              <span className="btn-text">Facebook</span>
          </a>
          <a href="#" className="floating-btn zalo hover:scale-110 transition-transform">
              <span className="btn-icon">🔹</span>
              <span className="btn-text">Zalo</span>
          </a>
      </div>

      {/* Purchased Keys Modal */}
      {showPurchasedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowPurchasedModal(false)}></div>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-modal-in flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">🔑</div>
                        <div>
                            <h2 className="text-xl font-black text-white">Sản Phẩm Đã Mua</h2>
                            <p className="text-xs text-slate-400">Danh sách các mã kích hoạt và tài khoản của bạn</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPurchasedModal(false)}
                        className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loadingPurchased ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-slate-500 text-sm font-medium">Đang tải lịch sử...</p>
                        </div>
                    ) : purchasedKeys.length > 0 ? (
                        <div className="space-y-4">
                            {purchasedKeys.map((item) => (
                                <div key={item.id} className="group bg-slate-800/40 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">📦</div>
                                            <div>
                                                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.product_name}</h3>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(item.created_at).toLocaleString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-slate-300">{Number(item.price).toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between group/key">
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Mã Kích Hoạt / Tài Khoản</span>
                                                <code className="text-indigo-200 font-mono text-sm break-all">{item.description || "N/A"}</code>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(item.description);
                                                    toast.success("Đã sao chép mã!");
                                                }}
                                                className="ml-4 p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all transform active:scale-90"
                                                title="Sao chép"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-5xl mb-4">🛒</div>
                            <h3 className="text-lg font-bold text-white mb-2">Chưa mua sản phẩm nào</h3>
                            <p className="text-slate-500 text-sm max-w-[280px]">
                                Bạn chưa có giao dịch sản phẩm số nào. Hãy khám phá ngay các ưu đãi tại chợ!
                            </p>
                            <button 
                                onClick={() => setShowPurchasedModal(false)}
                                className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all"
                            >
                                Đi mua sắm
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-950/30 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-600">Mọi sự cố về Key vui lòng liên hệ Admin để được hỗ trợ 24/7</p>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes modal-in {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
            animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

const GridIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const ListIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

export default Marketplace;
