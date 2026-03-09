import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { ArrowUp, ArrowDown, Users, ChartPie, ShoppingBag, Percent, Package, Home } from 'lucide-react';

const AdminDashboard = () => {
    // Real Data States
    const [revenue, setRevenue] = useState([]);
    const [hourlyTx, setHourlyTx] = useState([]);
    const [conversion, setConversion] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [topHouses, setTopHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                const [revRes, txRes, convRes, prodRes, houseRes] = await Promise.all([
                    api.get('/admin/analytics/revenue'),
                    api.get('/admin/analytics/hourly-tx'),
                    api.get('/admin/analytics/conversion'),
                    api.get('/admin/analytics/top-products'),
                    api.get('/admin/analytics/top-houses')
                ]);

                // Map Revenue Data
                const revData = revRes.revenue.map(r => {
                    const d = new Date(r.date);
                    return {
                        name: d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }),
                        total: parseFloat(r.revenue)
                    };
                });
                setRevenue(revData);

                // Map Hourly Tx for Bar Chart
                const txData = txRes.transactions.map((count, i) => ({
                    name: `${i}:00`,
                    orders: count
                })).filter((_, i) => i % 2 === 0); // show every 2 hours to fit nicely
                
                setHourlyTx(txData);
                setConversion(convRes);
                
                // Process Top Products and Houses
                setTopProducts(prodRes.topProducts || []);
                setTopHouses(houseRes.topHouses || []);

            } catch (error) {
                console.error("Dashboard Load Error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRealData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fe]">
                 <div className="w-16 h-16 border-4 border-[#5e72e4] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Colors for progress bars in Top Products
    const barColors = ['bg-[#f5365c]', 'bg-[#2dce89]', 'bg-[#5e72e4]', 'bg-[#11cdef]', 'bg-[#fb6340]', 'bg-[#8965e0]'];
    const maxSold = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.total_sold)) : 1;

    return (
        <div className="min-h-screen bg-[#f8f9fe] font-sans flex flex-col relative w-full overflow-hidden">
            
            {/* Blue Header Background */}
            <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-r from-[#11cdef] to-[#1171ef] z-0"></div>

            <div className="relative z-10 flex-1 flex flex-col w-full max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
                
                {/* Navbar */}
                <div className="flex justify-between items-center mb-10 mt-2">
                    <h1 className="text-white text-[1.25rem] font-semibold uppercase tracking-wide">BẢNG ĐIỀU KHIỂN</h1>
                </div>

                {/* KPI Cards Layer */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {/* Card 1 */}
                    <div className="bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[#8898aa] text-[0.8125rem] font-bold uppercase mb-1">TRUY CẬP HÔM NAY</span>
                                <span className="text-[#32325d] text-[1.25rem] font-bold">{conversion?.visits?.toLocaleString() || 0}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#f5365c] text-white flex items-center justify-center shadow-md">
                                <ChartPie size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-[0.875rem]">
                            <span className="text-[#2dce89] font-bold mr-2">↑ Tham quan</span>
                            <span className="text-[#525f7f]">Lượt ghé thăm trang</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[#8898aa] text-[0.8125rem] font-bold uppercase mb-1">CỘNG ĐỒNG</span>
                                <span className="text-[#32325d] text-[1.25rem] font-bold">{topHouses?.length || 0}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#fb6340] text-white flex items-center justify-center shadow-md">
                                <Home size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-[0.875rem]">
                            <span className="text-[#2dce89] font-bold mr-2">Hàng đầu</span>
                            <span className="text-[#525f7f]">Nhà hoạt động</span>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[#8898aa] text-[0.8125rem] font-bold uppercase mb-1">ĐƠN HÀNG MỚI</span>
                                <span className="text-[#32325d] text-[1.25rem] font-bold">{conversion?.orders?.toLocaleString() || 0}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#ffd600] text-white flex items-center justify-center shadow-md">
                                <ShoppingBag size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-[0.875rem]">
                            <span className="text-[#2dce89] font-bold mr-2">Thực tế</span>
                            <span className="text-[#525f7f]">Giao dịch hoàn tất</span>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[#8898aa] text-[0.8125rem] font-bold uppercase mb-1">TỶ LỆ CHUYỂN ĐỔI</span>
                                <span className="text-[#32325d] text-[1.25rem] font-bold">{conversion?.rate || 0}%</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#11cdef] text-white flex items-center justify-center shadow-md">
                                <Percent size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-[0.875rem]">
                            <span className="text-[#2dce89] font-bold mr-2">Khách hàng</span>
                            <span className="text-[#525f7f]">Số người mua sắm</span>
                        </div>
                    </div>
                </div>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                    
                    {/* Dark Line Chart - TỔNG QUAN */}
                    <div className="xl:col-span-2 bg-[#172b4d] rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-6 pb-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h6 className="text-[#e2e8f0] text-[0.625rem] font-bold uppercase tracking-widest mb-1">TỔNG QUAN</h6>
                                <h2 className="text-white text-[1.25rem] font-bold mb-0">Doanh thu hệ thống (7 ngày)</h2>
                            </div>
                        </div>
                        <div className="w-full h-[350px] -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenue} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5e72e4" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#5e72e4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#8898aa" tick={{fill: '#8898aa', fontSize: 13}} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis 
                                        stroke="#8898aa" 
                                        tick={{fill: '#8898aa', fontSize: 13}} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : `${val/1000}k`} 
                                        dx={-10} 
                                    />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '4px', color: '#32325d', fontSize: '13px', fontWeight: 'bold' }}
                                        formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#5e72e4" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, fill: '#172b4d', stroke: '#5e72e4', strokeWidth: 3 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Light Bar Chart - HIỆU SUẤT */}
                    <div className="xl:col-span-1 bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] p-6 pb-2">
                        <div className="mb-4">
                            <h6 className="text-[#8898aa] text-[0.625rem] font-bold uppercase tracking-widest mb-1">HIỆU SUẤT TRONG NGÀY</h6>
                            <h2 className="text-[#32325d] text-[1.25rem] font-bold mb-0">Đơn Hàng Giao Dịch</h2>
                        </div>
                        <div className="w-full h-[350px] -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyTx} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                    <XAxis dataKey="name" stroke="#8898aa" tick={{fill: '#8898aa', fontSize: 13}} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#8898aa" tick={{fill: '#8898aa', fontSize: 13}} tickLine={false} axisLine={false} dx={-10} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#32325d', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                                        cursor={{fill: 'rgba(233, 236, 239, 0.4)'}}
                                        formatter={(value) => [value, 'Đơn Hàng']}
                                        labelFormatter={(label) => `Giờ: ${label}`}
                                    />
                                    <Bar dataKey="orders" fill="#fb6340" radius={[4, 4, 4, 4]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Dynamic Data Tables Area (Products and Houses) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                    
                    {/* Left Column - Top Products (2/3) */}
                    <div className="xl:col-span-2 bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] border-0 overflow-hidden flex flex-col h-fit">
                        <div className="px-6 py-4 flex flex-row justify-between items-center border-b border-[#e9ecef]">
                            <h2 className="text-[#32325d] text-[1.0625rem] font-semibold mb-0 tracking-tight flex items-center gap-2">
                                Sản Phẩm Bán Chạy Nhất
                            </h2>
                            <button className="bg-[#5e72e4] hover:bg-[#324cdd] text-white px-[0.75rem] py-[0.375rem] rounded-[0.25rem] text-[0.75rem] font-semibold transition-all shadow-[0_4px_6px_rgba(50,50,93,.11),0_1px_3px_rgba(0,0,0,.08)] shrink-0">
                                Xem tất cả
                            </button>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[600px] items-center bg-transparent">
                                <thead className="bg-[#f6f9fc] text-[#8898aa]">
                                    <tr>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef]">Tên Sản Phẩm</th>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef]">Đã Bán</th>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef]">Doanh Thu</th>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef]">Thị Phần</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {topProducts.slice(0, 5).map((item, idx) => {
                                        const percentage = Math.round((item.total_sold / maxSold) * 100) || 0;
                                        const color = barColors[idx % barColors.length];
                                        return (
                                            <tr key={idx} className="border-b border-[#e9ecef] hover:bg-[#f6f9fc]/50 transition-colors">
                                                <th scope="row" className="px-6 py-4 text-[0.8125rem] font-semibold text-[#32325d] max-w-[200px] truncate" title={item.name}>
                                                    {item.name}
                                                </th>
                                                <td className="px-6 py-4 text-[0.8125rem] text-[#525f7f]">
                                                    {item.total_sold} món
                                                </td>
                                                <td className="px-6 py-4 text-[0.8125rem] text-[#2dce89] font-semibold flex items-center gap-1">
                                                    <ArrowUp size={14} className="text-[#2dce89]" />
                                                    {parseInt(item.total_revenue).toLocaleString('vi-VN')} đ
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 w-full max-w-[150px]">
                                                        <span className="text-[0.8125rem] text-[#525f7f] w-10 text-right">{percentage}%</span>
                                                        <div className="w-full bg-[#e9ecef] rounded-full h-[3px] flex-1 overflow-hidden">
                                                            <div className={`h-[3px] rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {topProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-[#8898aa] text-sm italic">Không có dữ liệu bán hàng.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column - Top Houses (1/3) */}
                    <div className="xl:col-span-1 bg-white rounded-[0.375rem] shadow-[0_0_2rem_0_rgba(136,152,170,.15)] border-0 overflow-hidden flex flex-col h-fit">
                        <div className="px-6 py-4 flex flex-row justify-between items-center border-b border-[#e9ecef]">
                            <h2 className="text-[#32325d] text-[1.0625rem] font-semibold mb-0 tracking-tight leading-tight">Nhà Cộng Đồng <br className="hidden lg:block xl:hidden"/> Hoạt Động</h2>
                            <button className="bg-[#5e72e4] hover:bg-[#324cdd] text-white px-[0.75rem] py-[0.375rem] rounded-[0.25rem] text-[0.75rem] font-semibold transition-all shadow-[0_4px_6px_rgba(50,50,93,.11),0_1px_3px_rgba(0,0,0,.08)] shrink-0 mt-0">
                                Quản lý
                            </button>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[350px] items-center bg-transparent">
                                <thead className="bg-[#f6f9fc] text-[#8898aa]">
                                    <tr>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef]">Tên Nhà</th>
                                        <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider border-y border-[#e9ecef] text-center">Hoạt Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {topHouses.slice(0, 5).map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#e9ecef] hover:bg-[#f6f9fc]/50 transition-colors">
                                            <th scope="row" className="px-6 py-4 text-[0.8125rem] font-semibold text-[#32325d] whitespace-nowrap max-w-[150px] truncate" title={item.name}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#11cdef]/20 text-[#11cdef] flex items-center justify-center font-bold text-[10px]">
                                                        #{idx+1}
                                                    </div>
                                                    {item.name}
                                                </div>
                                            </th>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-[0.75rem] text-[#525f7f]">
                                                    <div className="flex justify-between items-center">
                                                        <span>Thành viên:</span>
                                                        <span className="font-semibold text-[#32325d]">{item.member_count}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span>Giao dịch:</span>
                                                        <span className="font-semibold text-[#32325d]">{item.tx_count}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-[#f6f9fc] px-2 py-0.5 rounded text-[10px] font-bold text-[#5e72e4] mt-1 border border-[#e9ecef]">
                                                        <span>Điểm: </span>
                                                        <span>{item.score}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {topHouses.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-8 text-center text-[#8898aa] text-sm italic">Không có Nhà nào hoạt động.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto px-1 w-full flex flex-col md:flex-row justify-between items-center text-[0.8rem] xl:text-[0.875rem]">
                    <div className="text-[#8898aa] mb-4 md:mb-0">
                        &copy; 2026 Được phát triển bởi <span className="text-[#5e72e4] hover:text-[#233dd2] cursor-pointer font-semibold transition">Duy Đẹp Trai</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                        <a href="#" className="text-[#8898aa] hover:text-[#5e72e4] transition font-normal hidden lg:block">Bản quyền</a>
                        <a href="#" className="text-[#8898aa] hover:text-[#5e72e4] transition font-normal">Hỗ trợ</a>
                        <a href="#" className="text-[#8898aa] hover:text-[#5e72e4] transition font-normal">Điều khoản</a>
                        <a href="#" className="text-[#8898aa] hover:text-[#5e72e4] transition font-normal">Quản lý Admin</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AdminDashboard;
