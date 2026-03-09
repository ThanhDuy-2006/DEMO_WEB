
import React from 'react';
import './PersonalCard.css';

const PersonalCard = ({ user }) => {
    // Normalization logic for avatar URL
    const getAvatarUrl = (url) => {
        if (!url) return null;
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname;
            } catch (e) {
                return url;
            }
        }
        return url;
    };

    // Calculate neural sync based on profile completion (example logic)
    const calculateSync = () => {
        let score = 0;
        if (user.full_name) score += 40;
        if (user.phone) score += 30;
        if (user.avatar_url) score += 30;
        return score || 20; // Default 20%
    };

    const syncValue = calculateSync();

    return (
        <div className="neon-card-container">
            <div className="personal-card-grid"></div>
            <div className="neon-card-wrapper">
                {/* Outer effect layer */}
                <div className="card-glow"></div>
                <div className="card-darkBorderBg"></div>
                <div className="card-white"></div>
                <div className="card-border"></div>

                {/* Content inside */}
                <div className="card-content">
                    <div className="profile-top">
                        <div className="relative">
                            <img
                                src={getAvatarUrl(user.avatar_url) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"}
                                alt={user.full_name}
                                className="profile-img"
                                onError={(e) => {
                                    e.target.src = "https://ui-avatars.com/api/?name=" + (user.full_name || "User") + "&background=0D1430&color=fff";
                                }}
                            />
                        </div>
                        <div className="profile-info">
                            <h3>{user.full_name || 'Anonymous Agent'}</h3>
                            <p>{user.role === 'admin' ? 'Cyber Administrator' : 'Neural Operative'}</p>
                            <span className="status-badge">ONLINE</span>
                        </div>
                    </div>

                    <div className="stat-label">
                        <span>Neural Sync</span>
                        <span>{syncValue}%</span>
                    </div>
                    <div className="stat-bar">
                        <div className="stat-fill" style={{ width: `${syncValue}%` }}></div>
                    </div>

                    <div className="card-actions">
                        <div className="card-action-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                            </svg>
                        </div>
                        <div className="card-action-btn">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </div>
                        <div className="card-action-btn">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalCard;
