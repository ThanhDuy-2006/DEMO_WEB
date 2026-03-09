import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import '../styles/AdminMarketplace.css';

const AdminMarketplace = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDiscountFormOpen, setIsDiscountFormOpen] = useState(false);
    const toast = useToast();

    // Form State
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '', category: 'AI Chat', duration: '1 tháng', price: '',
        original_price: '', badge_type: null, stock: -1, is_active: 1,
        features: [''], image: '', account_details: '',
        allow_key_delivery: 1, allow_direct_delivery: 1
    });

    const formatVND = (val) => {
        if (!val) return '';
        return Number(val).toLocaleString('vi-VN');
    };

    const handlePriceChange = (field, rawValue) => {
        // Remove all non-numeric characters
        const numericValue = rawValue.replace(/\D/g, '');
        setFormData({ ...formData, [field]: numericValue });
    };

    // Discount Form State
    const [currentDiscount, setCurrentDiscount] = useState(null);
    const [discountForm, setDiscountForm] = useState({
        code: '', type: 'percentage', value: '', 
        min_order_value: 0, max_discount: '', 
        usage_limit: '', expiry_date: '', is_active: 1
    });

    useEffect(() => {
        if (activeTab === 'products') fetchProducts();
        else fetchDiscounts();
    }, [activeTab]);

    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/digital-products/discounts/all');
            setDiscounts(res);
        } catch (e) {
            toast.error("Lỗi tải danh sách mã giảm giá");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/digital-products');
            setProducts(res);
        } catch (e) {
            toast.error("Lỗi tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureChange = (idx, val) => {
        const newFeatures = [...formData.features];
        newFeatures[idx] = val;
        setFormData({ ...formData, features: newFeatures });
    };

    const addFeature = () => setFormData({ ...formData, features: [...formData.features, ''] });
    const removeFeature = (idx) => {
        const newFeatures = formData.features.filter((_, i) => i !== idx);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleEdit = (p) => {
        setCurrentProduct(p);
        setFormData({
            ...p,
            features: p.features.length ? p.features : [''],
            allow_key_delivery: p.allow_key_delivery ?? 1,
            allow_direct_delivery: p.allow_direct_delivery ?? 1
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xóa sản phẩm này?")) return;
        try {
            await api.delete(`/admin/digital-products/${id}`);
            toast.success("Đã xóa sản phẩm");
            fetchProducts();
        } catch (e) {
            toast.error("Lỗi xóa sản phẩm");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentProduct) {
                await api.put(`/admin/digital-products/${currentProduct.id}`, formData);
                toast.success("Đã cập nhật sản phẩm");
            } else {
                await api.post('/admin/digital-products', formData);
                toast.success("Đã tạo sản phẩm mới");
            }
            setIsFormOpen(false);
            fetchProducts();
            setFormData({
                name: '', category: 'AI Chat', duration: '1 tháng', price: '',
                original_price: '', badge_type: null, stock: -1, is_active: 1,
                features: [''], image: '', account_details: '',
                allow_key_delivery: 1, allow_direct_delivery: 1
            });
            setCurrentProduct(null);
        } catch (e) {
            toast.error("Giao dịch thất bại");
        }
    };

    const handleDiscountEdit = (d) => {
        setCurrentDiscount(d);
        setDiscountForm({
            ...d,
            expiry_date: d.expiry_date ? new Date(d.expiry_date).toISOString().split('T')[0] : ''
        });
        setIsDiscountFormOpen(true);
    };

    const handleDiscountDelete = async (id) => {
        if (!window.confirm("Xóa mã giảm giá này?")) return;
        try {
            await api.delete(`/admin/digital-products/discounts/${id}`);
            toast.success("Đã xóa mã giảm giá");
            fetchDiscounts();
        } catch (e) {
            toast.error("Lỗi xóa");
        }
    };

    const handleDiscountSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentDiscount) {
                await api.put(`/admin/digital-products/discounts/${currentDiscount.id}`, discountForm);
                toast.success("Đã cập nhật");
            } else {
                await api.post('/admin/digital-products/discounts', discountForm);
                toast.success("Đã tạo mới");
            }
            setIsDiscountFormOpen(false);
            fetchDiscounts();
            setDiscountForm({
                code: '', type: 'percentage', value: '', 
                min_order_value: 0, max_discount: '', 
                usage_limit: '', expiry_date: '', is_active: 1
            });
            setCurrentDiscount(null);
        } catch (e) {
            toast.error(e.message || "Thao tác thất bại");
        }
    };

    return (
        <div className="admin-marketplace p-6">
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Quản lý Chợ Kỹ Thuật Số</h1>
                    <div className="flex gap-4 mt-2">
                        <button 
                            className={`text-sm font-bold uppercase pb-1 border-b-2 transition ${activeTab === 'products' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                            onClick={() => setActiveTab('products')}
                        >
                            📦 Sản Phẩm
                        </button>
                        <button 
                            className={`text-sm font-bold uppercase pb-1 border-b-2 transition ${activeTab === 'discounts' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                            onClick={() => setActiveTab('discounts')}
                        >
                            🎟️ Mã Giảm Giá
                        </button>
                    </div>
                </div>
                <button 
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                    onClick={() => { 
                        if (activeTab === 'products') {
                            setIsFormOpen(true); 
                            setCurrentProduct(null); 
                        } else {
                            setIsDiscountFormOpen(true);
                            setCurrentDiscount(null);
                            setDiscountForm({
                                code: '', type: 'percentage', value: '', 
                                min_order_value: 0, max_discount: '', 
                                usage_limit: '', expiry_date: '', is_active: 1
                            });
                        }
                    }}
                >
                    {activeTab === 'products' ? '+ Thêm Sản Phẩm' : '+ Tạo Mã Giảm Giá'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Đang tải...</div>
            ) : activeTab === 'products' ? (
                <div className="overflow-x-auto glass-card rounded-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Ảnh</th>
                                <th className="p-4">Sản phẩm</th>
                                <th className="p-4">Danh mục</th>
                                <th className="p-4">Giá bán</th>
                                <th className="p-4">Badge</th>
                                <th className="p-4">Tồn kho</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-white/2 transition">
                                    <td className="p-4">
                                        <div className="w-10 h-10 rounded bg-white/5 border border-white/10 overflow-hidden">
                                            {p.image ? (
                                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">No pic</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold">{p.name}</td>
                                    <td className="p-4 text-slate-400">{p.category}</td>
                                    <td className="p-4">{Number(p.price).toLocaleString()}đ</td>
                                    <td className="p-4">
                                        {p.badge_type ? (
                                            <span className={`product-badge-mini ${p.badge_type.toLowerCase().replace(' ', '-')}`}>
                                                {p.badge_type}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">{p.stock === -1 ? '∞' : p.stock}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {p.is_active ? 'ĐANG BÁN' : 'TẠM ẨN'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center space-x-3">
                                        <button onClick={() => handleEdit(p)} className="text-blue-400 hover:underline">Sửa</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto glass-card rounded-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Mã CODE</th>
                                <th className="p-4">Loại</th>
                                <th className="p-4">Giá trị</th>
                                <th className="p-4">Tối thiểu</th>
                                <th className="p-4">Lượt dùng</th>
                                <th className="p-4">Hạn dùng</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white">
                            {discounts.map(d => (
                                <tr key={d.id} className="hover:bg-white/2 transition">
                                    <td className="p-4">
                                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono font-bold">{d.code}</span>
                                    </td>
                                    <td className="p-4 text-slate-400">{d.type === 'percentage' ? 'Phần trăm' : 'Số tiền'}</td>
                                    <td className="p-4 font-bold">
                                        {d.type === 'percentage' ? `${d.value}%` : `${Number(d.value).toLocaleString()}đ`}
                                    </td>
                                    <td className="p-4">{Number(d.min_order_value).toLocaleString()}đ</td>
                                    <td className="p-4 text-slate-400">{d.used_count} / {d.usage_limit || '∞'}</td>
                                    <td className="p-4 text-slate-400 text-xs">
                                        {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'Không hạn'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${d.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {d.is_active ? 'KÍCH HOẠT' : 'KHÓA'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center space-x-3">
                                        <button onClick={() => handleDiscountEdit(d)} className="text-blue-400 hover:underline">Sửa</button>
                                        <button onClick={() => handleDiscountDelete(d.id)} className="text-red-400 hover:underline">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PRODUCT MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white italic uppercase">{currentProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Tên sản phẩm</label>
                                    <input 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Danh mục</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="AI Chat">AI Chat</option>
                                        <option value="Design & Video">Design & Video</option>
                                        <option value="Gemini">Gemini</option>
                                        <option value="Software">Phần mềm</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Giá bán trực tiếp</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={formatVND(formData.price)} 
                                        onChange={e => handlePriceChange('price', e.target.value)}
                                        placeholder="Vd: 35.000"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Giá gốc (Gạch chân)</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={formatVND(formData.original_price)} 
                                        onChange={e => handlePriceChange('original_price', e.target.value)}
                                        placeholder="Vd: 500.000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Danh sách tính năng</label>
                                {formData.features.map((f, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input 
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                                            value={f} onChange={e => handleFeatureChange(i, e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeFeature(i)} className="text-red-400">🗑️</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addFeature} className="text-blue-400 text-xs font-bold">+ Thêm tính năng</button>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Tồn kho (-1 là vô hạn)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Badge</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={formData.badge_type || ''} onChange={e => setFormData({...formData, badge_type: e.target.value || null})}
                                    >
                                        <option value="">Không</option>
                                        <option value="NEW">NEW</option>
                                        <option value="BEST SELLER">BEST SELLER</option>
                                        <option value="ADD-ON">ADD-ON</option>
                                    </select>
                                </div>
                                <div className="col-span-2 flex gap-8 py-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                                            checked={formData.allow_key_delivery === 1} 
                                            onChange={e => setFormData({...formData, allow_key_delivery: e.target.checked ? 1 : 0})} 
                                        />
                                        <span className="text-sm font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-400 transition">🔑 Mua Key kích hoạt</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                                            checked={formData.allow_direct_delivery === 1} 
                                            onChange={e => setFormData({...formData, allow_direct_delivery: e.target.checked ? 1 : 0})} 
                                        />
                                        <span className="text-sm font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition">📦 Lấy hàng trực tiếp</span>
                                    </label>
                                </div>
                                <div className="col-span-2 flex flex-col">
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Ảnh sản phẩm (URL)</label>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                            value={formData.image || ''} 
                                            onChange={e => setFormData({...formData, image: e.target.value})}
                                            placeholder="https://..."
                                        />
                                        {formData.image && (
                                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-blue-400 text-xs font-bold mb-2 uppercase flex justify-between">
                                        <span>Danh sách tài khoản bàn giao (Mua 1 cái tự động xóa)</span>
                                        <span className="text-slate-500 lowercase font-normal italic">Mỗi dòng 1 tài khoản (Enter để xuống dòng)</span>
                                    </label>
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-sm leading-relaxed"
                                        rows="6"
                                        value={formData.account_details || ''} 
                                        onChange={e => setFormData({...formData, account_details: e.target.value})}
                                        placeholder={`Tài khoản 1 | Mật khẩu 1\nTài khoản 2 | Mật khẩu 2\nTài khoản 3 | Mật khẩu 3`}
                                    />
                                </div>
                            </div>

                            <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl transition">
                                {currentProduct ? 'CẬP NHẬT' : 'TẠO MỚI'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DISCOUNT MODAL */}
            {isDiscountFormOpen && (activeTab === 'discounts') && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white italic uppercase">{currentDiscount ? 'Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h2>
                            <button onClick={() => setIsDiscountFormOpen(false)} className="text-slate-400 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleDiscountSubmit} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Mã CODE</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                                    value={discountForm.code} 
                                    onChange={e => setDiscountForm({...discountForm, code: e.target.value})}
                                    placeholder="VD: GIAM20K, CHAOMUNG"
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Loại giảm</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.type}
                                        onChange={e => setDiscountForm({...discountForm, type: e.target.value})}
                                    >
                                        <option value="percentage">Phần trăm (%)</option>
                                        <option value="fixed">Số tiền cố định (đ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Giá trị</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.value}
                                        onChange={e => setDiscountForm({...discountForm, value: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Đơn tối thiểu</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.min_order_value}
                                        onChange={e => setDiscountForm({...discountForm, min_order_value: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Giảm tối đa</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.max_discount || ''}
                                        onChange={e => setDiscountForm({...discountForm, max_discount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Lượt dùng</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.usage_limit || ''}
                                        onChange={e => setDiscountForm({...discountForm, usage_limit: e.target.value})}
                                        placeholder="Để trống là vô hạn"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase">Ngày hết hạn</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                        value={discountForm.expiry_date || ''}
                                        onChange={e => setDiscountForm({...discountForm, expiry_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl transition mt-4 uppercase">
                                {currentDiscount ? 'CẬP NHẬT MÃ' : 'TẠO MÃ GIẢM GIÁ'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMarketplace;
