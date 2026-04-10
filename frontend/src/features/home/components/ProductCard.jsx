import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon, StarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useCart } from '../../cart/context/CartContext';
import { useAuth } from '../../auth/hooks/useAuth';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const formatPrice = (price) => price?.toLocaleString('vi-VN') + 'đ';
  
  const renderStars = (rating) => {
    if (!rating || rating === 0) return <span className="text-xs text-gray-400 italic">Chưa có đánh giá</span>;
    return [...Array(5)].map((_, i) => (
      i < Math.floor(rating) ? 
        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" /> :
        <StarIcon key={i} className="w-4 h-4 text-gray-300" />
    ));
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }
    
    const result = await addToCart(product.id, product.name, product.price, product.image, 1);
    if (result.success) {
      alert('Đã thêm vào giỏ hàng!');
    } else {
      alert(result.error || 'Có lỗi xảy ra');
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }
    
    if (!isAuthenticated) {
      window.dispatchEvent(new Event('openLoginModal'));
      return;
    }
    
    // Thêm vào giỏ hàng trước, rồi chuyển sang trang Giỏ hàng (chuẩn Shopee)
    const result = await addToCart(product.id, product.name, product.price, product.image, 1);
    if (result.success || result.data) {
      navigate('/cart', { state: { selectedProductId: product.id } });
    } else {
      alert(result.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const getImageUrl = (url) => {
    if (!url || url === '') {
      return 'https://via.placeholder.com/300x300?text=No+Image';
    }
    return url;
  };

  return (
    <Link to={`/product/${product.id}`} className="block h-full">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
      >
        <div className="relative overflow-hidden h-48 sm:h-56 bg-white flex-shrink-0 p-4">
          <img 
            src={getImageUrl(isHovered && product.hoverImage ? product.hoverImage : product.image)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          {product.badge && product.stock > 0 && (
            <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full shadow-lg bg-${product.badgeColor}-500 z-10`}>
              {product.badge}
            </span>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-red-600 text-white px-4 py-2 font-bold rounded-lg shadow-xl text-sm border-2 border-white/20 transform -rotate-12">
                HẾT HÀNG
              </span>
            </div>
          )}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alert('Chức năng yêu thích đang phát triển');
            }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-red-500 hover:text-white transition"
          >
            <HeartIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-1 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors" title={product.name}>{product.name}</h3>
            
            <div className="flex flex-wrap items-baseline gap-2 mt-3 mb-2">
              <span className="text-base sm:text-lg font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(product.oldPrice)}</span>
              )}
            </div>

            <div className="flex items-center mt-1">
              <div className="flex items-center">{renderStars(product.rating)}</div>
              {product.reviews > 0 && <span className="text-[10px] text-gray-500 ml-1">({product.reviews})</span>}
            </div>
          </div>
          <div className="flex gap-2 mt-4 relative z-20 transition-all duration-300">
            <button 
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className={`flex-1 text-white py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 font-bold text-xs uppercase tracking-wide ${
                product.stock <= 0 
                  ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/50 hover:-translate-y-0.5'
              }`}
              title={product.stock <= 0 ? "Hết hàng" : "Mua ngay"}
            >
              {product.stock <= 0 ? 'Hết hàng' : 'Mua ngay'}
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-9 h-auto rounded-lg transition-all flex items-center justify-center flex-shrink-0 ${
                product.stock <= 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5'
              }`}
              title={product.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
            >
              <ShoppingCartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
