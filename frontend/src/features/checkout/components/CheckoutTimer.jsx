import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutTimer = ({ durationMinutes = 10, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    // Lấy thời gian bắt đầu từ sessionStorage để chống refresh trang làm reset thời gian
    let startTime = sessionStorage.getItem('checkoutStartTime');
    if (!startTime) {
      startTime = Date.now();
      sessionStorage.setItem('checkoutStartTime', startTime);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - parseInt(startTime, 10)) / 1000);
      const remaining = durationMinutes * 60 - elapsedSeconds;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        sessionStorage.removeItem('checkoutStartTime');
        if (onExpire) onExpire();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, onExpire]);

  // Format hiển thị phút:giây
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  if (timeLeft <= 0) return null;

  const isWarning = timeLeft < 120; // Dưới 2 phút thì hiện cảnh báo đỏ

  return (
    <div className={`flex items-center justify-center p-3 mb-6 rounded-lg font-medium text-sm md:text-base border transition-colors duration-500 shadow-sm ${
        isWarning 
          ? 'bg-red-50 text-red-600 border-red-200' 
          : 'bg-blue-50 text-blue-600 border-blue-200'
      }`}
    >
      <svg className="w-6 h-6 mr-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        Vui lòng hoàn tất thanh toán trong vòng 
        <span className="font-bold text-lg md:text-xl mx-1 font-mono tracking-wider">{minutes}:{seconds}</span> 
        để xác nhận đơn hàng của bạn.
      </span>
    </div>
  );
};

export default CheckoutTimer;
