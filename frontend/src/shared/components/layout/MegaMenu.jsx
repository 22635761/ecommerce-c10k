import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// ─── Dữ liệu danh mục ──────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'phones',
    label: 'Điện thoại',
    icon: '📱',
    brands: [
      { name: 'iPhone',    query: 'iphone',  color: 'bg-gray-900 text-white',    logo: '🍎' },
      { name: 'Samsung',   query: 'samsung', color: 'bg-blue-600 text-white',    logo: '🌀' },
      { name: 'Xiaomi',    query: 'xiaomi',  color: 'bg-orange-500 text-white',  logo: '🔥' },
      { name: 'Google',    query: 'google',  color: 'bg-green-500 text-white',   logo: '🔍' },
      { name: 'OPPO',      query: 'oppo',    color: 'bg-blue-400 text-white',    logo: '📷' },
      { name: 'Vivo',      query: 'vivo',    color: 'bg-purple-500 text-white',  logo: '⚡' },
    ],
    featured: [
      { label: 'iPhone 15 Series',    path: '/?q=iphone+15',     badge: 'HOT',  badgeColor: 'bg-red-500' },
      { label: 'Samsung Galaxy S24',  path: '/?q=samsung+s24',   badge: 'MỚI',  badgeColor: 'bg-blue-500' },
      { label: 'Xiaomi 14 Ultra',     path: '/?q=xiaomi+14',     badge: '',     badgeColor: '' },
      { label: 'Google Pixel 8 Pro',  path: '/?q=pixel+8',       badge: 'AI',   badgeColor: 'bg-green-500' },
    ]
  },
  {
    id: 'deals',
    label: 'Khuyến mãi',
    icon: '🔥',
    brands: [
      { name: 'Dưới 3 triệu',  query: '',       color: 'bg-emerald-500 text-white',  logo: '💚' },
      { name: '3 - 7 triệu',    query: '',       color: 'bg-blue-500 text-white',     logo: '💙' },
      { name: '7 - 15 triệu',   query: '',       color: 'bg-purple-500 text-white',   logo: '💜' },
      { name: 'Trên 15 triệu',  query: '',       color: 'bg-red-500 text-white',      logo: '❤️' },
    ],
    featured: [
      { label: 'Hàng trả góp 0%',     path: '/',        badge: '0%',   badgeColor: 'bg-orange-500' },
      { label: 'Thu cũ đổi mới',       path: '/',        badge: '',     badgeColor: '' },
      { label: 'Flash Sale hôm nay',   path: '/',        badge: 'HOT',  badgeColor: 'bg-red-500' },
      { label: 'Bán chạy nhất',        path: '/?sortBy=rating',  badge: '⭐', badgeColor: 'bg-yellow-500' },
    ]
  },
];

// Thanh danh mục nhanh (quick nav) dưới header
const QUICK_NAV = [
  { label: 'Tất cả', path: '/',                       icon: '🛒' },
  { label: 'iPhone',  path: '/?category=iphone',       icon: '🍎' },
  { label: 'Samsung', path: '/?category=samsung',      icon: '🌀' },
  { label: 'Xiaomi',  path: '/?category=xiaomi',       icon: '🔥' },
  { label: 'Google',  path: '/?category=google',       icon: '🔍' },
  { label: 'OPPO',    path: '/?category=oppo',         icon: '📷' },
  { label: 'Giá tốt', path: '/?maxPrice=7000000',      icon: '💸' },
  { label: 'Bán chạy',path: '/?sortBy=rating',         icon: '⭐' },
  { label: 'Flash Sale', path: '/#flash-sale',               icon: '⚡' },
];

// ─── Dropdown Panel ──────────────────────────────────────────────────────────
const DropdownPanel = ({ category, onClose }) => (
  <div className="absolute top-full left-0 z-50 w-[640px] bg-white rounded-xl shadow-2xl border border-gray-100 p-5 animate-in fade-in slide-in-from-top-1 duration-150">
    <div className="grid grid-cols-3 gap-4">
      {/* Brand pills */}
      <div className="col-span-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Theo hãng</p>
        <div className="flex flex-wrap gap-2">
          {category.brands.map(b => (
            <Link
              key={b.name}
              to={b.query ? `/?category=${b.query}` : '/'}
              onClick={onClose}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-90 ${b.color}`}
            >
              <span>{b.logo}</span> {b.name}
            </Link>
          ))}
        </div>

        {/* Browse all */}
        <Link
          to="/"
          onClick={onClose}
          className="inline-block mt-3 text-xs text-emerald-600 hover:underline font-semibold"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Featured links */}
      <div className="border-l border-gray-100 pl-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Nổi bật</p>
        <ul className="space-y-2">
          {category.featured.map(f => (
            <li key={f.label}>
              <Link
                to={f.path}
                onClick={onClose}
                className="flex items-center justify-between gap-2 text-sm text-gray-700 hover:text-emerald-600 font-medium transition group"
              >
                <span className="truncate group-hover:underline">{f.label}</span>
                {f.badge && (
                  <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// ─── MegaMenu component (thanh nav thứ 2 ngay dưới header) ─────────────────
const MegaMenu = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const closeTimer = useRef(null);

  const openMenu = (id) => {
    clearTimeout(closeTimer.current);
    setActiveCategory(id);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setActiveCategory(null), 150);
  };

  return (
    <div className="fixed top-[60px] left-0 right-0 z-40 bg-emerald-700 border-t border-emerald-500/40 shadow-md">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-9">

          {/* Dropdown categories */}
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="relative shrink-0"
              onMouseEnter={() => openMenu(cat.id)}
              onMouseLeave={closeMenu}
            >
              <button className={`flex items-center gap-1 px-3 h-9 text-xs font-semibold text-white/90 rounded hover:text-white hover:bg-white/10 transition whitespace-nowrap ${activeCategory === cat.id ? 'bg-white/10 text-white' : ''}`}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${activeCategory === cat.id ? 'rotate-180' : ''}`} />
              </button>

              {activeCategory === cat.id && (
                <DropdownPanel
                  category={cat}
                  onClose={() => setActiveCategory(null)}
                />
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="w-px h-4 bg-white/20 mx-1 shrink-0" />

          {/* Quick nav links */}
          {QUICK_NAV.map(item => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-1 px-3 h-9 text-xs font-semibold text-white/80 rounded hover:text-white hover:bg-white/10 transition whitespace-nowrap shrink-0"
            >
              <span className="text-[13px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
