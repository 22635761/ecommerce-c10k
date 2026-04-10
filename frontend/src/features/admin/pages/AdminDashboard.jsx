import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  TicketIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', name: 'Tổng quan', icon: HomeIcon },
    { path: '/admin/users', name: 'Quản lý người dùng', icon: UsersIcon },
    { path: '/admin/orders', name: 'Quản lý đơn hàng', icon: ClipboardDocumentListIcon },
    { path: '/admin/products', name: 'Quản lý sản phẩm', icon: ShoppingBagIcon },
    { path: '/admin/discounts', name: 'Mã giảm giá', icon: TicketIcon },
    { path: '/admin/chat', name: 'Hỗ trợ Chat', icon: ChatBubbleLeftRightIcon },
    { path: '/admin/stats', name: 'Thống kê', icon: ChartBarIcon },
    { path: '/admin/settings', name: 'Cài đặt', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-600">Admin Panel</h2>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
