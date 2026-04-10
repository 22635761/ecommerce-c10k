import axios from 'axios';

const discountClient = axios.create({
  baseURL: 'http://localhost:3006/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

discountClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const discountAPI = {
  // User
  applyDiscount: (code, subtotal, items) => 
    discountClient.post('/discounts/apply', { code, subtotal, items }),
  getActiveDiscounts: () => discountClient.get('/discounts/active'),
  
  // Admin
  getAllDiscounts: () => discountClient.get('/discounts/admin/all'),
  getDiscountById: (id) => discountClient.get(`/discounts/admin/${id}`),
  createDiscount: (data) => discountClient.post('/discounts/admin/create', data),
  updateDiscount: (id, data) => discountClient.put(`/discounts/admin/${id}`, data),
  deleteDiscount: (id) => discountClient.delete(`/discounts/admin/${id}`),
};
