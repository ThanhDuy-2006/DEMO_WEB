
import React from 'react';
import './CyberButton.css';

/**
 * CyberButton Component
 * Features a ridge border with disappearing covers on hover.
 */
const CyberButton = ({ 
    children, 
    onClick, 
    className = "", 
    type = "button", 
    disabled = false, 
    bg = "#0D1430",
    style = {},
    as: Component = "button",
    to,
    ...props 
}) => {
    return (
        <Component
            type={Component === "button" ? type : undefined}
            onClick={onClick}
            disabled={disabled}
            to={to}
            className={`cyber-button ${className}`}
            style={{ ...style, '--cyber-bg': bg }}
            {...props}
        >
            <span>{children}</span>
        </Component>
    );
};

export default CyberButton;
