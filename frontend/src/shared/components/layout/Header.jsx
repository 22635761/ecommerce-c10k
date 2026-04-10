import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DevicePhoneMobileIcon, MagnifyingGlassIcon, 
  ShoppingCartIcon, UserIcon,
  ShieldCheckIcon, UserCircleIcon, HomeIcon,
  ArrowRightOnRectangleIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useCart } from '../../../features/cart/context/CartContext';
import LoginModal from '../../../features/auth/components/LoginModal';
import RegisterModal from '../../../features/auth/components/RegisterModal';
import ProfileModal from '../../../features/auth/components/ProfileModal';
import productClient from '../../../api/product-api';
import MegaMenu from './MegaMenu';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount, refreshCart } = useCart();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = React.useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const fetchSearch = async () => {
      setIsSearching(true);
      try {
        const response = await productClient.get(`/?search=${encodeURIComponent(debouncedSearchTerm)}`);
        setSearchResults(response.data?.data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchSearch();
  }, [debouncedSearchTerm]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global event listener to open login modal from anywhere
  useEffect(() => {
    const handleOpenLoginModal = () => setIsLoginModalOpen(true);
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => window.removeEventListener('openLoginModal', handleOpenLoginModal);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowDropdown(false);
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const CartIcon = () => (
    <div className="relative flex flex-col items-center group cursor-pointer">
      <ShoppingCartIcon className="w-6 h-6 text-white group-hover:text-gray-200 transition" />
      <span className="text-[10px] text-white mt-0.5">Giỏ hàng</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-emerald-600">
          {itemCount}
        </span>
      )}
    </div>
  );

  const searchBarJSX = (
    <div className="flex-1 max-w-xl mx-8 relative" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (searchTerm.trim()) setShowDropdown(true);
          }}
          placeholder="Bạn cần tìm điện thoại gì?" 
          className="w-full pl-10 pr-16 py-2.5 bg-white border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition-all shadow-inner text-sm text-gray-800" 
        />
        <button type="submit" className="absolute left-3 top-2.5 outline-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
        </button>
      </form>

      {/* Live Search Dropdown */}
      {showDropdown && searchTerm.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500 text-sm animate-pulse">
              Đang tìm kiếm...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                Sản phẩm gợi ý
              </div>
              {searchResults.slice(0, 5).map(product => (
                <Link 
                  key={product.id}
                  to={`/product/${product.id}`}
                  onClick={() => {
                    setShowDropdown(false);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {product.price?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </Link>
              ))}
              {searchResults.length > 5 && (
                <div className="px-4 py-3 text-center border-t border-gray-100 bg-gray-50">
                  <Link 
                    to={`/?q=${encodeURIComponent(searchTerm)}`}
                    onClick={() => setShowDropdown(false)}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
                  >
                    Xem tất cả {searchResults.length} kết quả
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm">Không tìm thấy sản phẩm <span className="font-semibold text-gray-800">"{searchTerm}"</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 shadow-lg">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between h-[60px] gap-4">
              {/* Logo Area */}
              <Link to="/" className="flex items-center space-x-1 shrink-0">
                <div className="bg-white text-emerald-600 font-black italic text-xl px-2 py-0.5 rounded shadow-sm border-b-2 border-green-800 tracking-tighter">Z</div>
                <div className="flex flex-col ml-1 leading-none">
                  <span className="text-[14px] font-black text-white tracking-widest uppercase">Zero</span>
                  <span className="text-[12px] font-bold text-white/90 tracking-widest uppercase">Phone</span>
                </div>
              </Link>
              
              {/* Nút Danh Mục — link sang trang chủ */}
              <Link
                to="/"
                className="hidden md:flex flex-col items-center justify-center w-16 h-10 bg-black/10 hover:bg-black/20 rounded-lg text-white transition shrink-0"
              >
                <div className="w-4 h-0.5 bg-white mb-0.5"></div>
                <div className="w-4 h-0.5 bg-white mb-0.5"></div>
                <div className="w-4 h-0.5 bg-white"></div>
                <span className="text-[9px] mt-1 font-semibold uppercase">Danh mục</span>
              </Link>

              {searchBarJSX}
              
              <div className="flex items-center gap-6 shrink-0">
                <button onClick={() => setIsLoginModalOpen(true)} className="flex flex-col items-center group">
                  <UserIcon className="w-6 h-6 text-white group-hover:text-gray-200 transition" />
                  <span className="text-[10px] text-white mt-0.5">Đăng nhập</span>
                </button>

                <Link to="/cart">
                  <CartIcon />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <MegaMenu />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }} />
        <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }} />
      </>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 shadow-lg">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-[60px] gap-4">
            {/* Logo Area */}
            <Link to="/" className="flex items-center space-x-1 shrink-0">
              <div className="bg-white text-emerald-600 font-black italic text-xl px-2 py-0.5 rounded shadow-sm border-b-2 border-green-800 tracking-tighter">Z</div>
              <div className="flex flex-col ml-1 leading-none">
                <span className="text-[14px] font-black text-white tracking-widest uppercase">Zero</span>
                <span className="text-[12px] font-bold text-white/90 tracking-widest uppercase">Phone</span>
              </div>
            </Link>

            {/* Nút Danh Mục — link sang trang chủ */}
            <Link
              to="/"
              className="hidden md:flex flex-col items-center justify-center w-16 h-10 bg-black/10 hover:bg-black/20 rounded-lg text-white transition shrink-0"
            >
              <div className="w-4 h-0.5 bg-white mb-0.5"></div>
              <div className="w-4 h-0.5 bg-white mb-0.5"></div>
              <div className="w-4 h-0.5 bg-white"></div>
              <span className="text-[9px] mt-1 font-semibold uppercase">Danh mục</span>
            </Link>
            
            {searchBarJSX}
            
            <div className="flex items-center gap-6 shrink-0">
              <Link to="/cart">
                <CartIcon />
              </Link>
              
              <div className="relative group">
                <button className="flex flex-col items-center group">
                  <UserIcon className="w-6 h-6 text-white group-hover:text-gray-200 transition" />
                  <span className="text-[10px] text-white mt-0.5 max-w-[60px] truncate">{user.name || user.email?.split('@')[0]}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link to="/profile" className="flex items-center space-x-3 px-4 py-2 hover:bg-emerald-50 transition">
                      <UserCircleIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Tài Khoản của tôi</span>
                    </Link>

                    <Link to="/profile/orders" className="flex items-center space-x-3 px-4 py-2 hover:bg-emerald-50 transition">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Đơn mua</span>
                    </Link>
                    
                    {isAdmin() && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link to="/admin" className="flex items-center space-x-3 px-4 py-2 hover:bg-emerald-50 transition text-emerald-600 font-medium">
                          <ShieldCheckIcon className="w-5 h-5" />
                          <span className="text-sm">Vào Quản trị (Admin)</span>
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 w-full text-left hover:bg-red-50 transition text-red-600 font-medium">
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MegaMenu />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSwitchToRegister={() => {
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(true);
      }} />
      <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} onSwitchToLogin={() => {
        setIsRegisterModalOpen(false);
        setIsLoginModalOpen(true);
      }} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};

export default Header;
