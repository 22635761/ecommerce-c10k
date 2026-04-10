import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './shared/components/layout/Layout';
import ProtectedRoute from './shared/components/common/ProtectedRoute';
import HomePage from './features/home/pages/HomePage';
import ProductDetailPage from './features/product/pages/ProductDetailPage';
import ProfilePage from './features/auth/pages/ProfilePage';
import MyOrdersPage from './features/auth/pages/MyOrdersPage';
import CartPage from './features/cart/pages/CartPage';
import CheckoutPage from './features/checkout/pages/CheckoutPage';
import SuccessPage from './features/checkout/pages/SuccessPage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import AdminUsers from './features/admin/pages/AdminUsers';
import AdminProducts from './features/admin/pages/AdminProducts';
import AdminOrders from './features/admin/pages/AdminOrders';
import AdminDiscounts from './features/admin/pages/AdminDiscounts';
import AdminChat from './features/admin/pages/AdminChat';
import ContactWidget from './shared/components/common/ContactWidget';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout/success" element={<SuccessPage />} />
          
          <Route path="/cart" element={<CartPage />} />
          
          {/* Protected routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/orders" element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<AdminUsers />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="stats" element={<div className="text-center py-8">Thống kê (Đang phát triển)</div>} />
            <Route path="settings" element={<div className="text-center py-8">Cài đặt (Đang phát triển)</div>} />
          </Route>
        </Routes>
        <ContactWidget />
      </Layout>
    </BrowserRouter>
  );
}

export default App;
