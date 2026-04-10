import axiosClient from '../shared/api/axios-client';

export const applyDiscount = (data) => axiosClient.post('/api/discounts/apply', data);
export const getAllDiscounts = () => axiosClient.get('/api/discounts/admin/all');
export const getDiscountById = (id) => axiosClient.get(`/api/discounts/admin/${id}`);
export const createDiscount = (data) => axiosClient.post('/api/discounts/admin/create', data);
export const updateDiscount = (id, data) => axiosClient.put(`/api/discounts/admin/${id}`, data);
export const deleteDiscount = (id) => axiosClient.delete(`/api/discounts/admin/${id}`);
