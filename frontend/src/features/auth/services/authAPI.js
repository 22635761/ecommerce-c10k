import axiosClient from '../../../shared/api/axios-client';

// Hỗ trợ cả kiểu cũ: login(email, password)
// và kiểu mới: login({ email, password })
export const login = (emailOrData, password) => {
  const data =
    typeof emailOrData === 'object'
      ? emailOrData
      : { email: emailOrData, password };

  return axiosClient.post('/api/auth/login', data);
};

export const sendRegisterOtp = (email, password, name) => {
  return axiosClient.post('/api/auth/register-otp', { email, password, name });
};

export const verifyRegisterOtp = (email, otp) => {
  return axiosClient.post('/api/auth/register-verify', { email, otp });
};

export const sendForgotPasswordOtp = (email) => {
  return axiosClient.post('/api/auth/forgot-password', { email });
};

export const resetPassword = (email, otp, newPassword) => {
  return axiosClient.post('/api/auth/reset-password', { email, otp, newPassword });
};

export const getProfile = () => axiosClient.get('/api/auth/profile');

export const getUsers = () => axiosClient.get('/api/auth/users');

export const updateUserRole = (id, data) =>
  axiosClient.put(`/api/auth/users/${id}/role`, data);

// Tạm giữ để không vỡ code cũ.
// Hiện backend của bạn chưa có route update profile.
export const updateProfile = async () => {
  throw new Error('API cập nhật hồ sơ chưa được triển khai ở backend');
};

export const authAPI = {
  sendRegisterOtp,
  verifyRegisterOtp,
  sendForgotPasswordOtp,
  resetPassword,
  login,
  getProfile,
  getUsers,
  updateUserRole,
  updateProfile
};

export default authAPI;
