import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/common/Modal';
import { discountAPI } from '../../../services/discountService';
import { TicketIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

const DiscountsModal = ({ isOpen, onClose }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchDiscounts = async () => {
        setLoading(true);
        try {
          const response = await discountAPI.getActiveDiscounts();
          if (response.data && response.data.success) {
            setDiscounts(response.data.data || []);
          }
        } catch (err) {
          console.error('Error fetching discounts:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDiscounts();
    }
  }, [isOpen]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TicketIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kho Voucher Ưu Đãi</h2>
            <p className="text-xs text-gray-500">Mã giảm giá đang hoạt động dành riêng cho bạn</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">Đang tải mã giảm giá...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <TicketIcon className="w-8 h-8" />
            </div>
            <p className="text-gray-800 font-semibold mb-1">Hết mã giảm giá khả dụng</p>
            <p className="text-sm text-gray-400">Hiện tại cửa hàng không có mã giảm giá nào đang hoạt động. Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
            {discounts.map((discount) => (
              <div 
                key={discount.id}
                className="relative bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between shadow-sm overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all duration-200"
              >
                {/* Decorative Side Ticket Cutouts */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 border-r border-gray-150 rounded-r-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 border-l border-gray-150 rounded-l-full"></div>

                <div className="pl-3 pr-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {discount.code}
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-100">
                      {discount.type === 'percentage' ? `Giảm ${discount.value}%` : `Giảm ${Number(discount.value).toLocaleString()}đ`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 leading-tight mb-1 truncate">
                    {discount.name || `Ưu đãi Zero Phone`}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">
                    {discount.description || `Áp dụng giảm trực tiếp cho hóa đơn`}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Đơn tối thiểu: {Number(discount.minOrderValue || discount.minOrderAmount || 0).toLocaleString()}đ
                  </p>
                </div>

                <div className="flex-shrink-0 ml-4 pl-3 border-l border-dashed border-gray-200">
                  <button
                    onClick={() => handleCopy(discount.code)}
                    className={`h-11 w-11 rounded-full flex flex-col items-center justify-center transition-all ${
                      copiedCode === discount.code
                        ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300'
                    } cursor-pointer`}
                    title="Sao chép mã"
                  >
                    {copiedCode === discount.code ? (
                      <ClipboardDocumentCheckIcon className="w-5 h-5 animate-pulse" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    )}
                    <span className="text-[8px] mt-0.5 font-bold uppercase">
                      {copiedCode === discount.code ? 'Đã copy' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountsModal;
