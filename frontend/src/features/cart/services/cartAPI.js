import axiosClient from '../../../shared/api/axios-client';

export const getCart = () => axiosClient.get('/api/cart');

// Hỗ trợ cả 2 kiểu:
// 1) addToCart({ productId, name, price, image, quantity })
// 2) addToCart(productId, name, price, image, quantity)
export const addToCart = (dataOrProductId, name, price, image, quantity = 1) => {
  const data =
    typeof dataOrProductId === 'object'
      ? dataOrProductId
      : {
          productId: dataOrProductId,
          name,
          price,
          image,
          quantity
        };

  return axiosClient.post('/api/cart/add', data);
};

// Hỗ trợ cả 2 kiểu:
// 1) updateCartQuantity({ productId, quantity })
// 2) updateCartQuantity(productId, quantity)
export const updateCartQuantity = (dataOrProductId, quantity) => {
  const data =
    typeof dataOrProductId === 'object'
      ? dataOrProductId
      : {
          productId: dataOrProductId,
          quantity
        };

  return axiosClient.put('/api/cart/update', data);
};

export const removeFromCart = (productId) =>
  axiosClient.delete(`/api/cart/remove/${productId}`);

export const clearCart = () => axiosClient.delete('/api/cart/clear');

// Alias để tương thích code cũ trong CartContext.jsx
export const updateQuantity = updateCartQuantity;

export const cartAPI = {
  getCart,
  addToCart,
  updateCartQuantity,
  updateQuantity,
  removeFromCart,
  clearCart
};

export default cartAPI;
