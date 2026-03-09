import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import CheckoutTypeModal from '../components/CheckoutTypeModal';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    
    // States
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [formData, setFormData] = useState({
        fullName: user?.full_name || '',
        email: user?.email || '',
        phone: '',
        note: ''
    });
    const [wantVAT, setWantVAT] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeliveryType, setSelectedDeliveryType] = useState('direct'); // Default to direct

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // Try from API first, fallback to mock if fails
                try {
                    const res = await api.get(`/digital-products/${id}`);
                    if (res) setProduct(res);
                } catch (e) {
                    // Mock data fallback for demonstration
                    const mockProducts = {
                        '1': { id: 1, name: 'CapCut Pro', category: 'Design & Video', price: 35000, original_price: 99000, features: ["Chỉnh sửa video chuyên nghiệp", "Xuất 4K"] },
                        '2': { id: 2, name: 'ChatGPT Plus', category: 'AI Chat', price: 36000, original_price: 550000, features: ["GPT-4/GPT-o", "DALL-E 3"] },
                        '3': { id: 3, name: 'Gemini AI Pro', category: 'Gemini', price: 165000, original_price: 500000, features: ["Hỗ trợ 5 slot", "Guided Learning"] }
                    };
                    setProduct(mockProducts[id] || mockProducts['1']);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Calculations
    const unitPrice = product?.price || 0;
    
    // Delivery Surcharge: +10% for 'key'
    const deliverySurchargeRate = selectedDeliveryType === 'key' ? 0.1 : 0;
    const deliverySurchargeAmount = unitPrice * deliverySurchargeRate;
    
    const adjustedUnitPrice = unitPrice + deliverySurchargeAmount;
    const subtotal = adjustedUnitPrice * quantity;
    
    // Auto discount for quantity >= 2 (10% off)
    const autoDiscount = quantity >= 2 ? subtotal * 0.1 : 0;
    const totalDiscount = autoDiscount + appliedDiscount;
    
    const vatAmount = wantVAT ? (subtotal - totalDiscount) * 0.1 : 0;
    const finalTotal = (subtotal - totalDiscount) + vatAmount;

    const handleQuantityChange = (val) => {
        if (quantity + val >= 1) setQuantity(prev => prev + val);
    };

    const handleCheckout = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleApplyDiscount = async () => {
        if (!discountCode || !discountCode.trim()) {
            return toast.warn("Vui lòng nhập mã giảm giá");
        }
        
        try {
            toast.info("Đang kiểm tra mã...");
            const res = await api.post('/digital-products/validate-discount', {
                code: discountCode.trim(),
                productId: id
            });
            
            if (res.success) {
                setAppliedDiscount(res.discountAmount);
                toast.success(`Đã áp dụng mã ${res.code}! Giảm ${res.discountAmount.toLocaleString()}đ`);
            }
        } catch (e) {
            console.error("Discount error:", e);
            toast.error(e.message || "Mã giảm giá không hợp lệ hoặc đã hết lượt dùng");
            setAppliedDiscount(0);
        }
    };

    const handleModalConfirm = async () => {
        if (!agreed) return toast.warn("Bạn cần đồng ý với điều khoản sử dụng.");
        // We'll proceed even if fullName/phone are empty as per user request
        if (!formData.email) return toast.warn("Vui lòng nhập Email để nhận thông tin.");

        setIsModalOpen(false);
        document.body.style.overflow = 'auto';

        try {
            toast.info("Đang khởi tạo đơn hàng...");
            const payload = {
                productId: id,
                quantity,
                userInfo: formData,
                wantVAT,
                discountCode,
                deliveryType: selectedDeliveryType,
                total: finalTotal
            };
            
            const res = await api.post('/digital-products/checkout', payload);
            if (res.success) {
                setIsModalOpen(false);
                document.body.style.overflow = 'auto';
                
                // Show long-form confirmation instead of quick toast
                const confirmMessage = (
                    `🎉 CHÚC MỪNG! BẠN ĐÃ NHẬN ĐƯỢC ${product.name.toUpperCase()}\n\n` +
                    `------------------------------------------\n` +
                    `🔐 THÔNG TIN TÀI KHOẢN / MẬT KHẨU:\n` +
                    `${res.account_details || "Vui lòng liên hệ Admin để nhận mã"}\n` +
                    `------------------------------------------\n\n` +
                    `💰 Thanh toán thành công: ${finalTotal.toLocaleString()}đ\n` +
                    `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n` +
                    `👉 Bạn có thể xem lại thông tin này bất cứ lúc nào trong mục "Key đã mua" tại Chợ.`
                );

                const confirmed = await toast.confirm(confirmMessage, { 
                    title: "GIAO DỊCH THÀNH CÔNG",
                    confirmLabel: "Về Chợ",
                    cancelLabel: "Ở lại"
                });
                
                if (confirmed) {
                    navigate('/marketplace');
                }
            }
        } catch (err) {
            console.error("Checkout error:", err);
            toast.error(err.message || "Giao dịch thất bại. Vui lòng kiểm tra lại ví.");
        }
    };

    if (loading) return <div className="loading-spinner">Đang tải...</div>;
    if (!product) return <div className="error-msg">Không tìm thấy sản phẩm.</div>;

    const referralLink = window.location.href;

    return (
        <div className="product-detail-page animate-fade-in">
            <div className="detail-container">
                {/* LEFT COLUMN: VISUALS */}
                <div className="detail-left">
                    <div className="product-visual-card glass-card">
                        <div className="visual-display relative overflow-hidden group">
                            {product.image ? (
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                            ) : (
                                <>
                                    <h2>{product.name}</h2>
                                    <div className="visual-placeholder">🎨</div>
                                </>
                            )}
                            <div className="visual-overlay opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <button className="btn-secondary w-full mt-4">Xem thêm ảnh</button>
                    </div>

                    <div className="referral-box glass-card mt-6">
                        <h3>Giới thiệu bạn bè</h3>
                        <p>Giảm ngay 5% cho bạn và 10% hoa hồng khi giới thiệu thành công.</p>
                        <div className="copy-link-group">
                            <input readOnly value={referralLink} />
                            <button onClick={() => {
                                navigator.clipboard.writeText(referralLink);
                                toast.success("Đã copy link giới thiệu!");
                            }}>Copy</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CHECKOUT FORM */}
                <div className="detail-right">
                    <div className="checkout-card glass-card">
                        <section className="form-section">
                            <label className="section-title">Số lượng</label>
                            <div className="qty-selector">
                                <button onClick={() => handleQuantityChange(-1)}>-</button>
                                <input type="number" value={quantity} readOnly />
                                <button onClick={() => handleQuantityChange(1)}>+</button>
                                {quantity >= 2 && <span className="discount-tag">Giảm 10% khi mua từ 2</span>}
                            </div>
                        </section>

                        <section className="form-section mt-8">
                            <label className="section-title">Thông tin nhận hàng</label>
                            <div className="form-grid">
                                {/* Only keep Email for essential delivery info */}
                                <input 
                                    className="col-span-2"
                                    placeholder="Nhập Email nhận tài khoản / mật khẩu..." 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </section>

                        <section className="vat-section mt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={wantVAT} onChange={e => setWantVAT(e.target.checked)} />
                                <span className="text-sm font-bold text-slate-300">Xuất hóa đơn VAT (+10%)</span>
                            </label>
                        </section>

                        <section className="payment-method mt-6">
                            <div className="method-item active">
                                <span>🏦</span> Chuyển khoản QR / Ví hệ thống
                            </div>
                        </section>

                        <section className="discount-input mt-6">
                            <div className="input-group">
                                <input 
                                    placeholder="Mã giảm giá" 
                                    value={discountCode}
                                    onChange={e => setDiscountCode(e.target.value)}
                                />
                                <button 
                                    className="btn-apply"
                                    onClick={handleApplyDiscount}
                                    type="button"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </section>

                        <div className="price-summary mt-8">
                            <div className="summary-item">
                                <span>Tạm tính</span>
                                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="summary-item discount">
                                    <span>Giảm giá</span>
                                    <span>-{totalDiscount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            {wantVAT && (
                                <div className="summary-item">
                                    <span>VAT (10%)</span>
                                    <span>{vatAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            <div className="summary-total border-t border-white/10 pt-4 mt-2">
                                <span>Thanh toán</span>
                                <span className="total-value">{finalTotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>

                        <div className="terms-checkbox mt-6">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <span className="text-xs text-slate-400">
                                    Tôi đã đọc và đồng ý với <a href="#" className="text-blue-400 underline">Chính sách bảo mật & Điều khoản sử dụng</a>
                                </span>
                            </label>
                        </div>

                        <div className="btn-group mt-8">
                            <button 
                                type="button"
                                className={`btn-primary-gradient flex-1 ${(!agreed || !formData.email) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                                onClick={handleCheckout}
                                disabled={!agreed || !formData.email}
                            >
                                ⚡ Kích hoạt ngay
                            </button>
                            <button 
                                className={`btn-outline ${(!agreed || !formData.email) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!agreed || !formData.email}
                            >
                                🛒 Thêm vào danh sách
                            </button>
                        </div>

                        <div className="secure-badge mt-6 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
                            🛡️ Thanh toán an toàn - Bảo mật SSL
                        </div>
                    </div>
                </div>
            </div>

            <CheckoutTypeModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    document.body.style.overflow = 'auto';
                }}
                onConfirm={() => {
                    console.log("Confirming checkout from modal...");
                    handleModalConfirm();
                }}
                basePrice={unitPrice}
                discount={appliedDiscount / quantity}
                selectedType={selectedDeliveryType}
                setSelectedType={setSelectedDeliveryType}
                allowKey={product?.allow_key_delivery ?? 1}
                allowDirect={product?.allow_direct_delivery ?? 1}
            />
        </div>
    );
};

export default ProductDetail;
