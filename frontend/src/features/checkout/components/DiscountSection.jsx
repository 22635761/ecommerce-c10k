import React, { useState, useEffect } from 'react';
import { TicketIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { discountAPI } from '../../../services/discountService';

const DiscountSection = ({ 
  discountCode, 
  setDiscountCode, 
  appliedDiscount, 
  discountLoading, 
  discountError, 
  handleApplyDiscount, 
  handleRemoveDiscount 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCode, setTempCode] = useState(discountCode || '');
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  useEffect(() => {
    if (isModalOpen && vouchers.length === 0) {
      fetchVouchers();
    }
  }, [isModalOpen]);

  const fetchVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const res = await discountAPI.getActiveDiscounts();
      if (res.data?.success) {
        setVouchers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch vouchers", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Wrap the apply logic to close modal
  const handleApply = (codeToApply) => {
    setDiscountCode(codeToApply);
    // Since handleApplyDiscount depends on the latest discountCode state,
    // and setState is async, ideally handleApplyDiscount should take an argument.
    // However, to keep it compatible with the existing hook, we trigger it and wait.
    setTimeout(() => {
      handleApplyDiscount();
    }, 50);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Box Header - Shopee Style */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <TicketIcon className="w-6 h-6 text-[#ee4d2d]" />
          <span className="font-medium text-gray-800">PhoneStore Voucher</span>
        </div>
        
        <div className="flex items-center gap-2">
          {appliedDiscount ? (
             <span className="text-sm px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-sm">
                - {appliedDiscount.type === 'free_shipping' ? 'Freeship' : appliedDiscount.discount.code}
             </span>
          ) : (
             <span className="text-sm text-gray-400">Chọn hoặc nhập mã</span>
          )}
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {discountError && !isModalOpen && (
        <div className="px-4 pb-3">
          <p className="text-red-500 text-sm">{discountError}</p>
        </div>
      )}

      {/* Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col h-[70vh] md:h-auto md:max-h-[85vh] animate-slide-up">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-800">Chọn Shop Voucher</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2">
              <input 
                type="text" 
                value={tempCode} 
                onChange={(e) => setTempCode(e.target.value.toUpperCase())} 
                placeholder="Mã Voucher" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:border-gray-500 outline-none uppercase" 
              />
              <button 
                onClick={() => handleApply(tempCode)} 
                disabled={discountLoading || !tempCode.trim()} 
                className={`px-6 py-2 rounded-sm font-medium ${tempCode.trim() ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-400'}`}
              >
                Áp dụng
              </button>
            </div>

            {discountError && isModalOpen && (
              <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
                {discountError}
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 bg-gray-100 space-y-3">
              {/* If a discount is applied, show it at the top as selected */}
              {appliedDiscount && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Đang chọn</span>
                    <button onClick={() => { handleRemoveDiscount(); closeModal(); }} className="text-blue-600 text-sm">Bỏ chọn</button>
                  </div>
                  <div className="bg-white border-l-4 border-green-500 rounded-sm shadow-sm flex overflow-hidden p-3 relative">
                    <div className="flex-1">
                      <p className="font-bold text-green-600 mb-1">{appliedDiscount.discount.code}</p>
                      <p className="text-xs text-gray-600">{appliedDiscount.message}</p>
                    </div>
                    <div className="flex items-center justify-center pl-3 border-l border-dashed">
                      <div className="w-5 h-5 rounded-full bg-[#ee4d2d] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h4 className="text-sm font-semibold text-gray-700 mb-2">Mã Khuyến Mãi</h4>
              {loadingVouchers ? (
                 <div className="text-center text-sm text-gray-500 py-4">Đang tải mã giảm giá...</div>
              ) : vouchers.length === 0 ? (
                 <div className="text-center text-sm text-gray-500 py-4">Không có mã giảm giá nào</div>
              ) : vouchers.map(v => (
                 <div key={v.code} className="bg-white border hover:border-[#ee4d2d] rounded-sm shadow-sm flex overflow-hidden transition cursor-pointer" onClick={() => handleApply(v.code)}>
                    <div className={`w-24 ${v.type === 'free_shipping' ? 'bg-teal-500' : 'bg-[#ee4d2d]'} flex flex-col items-center justify-center p-2 text-white border-r border-dashed relative`}>
                      <div className="text-xs text-center font-bold">{v.type === 'free_shipping' ? 'Freeship' : 'Voucher'}</div>
                      <div className="absolute -left-1.5 top-1/2 -mt-1.5 w-3 h-3 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="flex-1 p-3">
                      <p className="font-bold text-gray-800 text-sm mb-1">{v.name || v.code}</p>
                      <p className="text-xs text-gray-500 mb-2">{v.description || (v.type === 'fixed' ? `Giảm ${v.value}đ` : `Giảm ${v.value}%`)}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded-sm">
                          {v.usageLimit ? `Còn ${v.usageLimit - (v.usedCount || 0)} lượt` : 'Số lượng có hạn'}
                        </span>
                        <button className="text-sm font-semibold text-white bg-[#ee4d2d] px-3 py-1 rounded-sm hover:bg-[#d74325]">Dùng ngay</button>
                      </div>
                    </div>
                 </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-white border-t flex justify-end">
              <button onClick={closeModal} className="w-full md:w-auto px-8 py-2.5 rounded-sm bg-[#ee4d2d] text-white hover:bg-[#d74325] font-medium uppercase">
                Trở lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
