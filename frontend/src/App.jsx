import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Lazy loading all pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const UserManagement = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.UserManagement })));
const UserActivity = lazy(() => import("./pages/UserActivity").then(m => ({ default: m.UserActivity })));
const DepositManagement = lazy(() => import("./pages/DepositManagement").then(m => ({ default: m.DepositManagement })));
const UserWarehouse = lazy(() => import("./pages/UserWarehouse").then(m => ({ default: m.UserWarehouse })));
const UserHistory = lazy(() => import("./pages/UserHistory").then(m => ({ default: m.UserHistory })));
const Messages = lazy(() => import("./pages/Messages"));
const Expenses = lazy(() => import("./pages/Expenses").then(m => ({ default: m.Expenses })));
const Wallet = lazy(() => import("./pages/Wallet").then(m => ({ default: m.Wallet })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const DemoUI = lazy(() => import("./pages/DemoUI").then(m => ({ default: m.DemoUI })));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./features/marketplace/pages/ProductDetail"));
const AdminMarketplace = lazy(() => import("./features/admin-marketplace/pages/AdminMarketplace"));

// House components - Using named imports specifically
const HouseList = lazy(() => import("./pages/House").then(m => ({ default: m.HouseList })));
const HouseDetail = lazy(() => import("./pages/House").then(m => ({ default: m.HouseDetail })));
const HouseWarehouse = lazy(() => import("./pages/HouseWarehouse").then(m => ({ default: m.HouseWarehouse })));
const HouseHistory = lazy(() => import("./pages/HouseHistory"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const Moderation = lazy(() => import("./pages/Admin/Moderation"));
const AdminAutoForm = lazy(() => import("./pages/Admin/AdminAutoForm"));
const VocabularyManagement = lazy(() => import("./pages/Admin/VocabularyManagement"));
import AdminRoute from "./components/AdminRoute";

// Entertainment Module
const Ent = lazy(() => import("./modules/entertainment"));

// Learning Module
const Learning = lazy(() => import("./modules/learning"));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider>
            <SocketProvider>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-[#0b1020] text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold animate-pulse text-sm">Đang tải HouseMarket...</p>
                  </div>
                </div>
              }>
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected/Dashboard Routes */}
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Home />} />
                    
                    <Route path="houses" element={<HouseList />} />
                    <Route path="marketplace" element={<Marketplace />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="houses/:id" element={<HouseDetail />} />
                    <Route path="houses/:id/warehouse" element={<HouseWarehouse />} />
                    <Route path="houses/:id/history" element={<HouseHistory />} />
                    
                    <Route path="cart" element={<Cart />} />
                    <Route path="wallet" element={<Wallet />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="user-management" element={<UserManagement />} />
                    <Route path="user-activity" element={<UserActivity />} />
                    <Route path="admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="admin/moderation" element={<AdminRoute><Moderation /></AdminRoute>} />
                    <Route path="admin/marketplace" element={<AdminRoute><AdminMarketplace /></AdminRoute>} />
                    <Route path="admin/auto-form" element={<AdminRoute><AdminAutoForm /></AdminRoute>} />
                    <Route path="admin/vocabulary" element={<AdminRoute><VocabularyManagement /></AdminRoute>} />
                    <Route path="deposit-management" element={<DepositManagement />} />
                    <Route path="my-warehouse" element={<UserWarehouse />} />
                    <Route path="history" element={<UserHistory />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="entertainment/*" element={
                         <Suspense fallback={<LoadingFallback />}>
                             <Ent />
                         </Suspense>
                    } />
                    <Route path="learning/*" element={
                         <Suspense fallback={<LoadingFallback />}>
                             <Learning />
                         </Suspense>
                    } />
                  </Route>
                </Routes>
              </Suspense>
            </SocketProvider>
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
