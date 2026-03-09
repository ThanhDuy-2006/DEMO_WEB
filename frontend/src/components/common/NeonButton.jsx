import React, { useState } from 'react';

/**
 * NeonButton Component
 * Supports custom neon pulse effect on click as requested by user.
 */
const NeonButton = ({ children, onClick, className = "", type = "button", active = false, disabled = false, ...props }) => {
    const [pulses, setPulses] = useState([]);

    const handleClick = (e) => {
        if (disabled) return;

        // Create a new pulse at the click position (optional, here centered as per requested CSS)
        const id = Date.now();
        setPulses(prev => [...prev, id]);

        // Remove pulse after animation completes
        setTimeout(() => {
            setPulses(prev => prev.filter(p => p !== id));
        }, 600);

        if (onClick) onClick(e);
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled}
            className={`neon-button ${active ? 'active' : ''} ${className}`}
            {...props}
        >
            {children}
            {pulses.map(id => (
                <span key={id} className="click-pulse" />
            ))}
        </button>
    );
};

export default NeonButton;
