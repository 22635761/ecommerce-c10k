import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../cart/context/CartContext';

const SuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const success = searchParams.get('success') === 'true';
  const orderCode = searchParams.get('order') || '';
  const paymentMethod = searchParams.get('method') || '';  // 'cod' | 'stripe' | 'sepay'
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (success && orderCode && !hasConfirmed.current) {
      hasConfirmed.current = true;
      // 1. Xoá giỏ hàng
      clearCart();
      // 2. Chỉ gọi confirm-payment cho SePay (redirect flow)
      //    COD: chưa thu tiền → giữ nguyên pending
      //    Stripe: đã verify qua /verify-stripe riêng
      if (paymentMethod === 'sepay') {
        fetch('http://localhost:3004/api/orders/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ orderCode })
        });
      }
    }
  }, [success, orderCode, paymentMethod, clearCart]);

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-600 mb-4">Có lỗi xảy ra trong quá trình thanh toán.</p>
          <p className="text-sm text-gray-500 mb-6">Mã đơn hàng: {orderCode || 'Không xác định'}</p>
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">✅ Thanh toán thành công!</h1>
        <p className="text-gray-600 mb-4">Cảm ơn bạn đã đặt hàng.</p>
        <p className="text-sm text-gray-500 mb-2">
          Mã đơn hàng: <strong className="text-blue-600">{orderCode}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ sớm.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🏠 Tiếp tục mua sắm
          </button>
          <button
            onClick={() => navigate('/profile/orders')}
            className="w-full px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            📦 Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
