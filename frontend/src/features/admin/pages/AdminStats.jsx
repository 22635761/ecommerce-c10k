import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  CheckCircleIcon, 
  ArrowTrendingUpIcon, 
  ClockIcon, 
  XCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3004/api/orders/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setStats(resData.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('vi-VN') + 'đ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-semibold">Không thể tải dữ liệu thống kê</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Thử lại</button>
      </div>
    );
  }

  const { summary, monthlyStats, paymentMethodStats, topProducts } = stats;

  // Find max revenue in monthly stats for scale
  const maxRevenue = monthlyStats.reduce((max, item) => Math.max(max, item.revenue), 0) || 1;

  // Status mapping
  const paymentMethodLabels = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    stripe: 'Thẻ quốc tế (Stripe)',
    sepay: 'Chuyển khoản QR (SePay)'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thống kê & Phân tích doanh số</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu doanh thu thực tế và tổng quan hiệu suất kinh doanh</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition"
        >
          <ArrowPathIcon className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-sm">Làm mới</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu thực nhận */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <CurrencyDollarIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doanh thu thực nhận</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{formatPrice(summary.totalRevenue)}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-0.5 mt-1">
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
              <span>Đã thanh toán</span>
            </p>
          </div>
        </div>

        {/* Tổng số đơn hàng */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng số đơn hàng</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{summary.totalOrders} đơn</p>
            <p className="text-xs text-blue-600 mt-1">Đơn mua hàng phát sinh</p>
          </div>
        </div>

        {/* Giá trị trung bình đơn */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
            <ArrowTrendingUpIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá trị trung bình đơn</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{formatPrice(summary.averageOrderValue)}</p>
            <p className="text-xs text-indigo-600 mt-1">Tính trên đơn đã thanh toán</p>
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đơn hoàn thành</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{summary.deliveredOrders} đơn</p>
            <p className="text-xs text-purple-600 mt-1">Đã giao thành công</p>
          </div>
        </div>
      </div>

      {/* Mini status counts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-amber-800">⏳ Đang chờ xử lý</span>
          <span className="text-lg font-bold text-amber-800">{summary.pendingOrders} đơn</span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-emerald-800">🎉 Đã giao</span>
          <span className="text-lg font-bold text-emerald-800">{summary.deliveredOrders} đơn</span>
        </div>
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-red-800">❌ Đã hủy bỏ</span>
          <span className="text-lg font-bold text-red-800">{summary.cancelledOrders} đơn</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu theo tháng */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Thống kê doanh số theo tháng</h2>
          
          {monthlyStats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có dữ liệu bán hàng</div>
          ) : (
            <div className="space-y-5">
              {monthlyStats.map((item, idx) => {
                const percentage = Math.round((item.revenue / maxRevenue) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-600 font-semibold">Tháng {item.month}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 font-bold">{formatPrice(item.revenue)}</span>
                        <span className="text-gray-400">({item.orders} đơn)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${Math.max(percentage, 3)}%` }} 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-inner flex items-center justify-end px-2"
                      >
                        {percentage > 10 && <span className="text-[10px] text-white font-bold">{percentage}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phương thức thanh toán */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Cơ cấu phương thức thanh toán</h2>
          
          {Object.keys(paymentMethodStats).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có giao dịch</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(paymentMethodStats).map(([method, count], idx) => {
                const colors = [
                  'from-blue-400 to-blue-500 text-blue-500', 
                  'from-purple-400 to-purple-500 text-purple-500',
                  'from-emerald-400 to-emerald-500 text-emerald-500'
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 font-medium">
                        <CreditCardIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{paymentMethodLabels[method] || method}</span>
                      </div>
                      <span className="font-bold text-gray-800">{count} đơn</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`bg-gradient-to-r ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} h-full rounded-full`}
                        style={{ width: `${(count / summary.totalOrders) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 sản phẩm bán chạy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Top 5 Sản phẩm bán chạy nhất</h2>

        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Không có dữ liệu sản phẩm</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-center font-semibold">Mã ID</th>
                  <th className="px-6 py-4 text-center font-semibold">Số lượng bán ra</th>
                  <th className="px-6 py-4 text-right font-semibold">Doanh thu mang lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">{p.id}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800">{p.quantity} chiếc</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
