import { useState, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserFromStorage = () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return parsedUser;
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    return null;
  };

  useEffect(() => {
    loadUserFromStorage();
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data && response.data.success === true && response.data.data) {
        const { user, token } = response.data.data;
        
        if (user && token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          setLoading(false);
          return { success: true, user };
        }
      }
      
      setLoading(false);
      return { success: false, error: 'Dữ liệu trả về không hợp lệ' };
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  // Register bước 1: Yêu cầu OTP
  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.sendRegisterOtp(email, password, name);
      if (response.data && response.data.success === true) {
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'Đăng ký thất bại' };
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng ký thất bại';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  // Register bước 2: Xác nhận OTP
  const verifyRegisterOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyRegisterOtp(email, otp);
      if (response.data && response.data.success === true && response.data.data) {
        // Đăng nhập tự động sau khi verify OTP thành công
        const { user, token } = response.data.data;
        if (user && token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          setLoading(false);
          return { success: true, user };
        }
      }
      setLoading(false);
      return { success: false, error: 'Xác thực thất bại' };
    } catch (err) {
      const message = err.response?.data?.message || 'Mã OTP không đúng';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  };

  const clearError = () => setError(null);

  const isAdmin = () => user?.role === 'admin';
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    login,
    register,
    verifyRegisterOtp,
    logout,
    updateProfile,
    clearError,
    isAdmin,
    isAuthenticated
  };
};
