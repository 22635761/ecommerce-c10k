import React from 'react';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const GHN_STATUS_MAP = {
  ready_to_pick: { label: 'Chờ lấy hàng', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  picking: { label: 'Đang lấy hàng', color: 'text-blue-600', bg: 'bg-blue-50' },
  cancel: { label: 'Đã huỷ', color: 'text-red-600', bg: 'bg-red-50' },
  money_collect_picking: { label: 'Thu tiền - Đang lấy', color: 'text-orange-600', bg: 'bg-orange-50' },
  picked: { label: 'Đã lấy hàng', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  storing: { label: 'Lưu kho', color: 'text-gray-600', bg: 'bg-gray-50' },
  transporting: { label: 'Đang vận chuyển', color: 'text-blue-700', bg: 'bg-blue-50' },
  sorting: { label: 'Đang phân loại', color: 'text-purple-600', bg: 'bg-purple-50' },
  delivering: { label: 'Đang giao hàng', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  delivered: { label: 'Đã giao', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  delivery_fail: { label: 'Giao thất bại', color: 'text-red-600', bg: 'bg-red-50' },
  waiting_to_return: { label: 'Chờ trả hàng', color: 'text-orange-600', bg: 'bg-orange-50' },
  return: { label: 'Đang hoàn', color: 'text-orange-700', bg: 'bg-orange-50' },
  returned: { label: 'Đã hoàn hàng', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const OrderSummary = ({
  cartItems, subtotal, shippingFee, shippingSource = 'static',
  loadingFee = false, leadtime, feeDetails,
  appliedDiscount, discountAmount, finalTotal
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-lg font-semibold text-gray-800">🛒 Tóm tắt đơn hàng</h2>
      </div>
      <div className="p-6">

        {/* Danh sách sản phẩm */}
        <div className="space-y-3 max-h-64 overflow-auto">
          {cartItems?.map(item => (
            <div key={item.productId} className="flex gap-3 py-2 border-b border-gray-100">
              <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">SL: {item.quantity}</p>
                <p className="text-blue-600 font-semibold text-sm mt-0.5">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 pt-4 border-t">

          {/* Tạm tính */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính</span>
            <span className="font-medium text-gray-800">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>



          {/* Phí ship */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Phí vận chuyển</span>
              {shippingSource === 'ghn' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded">
                  GHN
                </span>
              )}
            </div>
            {loadingFee ? (
              <span className="text-gray-400 text-sm animate-pulse flex items-center gap-1">
                <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                Đang tính...
              </span>
            ) : (
              <span className={`font-semibold ${shippingSource === 'ghn' ? 'text-orange-600' : 'text-blue-600'}`}>
                {shippingFee.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          {/* Chi tiết phí GHN */}
          {shippingSource === 'ghn' && feeDetails && (
            <div className="bg-orange-50 rounded-xl px-3 py-2.5 space-y-1 text-xs text-orange-700">
              {feeDetails.mainService > 0 && (
                <div className="flex justify-between">
                  <span>Phí dịch vụ</span>
                  <span>{feeDetails.mainService.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {feeDetails.insurance > 0 && (
                <div className="flex justify-between">
                  <span>Phí bảo hiểm</span>
                  <span>{feeDetails.insurance.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {feeDetails.codFee > 0 && (
                <div className="flex justify-between">
                  <span>Phí COD</span>
                  <span>{feeDetails.codFee.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>
          )}

          {/* Ngày giao dự kiến */}
          {leadtime && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
              <ClockIcon className="w-4 h-4 shrink-0" />
              <span>Dự kiến giao: <strong>{leadtime}</strong></span>
            </div>
          )}

          {/* Giảm giá */}
          {appliedDiscount && appliedDiscount.type !== 'free_shipping' && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá</span>
              <span>- {discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          {/* Tổng cộng */}
          <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
            <span>Tổng cộng</span>
            <span className="text-red-600 text-lg">{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>

          {shippingSource === 'ghn' && (
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-orange-400" />
              Phí ship tính chính xác theo địa chỉ thực tế bởi GHN
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
