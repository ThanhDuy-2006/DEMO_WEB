import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import BackButton from "../components/common/BackButton";
import "./Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
        setError("Token không hợp lệ hoặc thiếu.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp!");
        return;
    }
    if (newPassword.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/reset-password", { 
          token, 
          new_password: newPassword 
      });
      setMessage(res.message);
      // Auto redirect after success? Or just show link.
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
      return (
        <div className="login-page-body">
          <div className="login-container">
            <div className="login-card p-10 text-center animate-modal-in">
                <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">✕</div>
                <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Lỗi Xác Thực</h2>
                <p className="text-slate-400 mb-8">{error}</p>
                <Link to="/forgot-password" size="sm" className="login-btn inline-block">Gửi lại yêu cầu</Link>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="login-page-body">
      <div className="login-container">
        <div className="login-card animate-modal-in">
          {message ? (
              <div className="success-message show">
                  <div className="success-icon">✓</div>
                  <h3 className="text-xl font-bold text-white mb-2">Thành công!</h3>
                  <p className="text-sm text-slate-300 mb-6">{message}</p>
                  <div className="mt-8">
                      <Link to="/login" className="login-btn inline-block">Đăng nhập ngay</Link>
                  </div>
              </div>
          ) : (
              <>
                <div className="login-header text-center mb-10">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Đặt Lại Mật Khẩu</h2>
                    <p className="text-slate-400 mt-2">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message show mb-6">{error}</div>}
                    
                    <div className="form-group">
                        <div className="input-wrapper">
                            <input 
                                type="password" 
                                id="newPassword"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                                minLength={6}
                                placeholder=" "
                            />
                            <label htmlFor="newPassword">Mật khẩu mới</label>
                            <span className="focus-border"></span>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-wrapper">
                            <input 
                                type="password" 
                                id="confirmPassword"
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                                minLength={6}
                                placeholder=" "
                            />
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                            <span className="focus-border"></span>
                        </div>
                    </div>

                    <div className="flex justify-center mt-10">
                        <button 
                            type="submit" 
                            className={`login-btn flex justify-center items-center gap-2 ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="btn-loader"></div>
                            ) : (
                                <span className="btn-text">Xác Nhận Đổi Mật Khẩu</span>
                            )}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </form>
              </>
          )}
        </div>
      </div>
    </div>
  );
}
