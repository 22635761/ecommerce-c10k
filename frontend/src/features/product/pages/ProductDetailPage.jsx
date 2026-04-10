import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import productClient from '../../../shared/api/product-api';
import { useCart } from '../../cart/context/CartContext';
import { useAuth } from '../../auth/hooks/useAuth';
import ReviewSection from '../components/ReviewSection';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productClient.get(`/${id}`);
      const productData = response.data.data;
      setProduct(productData);
      setSelectedImage(productData.image);

      if (productData.colors?.length) {
        setSelectedColor(productData.colors[0]);
      }

      if (productData.category) {
        const relatedResponse = await productClient.get(`/category/${productData.category}`);
        const filtered = (relatedResponse.data.data || [])
          .filter((p) => p.id !== id)
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching product:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }

    const result = await addToCart(product.id, product.name, product.price, product.image, quantity);
    if (result.success) {
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    } else {
      alert(result.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = async () => {
    if (product.stock <= 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }

    if (!isAuthenticated) {
      window.dispatchEvent(new Event('openLoginModal'));
      return;
    }

    if (!product) return;

    // Thêm vào giỏ hàng trước, rồi chuyển sang trang Giỏ hàng (chuẩn Shopee)
    const result = await addToCart(product.id, product.name, product.price, product.image, quantity);
    if (result.success || result.data) {
      navigate('/cart', { state: { selectedProductId: product.id } });
    } else {
      alert(result.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return <span className="text-sm text-gray-400 italic">Chưa có đánh giá</span>;
    return [...Array(5)].map((_, i) =>
      i < Math.floor(rating) ? (
        <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="w-5 h-5 text-gray-300" />
      )
    );
  };

  const benefits = [
    { icon: ShieldCheckIcon, title: 'Sản phẩm Chính hãng', desc: 'Xuất VAT đầy đủ' },
    { icon: TruckIcon, title: 'Giao nhanh', desc: 'Miễn phí cho đơn 300k' },
    { icon: ArrowPathIcon, title: 'Thu cũ giá ngon', desc: 'Lên đời tiết kiệm' },
    { icon: PhoneIcon, title: 'Hỗ trợ 24/7', desc: '1900 1234' }
  ];

  const getSpecs = () => {
    const specs = [];
    if (product?.screenSize) specs.push({ label: 'Kích thước màn hình', value: product.screenSize });
    if (product?.screenTechnology) specs.push({ label: 'Công nghệ màn hình', value: product.screenTechnology });
    if (product?.rearCamera) specs.push({ label: 'Camera sau', value: product.rearCamera });
    if (product?.frontCamera) specs.push({ label: 'Camera trước', value: product.frontCamera });
    if (product?.chipset) specs.push({ label: 'Chipset', value: product.chipset });
    if (product?.ram) specs.push({ label: 'RAM', value: product.ram });
    if (product?.storage) specs.push({ label: 'Bộ nhớ trong', value: product.storage });
    if (product?.battery) specs.push({ label: 'Pin', value: product.battery });
    if (product?.charging) specs.push({ label: 'Sạc nhanh', value: product.charging });
    if (product?.waterResistance) specs.push({ label: 'Chống nước', value: product.waterResistance });
    return specs;
  };

  const specs = getSpecs();
  const hasSpecs = specs.length > 0;

  const formatPrice = (price) => price?.toLocaleString('vi-VN') + 'đ';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-pulse">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="text-sm text-gray-500 mb-6 font-medium">
          <Link to="/" className="hover:text-emerald-600 transition">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link to="/" className="hover:text-emerald-600 transition">Điện thoại</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-auto object-cover"
              />
            </div>

            {product.hoverImage && (
              <div className="grid grid-cols-6 gap-2 mt-2">
                <div
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition ${selectedImage === product.image ? 'border-emerald-600 shadow-sm' : 'border-gray-200'}`}
                  onClick={() => setSelectedImage(product.image)}
                >
                  <img src={product.image} alt="Thumb 1" className="w-full h-20 object-cover" />
                </div>
                <div
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer ${selectedImage === product.hoverImage ? 'border-blue-500' : 'border-transparent'}`}
                  onClick={() => setSelectedImage(product.hoverImage)}
                >
                  <img src={product.hoverImage} alt="Thumb 2" className="w-full h-20 object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                  {product.reviews > 0 && <span className="ml-2 text-sm text-gray-500">({product.reviews} đánh giá)</span>}
                </div>
                <button className="text-gray-400 hover:text-red-500 transition">
                  <HeartIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{benefit.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-red-600 tracking-tight">{formatPrice(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-base text-gray-400 line-through font-medium mb-1.5">{formatPrice(product.oldPrice)}</span>
                )}
              </div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-3 text-gray-800">Chọn biến thể:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        selectedColor === color
                          ? 'border-emerald-600 bg-green-50 text-emerald-600 font-semibold'
                          : 'border-gray-200 hover:border-emerald-600/40 text-gray-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-semibold">Số lượng:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={product.stock <= 0}
                    className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                  >-</button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={product.stock <= 0 || quantity >= product.stock}
                    className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                  >+</button>
                </div>
                {product.stock > 0 ? (
                  <span className="text-sm text-gray-500">Còn {product.stock} sản phẩm</span>
                ) : (
                  <span className="text-sm font-bold text-red-500 bg-red-100 px-2 py-1 rounded">Vừa hết hàng</span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className={`flex-1 text-white py-3.5 rounded-xl font-bold transition-all duration-300 flex flex-col items-center justify-center border-none ${
                      product.stock <= 0 
                        ? 'bg-gray-400 cursor-not-allowed opacity-80' 
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:from-emerald-500 hover:to-emerald-600 hover:-translate-y-0.5 active:scale-[0.98]'
                    }`}
                  >
                    <span className="text-xl uppercase tracking-wider">{product.stock <= 0 ? 'HẾT HÀNG' : 'MUA NGAY'}</span>
                    {!product.stock <= 0 && <span className="text-[11px] font-medium opacity-90 tracking-wide mt-0.5">(Giao tận nơi hoặc nhận tại cơ sở)</span>}
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`w-16 flex flex-col items-center justify-center rounded-xl font-semibold transition-all duration-300 border-none ${
                      product.stock <= 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95'
                    }`}
                    title="Thêm giỏ hàng"
                  >
                    <ShoppingCartIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Trả góp */}
                {product.stock > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-gradient-to-b from-[#2d3748] to-[#1a202c] hover:from-[#4a5568] hover:to-[#2d3748] text-white rounded-xl py-2 flex flex-col items-center shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                      <span className="font-bold text-sm tracking-wide">TRẢ GÓP 0%</span>
                      <span className="text-[10px] text-gray-300 mt-0.5">Duyệt siêu tốc trong 5p</span>
                    </button>
                    <button className="bg-gradient-to-b from-[#2d3748] to-[#1a202c] hover:from-[#4a5568] hover:to-[#2d3748] text-white rounded-xl py-2 flex flex-col items-center shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                      <span className="font-bold text-sm tracking-wide">TRẢ GÓP QUA THẺ</span>
                      <span className="text-[10px] text-gray-300 mt-0.5">Visa, Mastercard, JCB</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">
                Giao nhanh từ 2 giờ hoặc nhận tại cửa hàng
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="border-b flex gap-8">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 font-semibold transition ${
                activeTab === 'specs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`pb-3 font-semibold transition ${
                activeTab === 'policy'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Chính sách bảo hành
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 font-semibold transition ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đánh giá & Nhận xét
            </button>
          </div>

          <div className="py-8">
            {activeTab === 'specs' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {hasSpecs ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <tbody>
                          {(showAllSpecs ? specs : specs.slice(0, 6)).map((spec, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-6 py-3 font-medium text-gray-700 w-1/3">{spec.label}</td>
                              <td className="px-6 py-3 text-gray-600">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {specs.length > 6 && (
                      <button
                        onClick={() => setShowAllSpecs(!showAllSpecs)}
                        className="w-full py-3 text-center text-blue-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        {showAllSpecs ? (
                          <>Thu gọn <ChevronUpIcon className="w-4 h-4" /></>
                        ) : (
                          <>Xem thêm thông số <ChevronDownIcon className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có thông số kỹ thuật cho sản phẩm này.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">🎯 Bảo hành chính hãng</h3>
                  <p className="text-gray-600">Bảo hành 12 tháng tại trung tâm bảo hành Chính hãng. 1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">💰 Giá sản phẩm</h3>
                  <p className="text-gray-600">Giá sản phẩm đã bao gồm thuế VAT, có hỗ trợ hoàn thuế VAT - Tax Refund cho khách du lịch.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">📦 Vận chuyển</h3>
                  <p className="text-gray-600">Giao hàng miễn phí cho đơn hàng từ 300.000đ. Giao nhanh trong 2 giờ tại nội thành.</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewSection 
                productId={product.id} 
                onReviewAdded={fetchProduct} 
              />
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Có thể bạn cũng thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="block">
                  <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer">
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                    <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-red-600 font-bold mt-2">{formatPrice(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
