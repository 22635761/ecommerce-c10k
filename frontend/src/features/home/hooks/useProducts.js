import { useState, useEffect } from 'react';
import productClient from '../../../api/product-api';

const useProducts = (searchQuery = '') => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching products...', searchQuery);
        // Định tuyến API theo query string
        const url = searchQuery ? `/?search=${encodeURIComponent(searchQuery)}` : '/';
        const response = await productClient.get(url);
        console.log('📦 API Response:', response.data);
        
        // Lấy đúng mảng products từ response
        const productsData = response.data?.data || [];
        console.log('✅ Products count:', productsData.length);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error('❌ fetchProducts error:', err);
        setError(err.response?.data?.message || err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  return { products, loading, error };
};

export default useProducts;
