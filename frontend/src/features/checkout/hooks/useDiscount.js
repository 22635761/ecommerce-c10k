import { useState } from 'react';
import { discountAPI } from '../../../services/discountService';

export const useDiscount = (subtotal, cartItems) => {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Vui lòng nhập mã giảm giá');
      return;
    }
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const response = await discountAPI.applyDiscount(discountCode, subtotal, cartItems);
      if (response.data.success && response.data.data.valid) {
        setAppliedDiscount(response.data.data);
        setDiscountError('');
      } else {
        setDiscountError(response.data.data.message || 'Mã giảm giá không hợp lệ');
        setAppliedDiscount(null);
      }
    } catch (err) {
      setDiscountError(err.response?.data?.message || 'Có lỗi xảy ra');
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  let discountAmount = 0;
  let isFreeShipping = false;

  if (appliedDiscount) {
    if (appliedDiscount.type === 'free_shipping') {
      isFreeShipping = true;
    } else {
      discountAmount = appliedDiscount.discountAmount;
    }
  }

  return {
    discountCode,
    setDiscountCode,
    appliedDiscount,
    discountLoading,
    discountError,
    handleApplyDiscount,
    handleRemoveDiscount,
    discountAmount,
    isFreeShipping
  };
};
