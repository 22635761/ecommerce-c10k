import { useState, useCallback } from 'react';

const API = 'http://localhost:3004/api/orders';
const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Dịch vụ cố định: Hàng nhẹ (điện thoại, phụ kiện)
const DEFAULT_SERVICE_ID = 53320;

export const useShipping = (cartItems) => {
  const [shippingFee, setShippingFee] = useState(30000);
  const [shippingSource, setShippingSource] = useState('static');
  const [loadingFee, setLoadingFee] = useState(false);
  const [leadtime, setLeadtime] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);

  const calculateShipping = useCallback(async ({ provinceName, districtId, wardCode } = {}) => {
    setLoadingFee(true);
    try {
      // 1. Tính phí ship thật (GHN hoặc fallback tĩnh)
      const feeRes = await fetch(`${API}/calculate-shipping`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          province: provinceName,
          districtId: districtId || null,
          wardCode: wardCode || null,
          items: cartItems
        })
      });
      const feeData = await feeRes.json();
      if (feeData.success) {
        setShippingFee(feeData.fee);
        setShippingSource(feeData.source || 'static');
        setFeeDetails(feeData.feeDetails || null);
      } else {
        setShippingFee(50000);
        setShippingSource('static');
      }

      // 2. Lấy ngày giao dự kiến (chỉ khi có đủ districtId + wardCode)
      if (districtId && wardCode) {
        const ltRes = await fetch(`${API}/ghn/leadtime`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            toDistrictId: districtId,
            toWardCode: wardCode,
            serviceId: DEFAULT_SERVICE_ID
          })
        });
        const ltData = await ltRes.json();
        if (ltData.success) setLeadtime(ltData.leadtimeDisplay);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      setShippingFee(50000);
      setShippingSource('static');
    } finally {
      setLoadingFee(false);
    }
  }, [cartItems]);

  return {
    shippingFee, setShippingFee,
    shippingSource, loadingFee,
    leadtime, feeDetails,
    calculateShipping
  };
};
