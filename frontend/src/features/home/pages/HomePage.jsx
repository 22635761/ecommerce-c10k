import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import {
  TruckIcon, ShieldCheckIcon, ArrowPathIcon, PhoneIcon,
  FunnelIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon,
  AdjustmentsHorizontalIcon, FaceFrownIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import productClient from '../../../api/product-api';
import ProductCard from '../components/ProductCard';
import FlashSaleWidget from '../../flashsale/FlashSaleWidget';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// ─── Constants ────────────────────────────────────────────────────────────
const BRANDS = [
  { id: 'all',     label: 'Tất cả',  emoji: '📱' },
  { id: 'iphone',  label: 'iPhone',  emoji: '🍎' },
  { id: 'samsung', label: 'Samsung', emoji: '🌀' },
  { id: 'xiaomi',  label: 'Xiaomi',  emoji: '🔥' },
  { id: 'google',  label: 'Google',  emoji: '🔍' },
  { id: 'oppo',    label: 'OPPO',    emoji: '📷' },
  { id: 'vivo',    label: 'Vivo',    emoji: '⚡' },
];

const PRICE_RANGES = [
  { id: 'all',   label: 'Tất cả giá',   min: null,       max: null },
  { id: 'u3',    label: 'Dưới 3 triệu', min: null,       max: 3_000_000 },
  { id: '3to7',  label: '3 – 7 triệu',  min: 3_000_000,  max: 7_000_000 },
  { id: '7to15', label: '7 – 15 triệu', min: 7_000_000,  max: 15_000_000 },
  { id: 'o15',   label: 'Trên 15 triệu',min: 15_000_000, max: null },
];

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Mới nhất' },
  { id: 'price_asc',  label: 'Giá thấp → cao' },
  { id: 'price_desc', label: 'Giá cao → thấp' },
  { id: 'rating',     label: 'Đánh giá cao' },
];

const banners = [
  { id: 1, title: 'iPhone 15 Pro Max', subtitle: 'Titanium. Mạnh mẽ. Nhẹ. Đột phá.', desc: 'Chip A17 Pro | Camera 48MP | Thiết kế Titanium', gradient: 'from-emerald-600 to-green-800' },
  { id: 2, title: 'Samsung Galaxy S24 Ultra', subtitle: 'Galaxy AI đỉnh cao', desc: 'AI thông minh | Camera 200MP | Bút S-Pen', gradient: 'from-green-700 to-teal-800' },
  { id: 3, title: 'Xiaomi 14 Ultra', subtitle: 'Nhiếp ảnh chuyên nghiệp', desc: 'Leica Camera | Snapdragon 8 Gen 3 | 90W HyperCharge', gradient: 'from-emerald-600 to-green-900' },
];

const features = [
  { icon: TruckIcon,       title: 'Miễn phí vận chuyển', desc: 'Đơn từ 5 triệu',       color: 'blue' },
  { icon: ShieldCheckIcon, title: 'Bảo hành chính hãng', desc: '12 tháng toàn quốc',  color: 'green' },
  { icon: ArrowPathIcon,   title: 'Đổi trả 30 ngày',     desc: 'Miễn phí 100%',        color: 'purple' },
  { icon: PhoneIcon,       title: 'Hỗ trợ 24/7',         desc: '1900 1234',            color: 'orange' },
];

// ─── Skeleton card ──────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-44 bg-gray-100" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-3/5" />
      <div className="h-4 bg-gray-100 rounded w-2/5 mt-3" />
    </div>
  </div>
);

