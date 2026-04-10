import React, { useState } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { ShieldCheckIcon, BanknotesIcon, CreditCardIcon, QrCodeIcon } from '@heroicons/react/24/outline';

// Mock some local payment icons with emojis or text to emulate logos
const paymentMethodsData = [
  { value: 'cod', label: 'Thanh toán khi nhận hàng', icon: BanknotesIcon, color: 'text-green-600', tag: 'An toàn' },
  { value: 'vnpay', label: 'VNPay', icon: QrCodeIcon, color: 'text-blue-600', tag: 'Giảm 10k' },
  { value: 'momo', label: 'Ví MoMo', icon: QrCodeIcon, color: 'text-pink-600', tag: '' },
  { value: 'zalopay', label: 'Ví ZaloPay', icon: QrCodeIcon, color: 'text-blue-500', tag: '' },
  { value: 'sepay', label: 'Chuyển khoản (SePay)', icon: QrCodeIcon, color: 'text-indigo-600', tag: '' },
  { value: 'stripe', label: 'Thẻ Tín dụng/Ghi nợ', icon: CreditCardIcon, color: 'text-orange-500', tag: '' }
];

const cardElementOptions = {
  style: { base: { fontSize: '16px', color: '#424770' }, invalid: { color: '#9e2146' } }
};

const PaymentMethods = ({ paymentMethod, setPaymentMethod, loading, error, onSubmit, finalTotal }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePlaceOrderClick = () => {
    if (paymentMethod === 'cod') {
      setShowConfirmModal(true);
    } else {
      onSubmit(paymentMethod);
    }
  };

  const confirmCodOrder = () => {
    setShowConfirmModal(false);
    onSubmit('cod');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-lg font-semibold text-gray-800">Phương thức thanh toán</h2>
      </div>
      <div className="p-6">
        {/* Payment Methods Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {paymentMethodsData.map(method => {
            const isSelected = paymentMethod === method.value;
            return (
              <div 
                key={method.value} 
                onClick={() => setPaymentMethod(method.value)}
                className={`relative flex flex-col items-center justify-center p-3 border rounded-sm cursor-pointer transition ${
                  isSelected 
                    ? 'border-[#ee4d2d] bg-[#ee4d2d]/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <method.icon className={`w-8 h-8 mb-2 ${method.color}`} />
                <span className={`text-xs text-center font-medium ${isSelected ? 'text-[#ee4d2d]' : 'text-gray-700'}`}>
                  {method.label}
                </span>

                {method.tag && (
                  <div className="absolute -top-2 -right-2 bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-sm font-bold border border-orange-200 shadow-sm z-10 whitespace-nowrap">
                    {method.tag}
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-4 h-4 bg-[#ee4d2d] translate-x-1 translate-y-1"></div>
                    <svg className="absolute bottom-0 right-0 w-2.5 h-2.5 text-white z-10" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {paymentMethod === 'stripe' && (
          <div className="mb-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
            <p className="text-sm text-gray-600 mb-3 font-medium">Nhập thông tin thẻ quốc tế:</p>
            <CardElement options={cardElementOptions} className="p-3 bg-white border border-gray-300 rounded-sm" />
          </div>
        )}
        
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-sm text-sm">{error}</div>}
        
        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            <span>Mọi thông tin thanh toán đều được bảo mật an toàn.</span>
          </div>

          <button 
            onClick={handlePlaceOrderClick} 
            disabled={loading} 
            className="w-full md:w-64 bg-[#ee4d2d] text-white py-3 px-4 rounded-sm font-bold uppercase hover:bg-[#d74325] disabled:opacity-50 transition shadow-sm"
          >
            {loading ? 'Đang xử lý...' : `Đặt hàng`}
          </button>
        </div>
      </div>

      {/* ─── MODAL XÁC NHẬN COD ──────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-orange-50 border-b border-orange-100 p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3">
                <BanknotesIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận đặt hàng</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bạn đã chọn thanh toán khi nhận hàng (COD).
              </p>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tổng thanh toán:</span>
                <span className="text-base font-black text-red-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <p className="text-xs text-gray-400 text-center italic">
                Vui lòng chuẩn bị sẵn số tiền trên khi shipper giao hàng đến nhé!
              </p>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3 border-t">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmCodOrder}
                className="flex-1 px-4 py-2 bg-[#ee4d2d] text-white rounded-lg hover:bg-[#d74325] shadow-md shadow-[#ee4d2d]/20 font-semibold transition"
              >
                Đồng ý Đặt
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PaymentMethods;
