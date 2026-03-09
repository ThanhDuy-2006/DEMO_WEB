import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="animate-fade-in min-h-screen relative overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[150px] pointer-events-none"></div>

      <section className="hero relative pt-20 pb-16 px-6 text-center">
        <div className="hero-content max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-black uppercase tracking-widest mb-8 animate-bounce-short">
             ✨ Nền tảng quản lý HouseMarket
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
            CHỢ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">KỸ THUẬT SỐ</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Duy trì và phát triển bởi Duy Đẹp Trai. Công cụ quản lý, mua bán và trao đổi tài khoản kỹ thuật số hàng đầu.
          </p>
          
          <div className="hero-actions flex flex-wrap justify-center gap-6">
            <Link to="/marketplace" className="btn-premium !px-10 !py-4 text-lg flex items-center justify-center gap-3 min-w-[300px]">
               <span className="text-2xl">⚡</span>
               <span>Chợ Kỹ Thuật Số</span>
            </Link>
            
            <Link to="/houses" className="btn-premium !px-10 !py-4 text-lg flex items-center justify-center gap-3 min-w-[300px]">
               <span className="text-2xl">🏘️</span>
               <span>Chợ Cư Dân</span>
            </Link>

            {!user && (
              <Link to="/register" className="w-full md:w-auto px-10 py-4 rounded-xl font-bold text-slate-400 hover:text-white transition-all hover:bg-white/5 border border-transparent hover:border-white/5">
                <span>Tạo tài khoản mới</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="features grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto py-20">
        <div className="feature-card card-saas group">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🏘️</div>
          <h3 className="text-xl font-bold text-white mb-3">Cộng Đồng Nhà</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Nơi giao lưu, chia sẻ và kết nối các cư dân trong hệ thống HouseMarket.</p>
        </div>
        
        <div className="feature-card card-saas group">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🛒</div>
          <h3 className="text-xl font-bold text-white mb-3">Mua Bán Dễ Dàng</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Đăng bán, tìm kiếm và trao đổi các sản phẩm kỹ thuật số chỉ trong vài giây.</p>
        </div>
        
        <div className="feature-card card-saas group">
          <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🔒</div>
          <h3 className="text-xl font-bold text-white mb-3">An Toàn & Bảo Mật</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Hệ thống thanh toán minh bạch, bảo mật thông tin tuyệt đối cho người dùng.</p>
        </div>
      </section>

      <section className="gallery-section py-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Showcase</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
        </div>
        <div className="gallery-container">
          <div className="gallery-body">
            <div className="gallery-card border-2 border-white/5">
              <img src="https://hinhcute.net/wp-content/uploads/2025/08/buc-anh-anh-gai-dep-viet-nam-xinh-tuoi-20-07-2025-1.jpg" alt="Showcase 1" />
            </div>
            <div className="gallery-card border-2 border-white/5">
              <img src="https://anhtomau.com/wp-content/uploads/2026/01/Hinh-anh-gai-xinh-Viet-Nam-phong-cach-goi-cam.webp" alt="Showcase 2" />
            </div>
            <div className="gallery-card border-2 border-white/5">
              <img src="https://anhtomau.com/wp-content/uploads/2026/01/Gai-xinh-dep-nhat-Viet-Nam-phong-cach-tre.webp" alt="Showcase 3" />
            </div>
            <div className="gallery-card border-2 border-white/5">
              <img src="https://anhnail.com/wp-content/uploads/2024/10/Hinh-anh-gai-xinh-Viet-Nam-mac-vay-2-day-2.jpg" alt="Showcase 4" />
            </div>
            <div className="gallery-card border-2 border-white/5">
              <img src="https://khoanhmoi.com/wp-content/uploads/2026/01/Anh-gai-xinh-Viet-Nam-thu-hut-moi-anh-nhin.webp" alt="Showcase 5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

