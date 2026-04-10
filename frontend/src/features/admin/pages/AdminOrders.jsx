import React, { useState, useEffect } from 'react';
import { EyeIcon, TruckIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, CurrencyDollarIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all'); // This maps to status
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination & Stats
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [globalStats, setGlobalStats] = useState({ totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 });

  useEffect(() => {
    // Debounce params change
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, filter, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page,
        limit: 20,
        search: searchTerm,
        status: filter
      }).toString();

      const response = await fetch(`http://localhost:3004/api/orders/admin/all?${qs}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      setOrders(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
      if (data.globalStats) {
        setGlobalStats(data.globalStats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3004/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Cập nhật thất bại');
    }
  };

  const updatePaymentStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const confirmMessage = newStatus === 'paid' ? 'Đánh dấu đơn hàng này là ĐÃ thanh toán chứ?' : 'Đánh dấu đơn hàng này CHƯA thanh toán?';
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`http://localhost:3004/api/orders/admin/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ paymentStatus: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchOrders(); // Refresh hoàn toàn nếu bên controller logic tự động sang confirmed
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Cập nhật thất bại');
    }
  };

  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700', icon: ArrowPathIcon },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon },
      shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700', icon: TruckIcon },
      delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircleIcon }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return { ...config };
  };

  const formatPrice = (price) => price?.toLocaleString('vi-VN') + 'đ';
  const formatDate = (date) => new Date(date).toLocaleString('vi-VN');

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <button
          onClick={() => { setPage(1); fetchOrders(); }}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100/50 rounded-lg text-green-600"><CurrencyDollarIcon className="w-8 h-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Doanh thu thu về</p>
            <p className="text-2xl font-bold text-gray-800">{formatPrice(globalStats.totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-yellow-100/50 rounded-lg text-yellow-600"><ViewColumnsIcon className="w-8 h-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Chờ xử lý</p>
            <p className="text-2xl font-bold text-gray-800">{globalStats.pendingOrders} đơn</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100/50 rounded-lg text-blue-600"><TruckIcon className="w-8 h-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đã giao thành công</p>
            <p className="text-2xl font-bold text-gray-800">{globalStats.deliveredOrders} đơn</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between border border-gray-100">
        <div className="flex gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => { setFilter(option.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div>
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>}

      {/* Orders Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Đơn hàng</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Ngày đặt</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Tổng tiền</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Thanh toán</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Trạng thái (Dropdown)</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => {
                  const isPaid = order.paymentStatus === 'paid';
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono font-bold text-blue-600">#{order.orderCode}</span>
                          <p className="font-medium text-gray-800 mt-1">{order.customerName}</p>
                          <p className="text-gray-500 text-xs">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(order.total)}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => updatePaymentStatus(order.id, order.paymentStatus)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                            isPaid 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                          }`}
                          title="Click để thay đổi trạng thái"
                        >
                          {isPaid ? <CheckCircleIcon className="w-4 h-4"/> : <ArrowPathIcon className="w-4 h-4"/>}
                          {isPaid ? 'Đã thu tiền' : 'Chưa thanh toán'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                         <select 
                           value={order.orderStatus} 
                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 outline-none cursor-pointer ${
                             order.orderStatus === 'pending' ? 'border-yellow-300 text-yellow-700' :
                             order.orderStatus === 'confirmed' ? 'border-blue-300 text-blue-700' :
                             order.orderStatus === 'shipping' ? 'border-purple-300 text-purple-700' :
                             order.orderStatus === 'delivered' ? 'border-green-300 text-green-700' :
                             'border-red-300 text-red-700'
                           }`}
                          >
                            <option value="pending">⏳ Chờ xử lý</option>
                            <option value="confirmed">✅ Đã xác nhận</option>
                            <option value="shipping">🚚 Đang giao</option>
                            <option value="delivered">🎉 Tới nơi</option>
                            <option value="cancelled">❌ Đã hủy</option>
                         </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewOrderDetail(order)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-blue-600 transition flex items-center gap-1 text-xs font-medium"
                        >
                          <EyeIcon className="w-4 h-4" /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy kết quả phù hợp
            </div>
          )}
        </div>
      )}

      {/* Pagination component */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang trước
          </button>
          <div className="px-4 py-2 text-gray-600">
            Trang <span className="font-bold text-gray-800">{page}</span> / {totalPages}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang tiếp
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Thông tin đơn hàng <span className="text-blue-600 font-mono">#{selectedOrder.orderCode}</span></h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Dashboard blocks */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Người mua</p>
                <p className="font-bold text-gray-800">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.email}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Giao đến</p>
                <p className="font-bold text-gray-800">{selectedOrder.address}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.ward}, {selectedOrder.district}</p>
                <p className="text-sm text-gray-600">{selectedOrder.city}</p>
              </div>
            </div>

            {/* Order Items */}
            <h3 className="font-semibold text-gray-800 mb-3">📦 Danh sách sản phẩm</h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 border border-gray-100 bg-gray-50/50 rounded-xl items-center">
                  <img 
                      src={`${item.image}?t=${Date.now()}`}
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-lg bg-white"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80?text=Error';
                      }}
                    />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-semibold uppercase text-gray-800">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium text-gray-800">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium text-gray-800">{formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Mã giảm giá:</span>
                    <span className="font-medium">- {formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                  <span className="text-gray-800">Khách phải trả:</span>
                  <span className="text-red-500">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
