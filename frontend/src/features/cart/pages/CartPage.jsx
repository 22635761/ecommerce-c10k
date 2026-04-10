import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon, TagIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../auth/hooks/useAuth';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const CartPage = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = cart?.items || [];

  // selectedProductId: khi bấm "Mua ngay" sẽ tích chọn sẵn đúng sản phẩm đó (chuẩn Shopee)
  const buyNowProductId = location.state?.selectedProductId;

  const [selectedItems, setSelectedItems] = useState([]);
  
  // Voucher trực tiếp trên trang Cart
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [showVoucherPanel, setShowVoucherPanel] = useState(false);

  // Khi items load xong:
  // - Nếu đến từ "Mua ngay" thì chỉ tích sản phẩm đó
  // - Nếu đến từ giỏ hàng thường thì tích tất cả
  useEffect(() => {
    if (items.length > 0) {
      if (buyNowProductId) {
        // Chỉ tích sản phẩm dười đây
        setSelectedItems([buyNowProductId]);
      } else {
        setSelectedItems(items.map(item => item.productId));
      }
    }
  }, [items.length, buyNowProductId]);

  // Load danh sách voucher từ DB
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/discounts/active`);
        const data = await res.json();
        if (data.success) setActiveVouchers(data.data || []);
      } catch (e) { /* Bỏ qua lỗi */ }
    };
    fetchVouchers();
  }, []);

  const formatPrice = (price) => price?.toLocaleString('vi-VN') + 'đ';

  const handleSelectAll = (e) => {
    setSelectedItems(e.target.checked ? items.map(i => i.productId) : []);
  };

  const handleSelectItem = (productId) => {
    setSelectedItems(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const selectedCartObjects = items.filter(item => selectedItems.includes(item.productId));
  const selectedSubtotal = selectedCartObjects.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Tính tiền voucher
  let discountAmount = 0;
  let isFreeShipping = false;
  if (appliedVoucher) {
    const d = appliedVoucher;
    if (d.type === 'percentage') {
      discountAmount = Math.round(selectedSubtotal * (d.value / 100));
      if (d.maxDiscount) discountAmount = Math.min(discountAmount, d.maxDiscount);
    } else if (d.type === 'fixed') {
      discountAmount = Math.min(d.value, selectedSubtotal);
    } else if (d.type === 'free_shipping') {
      isFreeShipping = true;
    }
  }

  const handleApplyVoucher = async (code) => {
    const codeToApply = code || voucherCode;
    if (!codeToApply.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await fetch(`${API_BASE}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply, subtotal: selectedSubtotal, items: selectedCartObjects })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedVoucher(data.data?.discount || data.data);
        setVoucherCode(codeToApply);
        setShowVoucherPanel(false);
        setVoucherError('');
      } else {
        setVoucherError(data.message || 'Mã không hợp lệ');
      }
    } catch {
      setVoucherError('Không thể kết nối máy chủ');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new Event('openLoginModal'));
      return;
    }
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để mua hàng!');
      return;
    }
    navigate('/checkout', {
      state: {
        checkoutItems: selectedCartObjects,
        isPartialCart: true,
        appliedVoucher: appliedVoucher,
        discountAmount,
        isFreeShipping
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-gray-500">Đang tải giỏ hàng...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBagIcon className="w-24 h-24 text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-400 mb-6">Hãy chọn thêm sản phẩm để mua sắm nhé!</p>
        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-200">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng ({items.length})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== CỘT TRÁI: Danh sách sản phẩm ===== */}
          <div className="lg:col-span-2 space-y-3">
            {/* Header chọn tất cả */}
            <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100 shadow-sm">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedItems.length === items.length && items.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 cursor-pointer accent-blue-600 rounded"
              />
              <label htmlFor="select-all" className="font-semibold text-gray-700 cursor-pointer select-none">
                Chọn tất cả ({items.length} sản phẩm)
              </label>
              {selectedItems.length > 0 && (
                <span className="ml-auto text-sm text-blue-600 font-medium">
                  Đã chọn {selectedItems.length}
                </span>
              )}
            </div>

            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {items.map((item) => {
                const isSelected = selectedItems.includes(item.productId);
                return (
                  <div key={item.productId} className={`flex gap-4 p-4 transition-colors ${isSelected ? 'bg-blue-50/40' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item.productId)}
                        className="w-5 h-5 cursor-pointer accent-blue-600"
                      />
                    </div>
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.productId}`} className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 text-sm leading-snug">
                        {item.name}
                      </Link>
                      <p className="text-red-500 font-bold mt-1">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 transition"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 transition"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            removeFromCart(item.productId);
                            setSelectedItems(prev => prev.filter(id => id !== item.productId));
                          }}
                          className="ml-auto text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition"
                          title="Xóa sản phẩm"
                        >
                          <TrashIcon className="w-4.5 h-4.5 w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:flex items-center">
                      <p className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ===== KHU VỰC VOUCHER (Giống Shopee – Ngay trên trang Giỏ hàng) ===== */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Mã giảm giá</h3>
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-bold text-green-700">{appliedVoucher.code}</p>
                      <p className="text-xs text-green-600">
                        {appliedVoucher.type === 'free_shipping' ? 'Miễn phí vận chuyển' :
                         appliedVoucher.type === 'percentage' ? `Giảm ${appliedVoucher.value}%` :
                         `Giảm ${formatPrice(appliedVoucher.value)}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleRemoveVoucher} className="text-gray-400 hover:text-red-500 transition">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                      placeholder="Nhập mã voucher..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleApplyVoucher()}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {voucherLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {voucherError && <p className="text-red-500 text-xs mt-1.5">{voucherError}</p>}

                  {/* Nút chọn voucher có sẵn */}
                  {activeVouchers.length > 0 && (
                    <button
                      onClick={() => setShowVoucherPanel(!showVoucherPanel)}
                      className="flex items-center gap-1 text-blue-600 text-sm mt-2 hover:underline"
                    >
                      Xem {activeVouchers.length} voucher khả dụng
                      <ChevronRightIcon className={`w-4 h-4 transition-transform ${showVoucherPanel ? 'rotate-90' : ''}`} />
                    </button>
                  )}

                  {showVoucherPanel && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {activeVouchers.map(v => (
                        <div
                          key={v._id || v.code}
                          onClick={() => handleApplyVoucher(v.code)}
                          className="flex items-start justify-between border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition"
                        >
                          <div>
                            <p className="font-bold text-blue-700 text-sm">{v.code}</p>
                            <p className="text-xs text-gray-500">{v.description || (
                              v.type === 'percentage' ? `Giảm ${v.value}%` :
                              v.type === 'free_shipping' ? 'Miễn phí vận chuyển' :
                              `Giảm ${v.value?.toLocaleString('vi-VN')}đ`
                            )}</p>
                          </div>
                          <span className="text-xs text-blue-600 font-semibold shrink-0 ml-2">Dùng ngay</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===== CỘT PHẢI: Tổng đơn hàng ===== */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Tóm tắt đơn hàng</h2>

              {/* Danh sách sản phẩm đã chọn */}
              {selectedCartObjects.length === 0 ? (
                <p className="text-gray-400 text-sm py-3 border-b border-gray-100">Chưa chọn sản phẩm nào.</p>
              ) : (
                <div className="space-y-2 border-b border-gray-100 pb-4 max-h-52 overflow-y-auto">
                  {selectedCartObjects.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-gray-600 line-clamp-1 flex-1 pr-2">{item.name} <span className="font-medium">x{item.quantity}</span></span>
                      <span className="font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(selectedSubtotal)}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá ({appliedVoucher.code})</span>
                    <span>- {isFreeShipping ? 'Miễn ship' : formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-gray-400 italic">{isFreeShipping ? <span className="text-green-600 font-medium">Miễn phí</span> : 'Tính ở bước tiếp'}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Thành tiền</span>
                  <span className="text-2xl font-bold text-red-500">{formatPrice(selectedSubtotal - discountAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                disabled={selectedItems.length === 0}
                className="w-full mt-5 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-blue-200"
              >
                Mua hàng ({selectedItems.length})
              </button>

              <div className="flex justify-between mt-3">
                <button onClick={clearCart} className="text-red-400 text-sm hover:text-red-600 transition">
                  Xóa giỏ hàng
                </button>
                <Link to="/" className="text-blue-500 text-sm hover:underline">
                  Mua thêm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
