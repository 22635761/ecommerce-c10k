const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002/api/products';

const productAPI = {
  deductStock: async (items) => {
    try {
      const response = await axios.post(`${PRODUCT_SERVICE_URL}/inventory/deduct`, { items });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  restoreStock: async (items) => {
    try {
      const response = await axios.post(`${PRODUCT_SERVICE_URL}/inventory/restore`, { items });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gọi API restoreStock:', error.message);
      // We don't throw here usually to prevent blocking worker
      return null;
    }
  }
};

module.exports = productAPI;
