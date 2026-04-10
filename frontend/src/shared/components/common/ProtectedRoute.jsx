import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // Đang tải, hiển thị loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  // Chưa đăng nhập -> chuyển về trang chủ
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Yêu cầu admin nhưng user không phải admin -> chuyển về trang chủ
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Cho phép truy cập
  return children;
};

export default ProtectedRoute;
