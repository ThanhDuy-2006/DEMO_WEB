import React from 'react';
import './ConfirmModal.css';

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content">
                <div className="confirm-modal-message">{message}</div>
                <div className="confirm-modal-actions flex gap-4 justify-center mt-6">
                    <button className="Btn secondary !flex-shrink-0" onClick={onCancel}>
                        <svg className="svgIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text">Hủy bỏ</span>
                    </button>
                    <button className="Btn primary !flex-shrink-0" onClick={onConfirm}>
                        <svg className="svgIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text">Đồng ý</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
