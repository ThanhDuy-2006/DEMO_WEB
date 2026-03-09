import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/common/BackButton";
import PersonalCard from "../components/profile/PersonalCard";
import { WalletTab } from "../features/profile/components/WalletTab";
import { ExpensesTab } from "../features/profile/components/ExpensesTab";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export function Profile() {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("info");
    const [loading, setLoading] = useState(false);

    // Form data for Info Tab
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        avatar: null
    });
    const [preview, setPreview] = useState(null);

    // Form data for Password Tab
    const [pwdData, setPwdData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                phone: user.phone || "",
                avatar: null
            });
            setPreview(user.avatar_url || null);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append("full_name", formData.full_name);
            data.append("phone", formData.phone);
            if (formData.avatar) {
                data.append("avatar", formData.avatar);
            }

            const res = await api.patch("/users/me", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.success && res.user) {
                updateUser(res.user);
                toast.success("Cập nhật thông tin thành công!");
            }
        } catch (err) {
            toast.error("Lỗi: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwdData.new_password !== pwdData.confirm_password) {
            return toast.warn("Mật khẩu mới không khớp!");
        }
        setLoading(true);
        try {
            await api.patch("/auth/change-password", {
                old_password: pwdData.old_password,
                new_password: pwdData.new_password
            });
            toast.success("Đổi mật khẩu thành công!");
            setPwdData({ old_password: "", new_password: "", confirm_password: "" });
        } catch (err) {
            toast.error("Lỗi: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="text-center py-20 text-white">Vui lòng đăng nhập...</div>;

    const tabs = [
        { id: "info", label: "Thông Tin", icon: "👤" },
        { id: "wallet", label: "Ví Tiền", icon: "💰" },
        { id: "expenses", label: "Chi Tiêu", icon: "💸" },
        { id: "password", label: "Bảo Mật", icon: "🔒" },
        { id: "card", label: "Thẻ Cá Nhân", icon: "🪪" }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in relative">
            <div className="flex items-center justify-center mb-8 md:mb-12 relative w-full text-white">
                <h1 className="text-3xl md:text-4xl font-black text-white text-center uppercase tracking-[0.2em] bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_var(--primary-glow)]">
                    Hồ Sơ Của Bạn
                </h1>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 md:mb-10 p-2 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl relative w-full shadow-2xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            activeTab === tab.id 
                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_var(--primary-glow)] scale-105' 
                            : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* INFO TAB */}
                {activeTab === "info" && (
                    <div className="animate-fade-in-up">
                        <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[32px] shadow-2xl">
                            <form onSubmit={handleUpdateInfo} className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 relative z-10">
                                <div className="lg:col-span-4 flex flex-col items-center justify-center gap-6">
                                    <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2rem] border-[4px] border-white/5 overflow-hidden relative group bg-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500">
                                        {preview ? (
                                            <img 
                                                src={(() => {
                                                    let url = preview;
                                                    if (url && typeof url === 'string' && (url.includes("localhost") || url.includes("127.0.0.1"))) {
                                                        try {
                                                            if (url.startsWith('blob:')) return url;
                                                            const urlObj = new URL(url);
                                                            return urlObj.pathname;
                                                        } catch (e) { return url; }
                                                    }
                                                    return url;
                                                })()} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                alt="Avatar" 
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="w-full h-full flex items-center justify-center text-6xl text-slate-300 font-black bg-gradient-to-br from-indigo-900/50 to-purple-900/50"
                                            style={{ display: preview ? 'none' : 'flex' }}
                                        >
                                            {user.full_name?.charAt(0)}
                                        </div>
                                        <label className="absolute inset-0 bg-indigo-900/70 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                                            <span className="text-white text-xs font-black tracking-widest uppercase bg-white/20 px-4 py-1.5 rounded-full border border-white/30">Thay Ảnh</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <div className="text-center px-6 py-4 bg-white/5 rounded-2xl border border-white/10 w-full max-w-xs transition-all hover:bg-white/10">
                                        <h3 className="text-xl font-bold text-white mb-1">{user.full_name || 'Người dùng'}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{user.role}</span>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Họ và tên</span></label>
                                            <input name="full_name" className="w-full bg-[#0a0f1c] text-white border border-white/10 focus:border-primary rounded-2xl px-5 py-4 outline-none font-medium mt-1 transition-all" value={formData.full_name} onChange={handleChange} required />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số điện thoại</span></label>
                                            <input name="phone" className="w-full bg-[#0a0f1c] text-white border border-white/10 focus:border-primary rounded-2xl px-5 py-4 outline-none font-medium mt-1 transition-all" value={formData.phone} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-control opacity-70">
                                        <label className="label"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</span></label>
                                        <input className="w-full bg-[#050812] text-slate-500 border border-transparent rounded-2xl px-5 py-4 outline-none font-medium mt-1 cursor-not-allowed" value={user.email} readOnly />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_var(--primary-glow)] active:scale-95 transition-all">
                                        {loading ? "Đang lưu..." : "Lưu Thông Tin"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "wallet" && <WalletTab />}
                {activeTab === "expenses" && <ExpensesTab />}

                {activeTab === "password" && (
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] animate-fade-in-up max-w-xl mx-auto w-full shadow-2xl relative overflow-hidden">
                        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Bảo mật tài khoản</h3>
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Mật khẩu cũ</span></label>
                                <input type="password" name="old_password" className="w-full bg-[#0a0f1c] text-white border border-white/10 focus:border-primary rounded-2xl px-5 py-3.5 outline-none mt-1 transition-all" value={pwdData.old_password} onChange={handlePwdChange} required />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Mật khẩu mới</span></label>
                                <input type="password" name="new_password" className="w-full bg-[#0a0f1c] text-white border border-white/10 focus:border-primary rounded-2xl px-5 py-3.5 outline-none mt-1 transition-all" value={pwdData.new_password} onChange={handlePwdChange} required />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="text-[10px] uppercase font-black text-slate-400">Xác nhận mật khẩu</span></label>
                                <input type="password" name="confirm_password" className="w-full bg-[#0a0f1c] text-white border border-white/10 focus:border-primary rounded-2xl px-5 py-3.5 outline-none mt-1 transition-all" value={pwdData.confirm_password} onChange={handlePwdChange} required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all">
                                {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                            </button>
                            <div className="text-center pt-2">
                                <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "card" && (
                    <div className="animate-slide-up flex justify-center">
                        <PersonalCard user={user} />
                    </div>
                )}
            </div>
        </div>
    );
}
