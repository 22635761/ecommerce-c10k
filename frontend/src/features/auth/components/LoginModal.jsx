import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Modal from '../../../shared/components/common/Modal';
import { authAPI } from '../services/authAPI';

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [step, setStep] = useState(1); // 1: Login, 2: Forgot Req, 3: Forgot Reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [localErr, setLocalErr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { login, loading, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    
    if (result.success && result.user) {
      onClose();
      window.location.reload();
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalErr(''); setLocalMessage(''); setIsProcessing(true);
    try {
      const res = await authAPI.sendForgotPasswordOtp(email);
      if (res.data?.success) {
        setLocalMessage('Đã gửi mã khôi phục về Email của bạn!');
        setStep(3);
      }
    } catch (err) {
      setLocalErr(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalErr(''); setLocalMessage(''); setIsProcessing(true);
    try {
      const res = await authAPI.resetPassword(email, otp, newPassword);
      if (res.data?.success) {
        setLocalMessage('Đổi mật khẩu thành công! Quay lại đăng nhập...');
        setTimeout(() => {
          setStep(1);
          setPassword('');
          setLocalMessage('');
        }, 2000);
      }
    } catch (err) {
      setLocalErr(err.response?.data?.message || 'Nhập sai mã OTP hoặc lỗi mạng');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          {step === 1 ? 'Đăng nhập' : step === 2 ? 'Tìm lại Mật Khẩu' : 'Đặt lại Mật khẩu'}
        </h2>
        
        {error && step === 1 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}
        {localErr && step !== 1 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{localErr}</div>
        )}
        {localMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">{localMessage}</div>
        )}
        
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="you@example.com" required />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" required />
            </div>
            <div className="flex justify-end mb-6">
              <button type="button" onClick={() => { setStep(2); clearError(); setLocalErr(''); setLocalMessage(''); }} className="text-xs text-emerald-600 hover:underline">Quên mật khẩu?</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Chưa có tài khoản? <button type="button" className="text-emerald-600 font-medium hover:underline" onClick={onSwitchToRegister}>Đăng ký ngay</button>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleForgotPassword}>
            <p className="text-sm text-gray-600 mb-4 text-center">Vui lòng nhập Email đã dùng để đăng ký tài khoản. Chúng tôi sẽ gửi 1 mã OTP 6 số đến hòm thư của bạn.</p>
            <div className="mb-6">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full bg-slate-800 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-50">
              {isProcessing ? 'Đang gửi mã...' : 'Nhận mã Khôi phục'}
            </button>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">Quay lại Đăng nhập</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã Khôi phục (OTP)</label>
              <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-teal-500" placeholder="000000" required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nhập ít nhất 6 ký tự" required />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50">
              {isProcessing ? 'Đang đặt lại...' : 'Chốt Mật khẩu mới'}
            </button>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">Hủy và quay lại</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default LoginModal;
