import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NeonButton from './NeonButton';

const BackButton = ({ fallbackPath = '/', className = '', label = 'Quay lại' }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallbackPath);
        }
    };

    return (
        <NeonButton 
            onClick={handleBack}
            className={`
                !px-4 !py-2 !gap-3
                !border-slate-500/50 hover:!border-[#0ff]
                !text-slate-400 hover:!text-white
                !bg-transparent
                !rounded-xl
                ${className}
            `}
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs sm:inline-block uppercase tracking-wider">
                {label}
            </span>
        </NeonButton>
    );
};

export default BackButton;
