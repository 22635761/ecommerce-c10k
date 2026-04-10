import axiosClient from '../shared/api/axios-client';

// Simple functions
export const getProducts = (params = {}) => axiosClient.get('/api/products', { params });
export const getProductById = (id) => axiosClient.get(`/api/products/${id}`);
export const getProductsByCategory = (category) =>
  axiosClient.get(`/api/products/category/${category}`);

export const createProduct = (data) => axiosClient.post('/api/products', data);
export const updateProduct = (id, data) => axiosClient.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => axiosClient.delete(`/api/products/${id}`);

// Compatible API for old code
const productAPI = {
  get: (url = '', config = {}) => {
    console.log('📞 productAPI.get called with:', url, config);
    
    if (!url || url === '/' || url === '/api/products') {
      console.log('  → Getting all products');
      return getProducts(config.params || {});
    }

    if (url.startsWith('/category/')) {
      const category = url.replace('/category/', '');
      console.log(`  → Getting products by category: ${category}`);
      return getProductsByCategory(category);
    }

    if (url.startsWith('/')) {
      const id = url.substring(1);
      console.log(`  → Getting product by id: ${id}`);
      return getProductById(id);
    }

    console.log(`  → Getting product by id: ${url}`);
    return getProductById(url);
  },

  post: (url = '', data) => {
    if (!url || url === '/') {
      return createProduct(data);
    }
    if (url.startsWith('/')) {
      return axiosClient.post(`/api/products${url}`, data);
    }
    return axiosClient.post(`/api/products/${url}`, data);
  },

  put: (url = '', data) => {
    if (!url || url === '/') {
      return axiosClient.put('/api/products', data);
    }
    if (url.startsWith('/')) {
      return axiosClient.put(`/api/products${url}`, data);
    }
    return axiosClient.put(`/api/products/${url}`, data);
  },

  delete: (url = '') => {
    if (!url || url === '/') {
      return axiosClient.delete('/api/products');
    }
    if (url.startsWith('/')) {
      return axiosClient.delete(`/api/products${url}`);
    }
    return axiosClient.delete(`/api/products/${url}`);
  },

  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
};

export default productAPI;
