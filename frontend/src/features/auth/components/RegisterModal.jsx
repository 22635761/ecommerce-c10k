import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Modal from '../../../shared/components/common/Modal';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const { register, verifyRegisterOtp, loading, error, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    clearError();
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    const result = await register(email, password, name);
    if (result.success) {
      setSuccessMessage(`Đã gửi mã OTP 6 số đến ${email}. Vui lòng kiểm tra hộp thư!`);
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearError();
    const result = await verifyRegisterOtp(email, otp);
    
    if (result.success) {
      setSuccessMessage('Kích hoạt tài khoản thành công! Tự động đăng nhập...');
      setTimeout(() => {
        setSuccessMessage('');
        setStep(1);
        onClose();
        window.location.reload(); // Hoặc cập nhật state global
      }, 1500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Đăng ký tài khoản
        </h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A" required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com" required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
              <input
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Đang gửi mã...' : 'Nhận mã OTP qua Email'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Đã có tài khoản? <button type="button" className="text-blue-600 hover:underline" onClick={onSwitchToLogin}>Đăng nhập</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã xác thực OTP (6 chữ số)</label>
              <input
                type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500"
                placeholder="000000" required
              />
              <p className="text-xs text-gray-400 mt-2 text-center">Vui lòng kiểm tra Hộp thư đến hoặc thư rác.</p>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
            </button>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">Quay lại sửa thông tin</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default RegisterModal;
