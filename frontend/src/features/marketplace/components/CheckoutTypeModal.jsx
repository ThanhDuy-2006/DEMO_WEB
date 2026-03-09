import React from 'react';
import { createPortal } from 'react-dom';
import './CheckoutTypeModal.css';

const CheckoutTypeModal = ({ isOpen, onClose, onConfirm, basePrice, discount = 0, selectedType, setSelectedType, allowKey = 1, allowDirect = 1 }) => {
    if (!isOpen) return null;

    const options = [
        {
            id: 'key',
            title: '🔑 Mua Key kích hoạt',
            description: 'Nhận key về kích hoạt sau. Key có hạn sử dụng 7 ngày để kích hoạt. Phù hợp khi muốn tặng người khác hoặc kích hoạt sau.',
            badge: '🏷️ Tài khoản cấp sẵn – Giá rẻ nhất',
            surcharge: 0.1, // +10%
            surchargeLabel: '+10%',
            visible: allowKey === 1
        },
        {
            id: 'direct',
            title: '📦 Lấy hàng trực tiếp',
            description: 'Nhận tài khoản ngay sau khi thanh toán thành công. Tài khoản sẵn sằng sử dụng, được giao tự động.',
            badge: '🏷️ Tài khoản cấp sẵn – Giá rẻ nhất',
            surcharge: 0,
            surchargeLabel: discount > 0 ? 'Đã giảm' : 'Giá gốc',
            visible: allowDirect === 1
        }
    ].filter(opt => opt.visible);

    // Auto-select first available option if current selectedType is not in filtered options
    React.useEffect(() => {
        if (options.length > 0 && !options.find(o => o.id === selectedType)) {
            setSelectedType(options[0].id);
        }
    }, [isOpen]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div className="modal-overlay animate-fade-in" onClick={handleBackdropClick}>
            <div className="modal-content animate-slide-up glass-card">
                <div className="modal-header">
                    <h2>Chọn hình thức nhận hàng</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="options-list">
                        {options.map((opt) => {
                            const originalOptionPrice = basePrice * (1 + opt.surcharge);
                            const finalOptionPrice = Math.max(0, originalOptionPrice - discount);

                            return (
                                <div 
                                    key={opt.id} 
                                    className={`option-card ${selectedType === opt.id ? 'active' : ''}`}
                                    onClick={() => setSelectedType(opt.id)}
                                >
                                    <div className="option-radio">
                                        <div className="radio-outer">
                                            {selectedType === opt.id && <div className="radio-inner" />}
                                        </div>
                                    </div>
                                    <div className="option-info">
                                        <h3 className="option-title">{opt.title}</h3>
                                        <p className="option-desc">{opt.description}</p>
                                        <div className="option-badge">{opt.badge}</div>
                                        <div className="option-price">
                                            <div className="price-stack">
                                                {discount > 0 && <span className="old-price">{(originalOptionPrice).toLocaleString()}đ</span>}
                                                <span className="price-value">
                                                    {(finalOptionPrice).toLocaleString()}đ
                                                </span>
                                            </div>
                                            <span className={`surcharge-tag ${opt.surcharge > 0 ? 'red' : 'green'}`}>
                                                {opt.surchargeLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="modal-note mt-6">
                        <div className="note-icon">💡</div>
                        <div className="note-content">
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                {allowKey === 1 && <li><strong>Option 1 (Mua Key):</strong> Nhận key kích hoạt sau, có hạn 7 ngày.</li>}
                                {allowDirect === 1 && <li><strong>Option 2 (Lấy trực tiếp):</strong> Nhận tài khoản cấp sẵn ngay sau thanh toán.</li>}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button 
                        type="button"
                        className="btn-submit" 
                        disabled={!selectedType}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfirm();
                        }}
                    >
                        Tiếp tục thanh toán <span>›</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CheckoutTypeModal;
