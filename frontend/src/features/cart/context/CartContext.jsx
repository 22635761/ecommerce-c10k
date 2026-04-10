import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/cartAPI';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  const [total, setTotal] = useState(0);

  const applyCartState = (cartData) => {
    const safeCart = cartData || { items: [], total: 0 };
    const items = safeCart.items || [];
    setCart(safeCart);
    setItemCount(items.reduce((sum, item) => sum + item.quantity, 0));
    setTotal(safeCart.total || 0);
  };

  const getGuestCart = () => {
    try {
      const c = localStorage.getItem('guest_cart');
      return c ? JSON.parse(c) : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  };

  const saveGuestCart = (cartData) => {
    localStorage.setItem('guest_cart', JSON.stringify(cartData));
    applyCartState(cartData);
  };

  const loadCart = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      applyCartState(getGuestCart());
      setLoading(false);
      return;
    }

    try {
      // If user is logged in, attempt to merge guest cart first
      const gc = getGuestCart();
      if (gc.items && gc.items.length > 0) {
        for (const item of gc.items) {
          await cartAPI.addToCart(item.productId, item.name, item.price, item.image, item.quantity);
        }
        // Clear guest cart after merging
        localStorage.removeItem('guest_cart');
      }

      const response = await cartAPI.getCart();
      applyCartState(response.data.data);
    } catch (error) {
      console.error('Error loading cart:', error.response?.data || error.message);
      applyCartState({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (productId, name, price, image, quantity = 1) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Guest logic
      const gc = getGuestCart();
      const existingItem = gc.items.find(i => i.productId === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        gc.items.push({ productId, name, price, image, quantity });
      }
      gc.total = gc.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      saveGuestCart(gc);
      return { success: true, data: gc };
    }

    // Authenticated logic
    try {
      const response = await cartAPI.addToCart(productId, name, price, image, quantity);
      applyCartState(response.data.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding to cart:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Thêm vào giỏ thất bại' };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const gc = getGuestCart();
      const item = gc.items.find(i => i.productId === productId);
      if (item) {
        item.quantity = quantity;
        gc.total = gc.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        saveGuestCart(gc);
      }
      return { success: true, data: gc };
    }

    try {
      const response = await cartAPI.updateQuantity(productId, quantity);
      applyCartState(response.data.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating quantity:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Cập nhật số lượng thất bại' };
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      const gc = getGuestCart();
      gc.items = gc.items.filter(i => i.productId !== productId);
      gc.total = gc.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      saveGuestCart(gc);
      return { success: true, data: gc };
    }

    try {
      const response = await cartAPI.removeFromCart(productId);
      applyCartState(response.data.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error removing from cart:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Xóa sản phẩm thất bại' };
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      saveGuestCart({ items: [], total: 0 });
      return { success: true, data: { items: [], total: 0 } };
    }

    try {
      const response = await cartAPI.clearCart();
      applyCartState(response.data.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error clearing cart:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Xóa giỏ hàng thất bại' };
    }
  };

  const value = {
    cart,
    loading,
    itemCount,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: loadCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
