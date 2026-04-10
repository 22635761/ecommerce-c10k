import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../../cart/context/CartContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { TagIcon, CheckBadgeIcon, ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Hooks
import { useAddressData } from '../hooks/useAddressData';
import { useShipping } from '../hooks/useShipping';
import { useCheckoutSubmit } from '../hooks/useCheckoutSubmit';
import { useAddressBook } from '../hooks/useAddressBook';

// Components
import AddressForm from '../components/AddressForm';
import OrderSummary from '../components/OrderSummary';
import PaymentMethods from '../components/PaymentMethods';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK || 'pk_test_51TFHkSLFOoleIVMFGcT1fj9umcYl2kj8KrXmFq7JU7tigKIrRJSB2Ik3amNANvkbKHsGcGZxOr6KgFzlzw5LsXiL00amVrtWvw');

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const CheckoutForm = ({ cart, total, user }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    province: '',
    provinceCode: '',
    district: '',
    districtCode: '',
    ward: '',
    wardCode: '',
    note: ''
  });

  // ─── Address Book ────────────────────────────────────────────────────────
  const { addresses: savedAddresses, defaultAddress, saveAddress, setDefault, removeAddress } = useAddressBook(user?.id);

  // Pre-fill địa chỉ mặc định khi load trang (chỉ 1 lần)
  const addressPrefilled = useRef(false);
  useEffect(() => {
    if (addressPrefilled.current || !defaultAddress) return;
    addressPrefilled.current = true;
    setFormData(prev => ({
      ...prev,
      customerName: defaultAddress.customerName || prev.customerName,
      phone: defaultAddress.phone || prev.phone,
      email: defaultAddress.email || prev.email,
      address: defaultAddress.address || '',
      province: defaultAddress.province || '',
      provinceCode: defaultAddress.provinceCode || '',
      district: defaultAddress.district || '',
      districtCode: defaultAddress.districtCode || '',
      ward: defaultAddress.ward || '',
      wardCode: defaultAddress.wardCode || '',
      ghnDistrictId: defaultAddress.ghnDistrictId || null,
      ghnWardCode: defaultAddress.ghnWardCode || null,
    }));
  }, [defaultAddress]);

  // Chọn địa chỉ từ sổ — điền vào form
  const handleSelectSavedAddress = (addr) => {
    setFormData(prev => ({
      ...prev,
      customerName: addr.customerName || prev.customerName,
      phone: addr.phone || prev.phone,
      email: addr.email || prev.email,
      address: addr.address || '',
      province: addr.province || '',
      provinceCode: addr.provinceCode || '',
      district: addr.district || '',
      districtCode: addr.districtCode || '',
      ward: addr.ward || '',
      wardCode: addr.wardCode || '',
      ghnDistrictId: addr.ghnDistrictId || null,
      ghnWardCode: addr.ghnWardCode || null,
    }));
  };

  // ===== STATE VOUCHER (có thể thêm/đổi ngay tại Checkout) =====
  const [appliedVoucher, setAppliedVoucher] = useState(cart.appliedVoucher || null);
  const [discountAmount, setDiscountAmount] = useState(cart.discountAmount || 0);
  const [isFreeShipping, setIsFreeShipping] = useState(cart.isFreeShipping || false);
  const [voucherCode, setVoucherCode] = useState(cart.appliedVoucher?.code || '');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [showVoucherPanel, setShowVoucherPanel] = useState(false);

  // Load danh sách voucher từ DB
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/discounts/active`);
        const data = await res.json();
        if (data.success) setActiveVouchers(data.data || []);
      } catch (e) { /* ignore */ }
    };
    fetchVouchers();
  }, []);

  // Khi SePay redirect về sau khi thanh toán thành công
  useEffect(() => {
    const success = searchParams.get('success');
    const orderCode = searchParams.get('order');
    const method = searchParams.get('method') || 'sepay'; // SePay redirect về đây
    if (success === 'true' && orderCode) {
      (async () => {
        if (cart.isPartialCart && cart.items?.length > 0 && cart.removeFromCart) {
          for (const item of cart.items) {
            if (item.productId) await cart.removeFromCart(item.productId);
          }
        } else if (!cart.isBuyNow && cart.clearCart) {
          await cart.clearCart();
        }
        navigate(`/checkout/success?success=true&order=${orderCode}&method=${method}`);
      })();
    }
  }, [searchParams]);


  const subtotal = total;
  const {
    shippingFee, setShippingFee, shippingSource, loadingFee,
    leadtime, feeDetails, calculateShipping
  } = useShipping(cart.items);

  const {
    provinces, districts, wards, loadingAddress,
    handleProvinceChange, handleDistrictChange, handleWardChange, handleChange
  } = useAddressData(formData, setFormData, setShippingFee, calculateShipping);

  // Tính lại finalTotal mỗi khi voucher/phí ship thay đổi
  let finalTotal = subtotal + shippingFee;
  if (isFreeShipping) {
    finalTotal = subtotal;
  } else {
    finalTotal = Math.max(0, finalTotal - discountAmount);
  }

  const appliedDiscountForSubmit = appliedVoucher ? { discount: appliedVoucher } : null;

  const { loading, error, submitOrder } = useCheckoutSubmit({
    formData, cart, subtotal, shippingFee, finalTotal, discountAmount,
    appliedDiscount: appliedDiscountForSubmit, navigate, stripe, elements,
    checkoutItems: cart.items,
    isBuyNow: cart.isBuyNow,
    isPartialCart: cart.isPartialCart,
    removeFromCart: cart.removeFromCart,
    clearCart: cart.clearCart,
    saveAddress   // ← tự động lưu địa chỉ sau checkout
  });

  const formatPrice = (p) => (p || 0).toLocaleString('vi-VN') + 'đ';

  const calcDiscount = (voucher, sub) => {
    if (!voucher) return { amount: 0, freeShip: false };
    if (voucher.type === 'percentage') {
      let amt = Math.round(sub * (voucher.value / 100));
      if (voucher.maxDiscount) amt = Math.min(amt, voucher.maxDiscount);
      return { amount: amt, freeShip: false };
    } else if (voucher.type === 'fixed') {
      return { amount: Math.min(voucher.value, sub), freeShip: false };
    } else if (voucher.type === 'free_shipping') {
      return { amount: 0, freeShip: true };
    }
    return { amount: 0, freeShip: false };
  };

  const handleApplyVoucher = async (code) => {
    const codeToApply = code || voucherCode;
    if (!codeToApply.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await fetch(`${API_BASE}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply, subtotal, items: cart.items })
      });
      const data = await res.json();
      if (data.success) {
        const voucher = data.data?.discount || data.data;
        const { amount, freeShip } = calcDiscount(voucher, subtotal);
        setAppliedVoucher(voucher);
        setDiscountAmount(amount);
        setIsFreeShipping(freeShip);
        setVoucherCode(codeToApply);
        setShowVoucherPanel(false);
        setVoucherError('');
      } else {
        setVoucherError(data.message || 'Mã không hợp lệ hoặc không đủ điều kiện');
      }
    } catch {
      setVoucherError('Không thể kết nối máy chủ');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setIsFreeShipping(false);
    setVoucherCode('');
    setVoucherError('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/cart')} className="text-gray-400 hover:text-blue-600 transition p-1">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Đặt hàng</h1>
            <p className="text-gray-400 text-sm">Kiểm tra lại thông tin và hoàn tất đơn hàng</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <button onClick={() => navigate('/cart')} className="hover:text-blue-600 transition">Giỏ hàng</button>
          <span>›</span>
          <span className="text-blue-600 font-semibold">Đặt hàng</span>
          <span>›</span>
          <span>Thanh toán</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ===== CỘT TRÁI: Địa chỉ + PTTT ===== */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <AddressForm
              formData={formData}
              handleChange={handleChange}
              provinces={provinces}
              districts={districts}
              wards={wards}
              handleProvinceChange={handleProvinceChange}
              handleDistrictChange={handleDistrictChange}
              handleWardChange={handleWardChange}
              loadingAddress={loadingAddress}
              savedAddresses={savedAddresses}
              onSetDefault={setDefault}
              onDeleteAddress={removeAddress}
              onSelectSavedAddress={handleSelectSavedAddress}
            />

            <PaymentMethods
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              loading={loading}
              error={error}
              onSubmit={submitOrder}
              finalTotal={finalTotal}
            />
          </div>

          {/* ===== CỘT PHẢI: Voucher + Tổng kết ===== */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ===== VOUCHER SECTION (có thể thêm/đổi ngay tại Checkout) ===== */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-700">Mã giảm giá</h3>
              </div>

              {appliedVoucher ? (
                <div>
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckBadgeIcon className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-bold text-green-700 text-sm">{appliedVoucher.code}</p>
                        <p className="text-xs text-green-600">
                          {isFreeShipping ? 'Miễn phí vận chuyển' :
                           appliedVoucher.type === 'percentage' ? `Giảm ${appliedVoucher.value}%` :
                           `Giảm ${formatPrice(discountAmount)}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleRemoveVoucher} className="text-gray-400 hover:text-red-500 transition ml-2">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-1.5 text-right font-medium">
                    🎉 Tiết kiệm {isFreeShipping ? 'phí vận chuyển' : formatPrice(discountAmount)}
                  </p>
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
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {voucherLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-red-500 text-xs mt-1.5">{voucherError}</p>
                  )}

                  {/* Danh sách voucher có sẵn */}
                  {activeVouchers.length > 0 && (
                    <button
                      onClick={() => setShowVoucherPanel(!showVoucherPanel)}
                      className="flex items-center gap-1 text-blue-600 text-xs mt-2 hover:underline"
                    >
                      <TagIcon className="w-3.5 h-3.5" />
                      Chọn từ {activeVouchers.length} voucher có sẵn
                      <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${showVoucherPanel ? 'rotate-90' : ''}`} />
                    </button>
                  )}

                  {showVoucherPanel && (
                    <div className="mt-3 space-y-2 max-h-44 overflow-y-auto">
                      {activeVouchers.map(v => (
                        <div
                          key={v._id || v.code}
                          onClick={() => handleApplyVoucher(v.code)}
                          className="flex items-start justify-between border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition"
                        >
                          <div>
                            <p className="font-bold text-blue-700 text-sm">{v.code}</p>
                            <p className="text-xs text-gray-500">
                              {v.description ||
                               (v.type === 'percentage' ? `Giảm ${v.value}%` :
                                v.type === 'free_shipping' ? 'Miễn phí vận chuyển' :
                                `Giảm ${v.value?.toLocaleString('vi-VN')}đ`)}
                            </p>
                          </div>
                          <span className="text-xs text-blue-600 font-semibold shrink-0 ml-2">Dùng ngay</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tóm tắt đơn hàng */}
            <OrderSummary
              cartItems={cart.items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              shippingSource={shippingSource}
              loadingFee={loadingFee}
              leadtime={leadtime}
              feeDetails={feeDetails}
              appliedDiscount={appliedVoucher ? { discount: appliedVoucher } : null}
              discountAmount={isFreeShipping ? shippingFee : discountAmount}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { cart, total, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  const customItems = location.state?.checkoutItems;
  const isBuyNow = location.state?.isBuyNow;
  const isPartialCart = location.state?.isPartialCart;
  const reservationId = location.state?.reservationId;
  const appliedVoucher = location.state?.appliedVoucher;
  const discountAmount = location.state?.discountAmount || 0;
  const isFreeShipping = location.state?.isFreeShipping || false;

  const checkoutItems = customItems || cart?.items || [];
  const checkoutTotal = customItems
    ? customItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : total;

  const syntheticCart = {
    ...cart,
    items: checkoutItems,
    isBuyNow,
    isPartialCart,
    reservationId,
    appliedVoucher,
    discountAmount,
    isFreeShipping,
    removeFromCart,
    clearCart
  };

  useEffect(() => {
    if (!checkoutItems || checkoutItems.length === 0) {
      window.location.href = '/cart';
    }
  }, [checkoutItems]);

  if (!checkoutItems?.length) return null;

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm cart={syntheticCart} total={checkoutTotal} user={user} />
    </Elements>
  );
};

export default CheckoutPage;
