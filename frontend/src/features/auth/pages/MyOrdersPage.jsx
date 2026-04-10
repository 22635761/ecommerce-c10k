import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ClockIcon, CheckCircleIcon, TruckIcon, HomeModernIcon,
  XCircleIcon, ChevronDownIcon, ChevronUpIcon, NoSymbolIcon
} from '@heroicons/react/24/solid';

// ─── Timeline Step Config ────────────────────────────────────────────────────
const STEPS = [
  {
    key: 'pending',
    label: 'Đặt hàng',
    desc: 'Đơn hàng đã được đặt thành công',
    icon: ClockIcon,
    color: { active: 'bg-yellow-500', ring: 'ring-yellow-300', text: 'text-yellow-600', line: 'bg-yellow-400' },
  },
  {
    key: 'confirmed',
    label: 'Xác nhận',
    desc: 'Cửa hàng đã xác nhận đơn hàng',
    icon: CheckCircleIcon,
    color: { active: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-blue-600', line: 'bg-blue-400' },
  },
  {
    key: 'shipped',
    label: 'Đang giao',
    desc: 'Đơn hàng đang trên đường giao đến bạn',
    icon: TruckIcon,
    color: { active: 'bg-indigo-500', ring: 'ring-indigo-300', text: 'text-indigo-600', line: 'bg-indigo-400' },
  },
  {
    key: 'delivered',
    label: 'Hoàn thành',
    desc: 'Đơn hàng đã được giao thành công',
    icon: HomeModernIcon,
    color: { active: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-600', line: 'bg-emerald-400' },
  },
];

const getStepIndex = (status) => STEPS.findIndex((s) => s.key === status);
const isCancelled = (status) => status === 'cancelled';

// ─── OrderTimeline Component ─────────────────────────────────────────────────
const OrderTimeline = ({ orderStatus, statusHistory = [] }) => {
  const cancelled = isCancelled(orderStatus);
  const currentIdx = cancelled ? -1 : getStepIndex(orderStatus);

  const getHistoryEntry = (stepKey) =>
    statusHistory.find((h) => h.status === stepKey);

  if (cancelled) {
    const cancelEntry = statusHistory.find((h) => h.status === 'cancelled');
    return (
      <div className="flex items-center gap-3 my-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
          <XCircleIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-red-700">Đơn hàng đã bị hủy</p>
          {cancelEntry && (
            <p className="text-xs text-red-500 mt-0.5">
              {new Date(cancelEntry.timestamp).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="my-5 px-2">
      <div className="relative flex items-start justify-between">
        {/* Progress bar background */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full -z-0" />

        {/* Active progress bar */}
        <div
          className="absolute top-5 left-5 h-1 rounded-full transition-all duration-700 ease-out -z-0"
          style={{
            width: currentIdx <= 0 ? '0%' : `${(currentIdx / (STEPS.length - 1)) * 100}%`,
            backgroundColor:
              currentIdx >= 0 ? STEPS[currentIdx].color.active.replace('bg-', '#') : 'transparent',
            background:
              currentIdx > 0
                ? 'linear-gradient(to right, #eab308, #3b82f6, #6366f1, #10b981)'
                : undefined,
          }}
        />

        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const histEntry = getHistoryEntry(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done
                    ? `${step.color.active} border-white ring-4 ${step.color.ring} shadow-md`
                    : 'bg-white border-gray-300'
                } ${active ? 'scale-110' : ''}`}
              >
                <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-gray-400'}`} />
              </div>

              {/* Label */}
              <p className={`mt-2 text-xs font-bold text-center ${done ? step.color.text : 'text-gray-400'}`}>
                {step.label}
              </p>

              {/* Timestamp */}
              {histEntry && (
                <p className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">
                  {new Date(histEntry.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  <br />
                  {new Date(histEntry.timestamp).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null); // ID đang huỷ
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3004/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Hủy đơn — chỉ khi pending
  const handleCancelOrder = async (orderId, orderCode) => {
    if (!window.confirm(`Xác nhận huỷ đơn hàng #${orderCode}?`)) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`http://localhost:3004/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (data.success) {
        // Cập nhật UI ngay lập tức
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, orderStatus: 'cancelled' } : o
        ));
      } else {
        alert(data.message || 'Không thể huỷ đơn hàng');
      }
    } catch {
      alert('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setCancellingId(null);
    }
  };

  const getPaymentBadge = (order) => {
    if (order.paymentStatus === 'paid')
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 border border-emerald-200 text-emerald-700">✓ Đã thanh toán</span>;
    if (order.paymentStatus === 'unpaid' || order.paymentMethod === 'cod')
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 border border-orange-200 text-orange-700">COD – Thanh toán khi nhận</span>;
    // pending = đang chờ xác nhận thanh toán online
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 border border-yellow-200 text-yellow-700">⏳ Chờ thanh toán</span>;
  };

  const TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ thanh toán' },
    { id: 'shipping', label: 'Chờ giao hàng' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.orderStatus === 'pending';
    if (activeTab === 'shipping') return order.orderStatus === 'confirmed' || order.orderStatus === 'shipped';
    if (activeTab === 'completed') return order.orderStatus === 'delivered';
    if (activeTab === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl font-black text-gray-800 mb-6">📦 Đơn mua</h1>

        {/* ── Tabs List ── */}
        <div className="flex overflow-x-auto bg-white rounded-t-xl border-b border-gray-200 mb-4 px-2 no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-emerald-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="text-gray-200 mb-5">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào trong phân loại này</h3>
            <p className="text-gray-400 mb-6">Cùng khám phá hàng ngàn sản phẩm tuyệt vời!</p>
            <button
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-semibold transition shadow-md"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all"
                >
                  {/* Header row */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-black text-gray-800 text-base">#{order.orderCode}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          {getPaymentBadge(order)}
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Nút huỷ đơn — chỉ khi pending */}
                          {order.orderStatus === 'pending' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleCancelOrder(order.id, order.orderCode); }}
                              disabled={cancellingId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50"
                            >
                              <NoSymbolIcon className="w-3.5 h-3.5" />
                              {cancellingId === order.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                            </button>
                          )}
                          <span className="text-lg font-black text-red-600">
                            {(order.total || 0).toLocaleString('vi-VN')}đ
                          </span>
                          {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>

                    {/* Quick product preview */}
                    <div className="flex items-center gap-2 mt-3">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <img
                          key={i}
                          src={item.image || `https://via.placeholder.com/40`}
                          onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg border border-gray-100 object-cover bg-gray-50"
                        />
                      ))}
                      {order.items?.length > 3 && (
                        <span className="text-xs text-gray-400 ml-1">+{order.items.length - 3} sản phẩm</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Timeline + Items */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-6">
                      {/* Timeline */}
                      <OrderTimeline orderStatus={order.orderStatus} statusHistory={statusHistory} />

                      {/* Products */}
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</p>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex gap-4 items-center py-2 border-b border-gray-50 last:border-0">
                            <img
                              src={item.image || `https://via.placeholder.com/60`}
                              onError={(e) => (e.target.src = 'https://via.placeholder.com/60')}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl border border-gray-100 object-cover bg-gray-50"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name || 'Sản phẩm'}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Số lượng: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-700 text-sm whitespace-nowrap">
                              {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-4 rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Địa chỉ giao hàng</span>
                          <span className="text-right text-gray-800 font-medium max-w-[60%]">
                            {order.address}, {order.ward}, {order.district}, {order.city}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Tạm tính</span>
                          <span>{(order.subtotal || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Phí vận chuyển</span>
                          <span>{(order.shippingFee || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-1">
                          <span>Tổng cộng</span>
                          <span className="text-red-600">{(order.total || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
