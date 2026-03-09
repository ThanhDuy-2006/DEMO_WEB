import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import BackButton from "../components/common/BackButton";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.token) {
          // Auto redirect for dev convenience
          navigate(`/reset-password?token=${res.token}`);
      } else {
          setMessage(res.message);
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-body">
      <div className="login-container">
        <div className="login-card animate-modal-in">
          {message ? (
              <div className="success-message show">
                  <div className="success-icon">✓</div>
                  <h3 className="text-xl font-bold text-white mb-2">Đã gửi yêu cầu!</h3>
                  <p className="text-sm text-slate-300 mb-6">{message}</p>
                  <div className="mt-8">
                      <Link to="/login" className="login-btn !bg-white/10 hover:!bg-white/20 !shadow-none inline-block">Quay lại đăng nhập</Link>
                  </div>
              </div>
          ) : (
              <>
                <div className="login-header">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Quên Mật Khẩu?</h2>
                    <p className="text-slate-400 mt-2">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message show mb-6">{error}</div>}
                    
                    <div className="form-group">
                        <div className="input-wrapper">
                            <input 
                                type="email" 
                                id="email"
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                placeholder=" "
                            />
                            <label htmlFor="email">Email của bạn</label>
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
                                <span className="btn-text">Gửi Yêu Cầu</span>
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