// ─── HomePage ─────────────────────────────────────────────────────────────
const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef(null);

  // Read filters from URL
  const query    = searchParams.get('q') || '';
  const [brand, setBrand]   = useState(searchParams.get('category') || 'all');
  const [price, setPrice]   = useState('all');
  const [sort, setSort]     = useState('newest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [openFilterSection, setOpenFilterSection] = useState({ brand: true, price: true });
  const [showMobileFilter, setShowMobileFilter]   = useState(false);

  const isFiltered = query || brand !== 'all' || price !== 'all' || sort !== 'newest';

  // Scroll parallax for hero (only when no filter active)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale   = useTransform(scrollYProgress, [0, 0.3], [1, 0.96]);

  // Build fetch query
  const fetchQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set('search', query);
    if (brand !== 'all') p.set('category', brand);
    const pr = PRICE_RANGES.find(r => r.id === price);
    if (pr?.min != null) p.set('minPrice', pr.min);
    if (pr?.max != null) p.set('maxPrice', pr.max);
    p.set('sortBy', sort);
    return p.toString();
  }, [query, brand, price, sort]);

  useEffect(() => {
    setLoading(true);
    productClient.get(`/?${fetchQuery}`)
      .then(r => setProducts(r.data?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [fetchQuery]);

  // Sync brand filter from URL when navigating from MegaMenu
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    const q   = searchParams.get('q') || '';
    setBrand(cat);
  }, [searchParams]);

  const activeFilterCount = (brand !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0) + (sort !== 'newest' ? 1 : 0) + (query ? 1 : 0);

  const resetFilters = () => {
    setBrand('all');
    setPrice('all');
    setSort('newest');
    setSearchParams({});
  };

  // ── Sidebar filter panel (shared desktop + mobile) ───────────────────
  const FilterPanel = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <FunnelIcon className="w-4 h-4 text-emerald-600" /> Bộ lọc
        </span>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-600">
            <XMarkIcon className="w-3.5 h-3.5" /> Xoá ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Brand */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => setOpenFilterSection(p => ({ ...p, brand: !p.brand }))}
          className="flex justify-between items-center w-full text-xs font-bold text-gray-600 uppercase tracking-wider mb-3"
        >
          Hãng sản xuất
          {openFilterSection.brand ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
        </button>
        {openFilterSection.brand && (
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map(b => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  brand === b.id
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                }`}
              >
                {b.emoji} {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <button
          onClick={() => setOpenFilterSection(p => ({ ...p, price: !p.price }))}
          className="flex justify-between items-center w-full text-xs font-bold text-gray-600 uppercase tracking-wider mb-3"
        >
          Khoảng giá
          {openFilterSection.price ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
        </button>
        {openFilterSection.price && (
          <div className="space-y-2">
            {PRICE_RANGES.map(r => (
              <label key={r.id} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="price" checked={price === r.id}
                  onChange={() => setPrice(r.id)} className="accent-emerald-600 w-3.5 h-3.5" />
                <span className={`text-sm transition ${price === r.id ? 'text-emerald-700 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">

      {/* ── Hero Banner (ẩn khi đang filter) ── */}
      {!isFiltered && (
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            navigation pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }} effect="fade" loop
            className="h-[480px]"
          >
            {banners.map((b, idx) => (
              <SwiperSlide key={b.id}>
                <div className={`relative h-full bg-gradient-to-r ${b.gradient}`}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative container mx-auto px-4 h-full flex items-center">
                    <motion.div
                      initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }} className="text-white max-w-2xl"
                    >
                      <h2 className="text-5xl font-bold mb-3">{b.title}</h2>
                      <p className="text-xl mb-1">{b.subtitle}</p>
                      <p className="text-base mb-6 text-white/80">{b.desc}</p>
                      <button className="bg-white text-gray-900 px-7 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition">
                        Mua ngay
                      </button>
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      )}

      {/* ── Feature boxes ── */}
      {!isFiltered && (
        <div className="container mx-auto px-4 -mt-10 relative z-10 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg"
              >
                <f.icon className={`w-7 h-7 text-${f.color}-600 mx-auto mb-2`} />
                <h3 className="font-bold text-sm mb-0.5">{f.title}</h3>
                <p className="text-gray-400 text-xs">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Flash Sale ── */}
      {!isFiltered && (
        <div className="container mx-auto px-4 mb-6">
          <FlashSaleWidget />
        </div>
      )}

      {/* ── PRODUCT SECTION (Filter + Grid) ── */}
      <div className="container mx-auto px-4 py-4">

        {/* Search result header */}
        {query && (
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">
              Kết quả tìm kiếm: <span className="text-emerald-600">"{query}"</span>
            </h2>
            <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-red-500 border rounded-full px-2 py-0.5">✕ Xoá</button>
          </div>
        )}

        {/* Sort + filter toggle row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            {!isFiltered && (
              <h2 className="text-xl font-bold text-gray-800">🛒 Tất cả sản phẩm</h2>
            )}
            {!loading && (
              <span className="text-sm text-gray-400">({products.length} sản phẩm)</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile filter */}
            <button
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:border-emerald-400 transition"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              Lọc {activeFilterCount > 0 && <span className="bg-emerald-600 text-white text-[10px] rounded-full px-1.5">{activeFilterCount}</span>}
            </button>

            {/* Sort */}
            {SORT_OPTIONS.map(s => (
              <button
                key={s.id} onClick={() => setSort(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  sort === s.id
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-emerald-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="flex gap-5">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <FaceFrownIcon className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold mb-2">Không tìm thấy sản phẩm</p>
                <p className="text-gray-400 text-sm mb-4">Thử bỏ bộ lọc hoặc thay đổi từ khóa</p>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
          <div className="relative ml-auto w-72 h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-bold text-gray-800">Bộ lọc</span>
              <button onClick={() => setShowMobileFilter(false)}>
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel />
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={resetFilters} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700">Xoá lọc</button>
              <button onClick={() => setShowMobileFilter(false)} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold">
                Xem {products.length} SP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
