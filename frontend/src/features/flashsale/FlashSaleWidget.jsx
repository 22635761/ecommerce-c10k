import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BoltIcon, FireIcon, CheckCircleIcon, XCircleIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const FlashSaleWidget = () => {
  const [saleData, setSaleData] = useState(null); // Complete data from /active
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [localTime, setLocalTime] = useState(Date.now());
  const navigate = useNavigate();
  
  // -- Auth check --
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isAdmin = user && user.role === 'admin';

  // -- Admin UI States --
  const [showAdmin, setShowAdmin] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adminQty, setAdminQty] = useState(1);
  const [adminSalePrice, setAdminSalePrice] = useState('');
  const [adminStartTime, setAdminStartTime] = useState('');
  const [adminError, setAdminError] = useState('');

  // Fetch Active Sale
  const fetchActiveSale = async () => {
    try {
      const res = await axios.get(`http://localhost:3004/api/orders/flash-sale/active?t=${Date.now()}`);
      if(res.data.success && res.data.data) {
        setSaleData(res.data.data);
      } else {
        setSaleData(null);
      }
    } catch(err) {
      console.error('Error fetching active flash sale:', err);
    }
  };

  useEffect(() => {
    fetchActiveSale();
    const interval = setInterval(fetchActiveSale, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update locale timer for frontend countdown smoothness
  useEffect(() => {
    const i = setInterval(() => setLocalTime(Date.now()), 100);
    return () => clearInterval(i);
  }, []);

  // Admin: Load products
  const fetchProductsForAdmin = async () => {
    if(!isAdmin) return;
    try {
      const res = await axios.get('http://localhost:3002/api/products');
      if (res.data.success) {
        setAllProducts(res.data.data);
        if(res.data.data.length > 0) setSelectedProductId(res.data.data[0].id);
      }
    } catch(e) { console.error('Failed to load products', e); }
  };

  const openAdminPanel = () => {
    setShowAdmin(true);
    fetchProductsForAdmin();
  };

  const submitAdminSetup = async () => {
    try {
      setAdminError('');
      if(!selectedProductId || !adminQty || !adminStartTime) {
        setAdminError('Vui lòng nhập đầy đủ thông tin');
        return;
      }
      
      const startTimeMs = new Date(adminStartTime).getTime();
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = {
        productId: selectedProductId,
        quantity: parseInt(adminQty),
        startTimeMs: startTimeMs,
        salePrice: parseInt(adminSalePrice)
      };

      const res = await axios.post('http://localhost:3004/api/orders/admin/flash-sale/init', body, config);
      if(res.data.success) {
        alert(res.data.message);
        setShowAdmin(false);
        fetchActiveSale();
      }
    } catch(err) {
      setAdminError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleBuy = async () => {
    if (!saleData || saleData.stock <= 0) return;
    
    // Yêu cầu đăng nhập trước khi Săn Sale
    if (!token || !user) {
      window.dispatchEvent(new Event('openLoginModal'));
      return;
    }
    
    setStatus('loading');
    
    try {
      // 1. Gửi Lệnh Trừ Kho Tạm lên Redis (Bảo vệ C10K)
      // Note: LUA Script sẽ tự động chặn và báo lỗi nếu người thứ 11 bấm vào khi kho chỉ có 10
      const res = await axios.post('http://localhost:3004/api/orders/flash-sale/buy', { productId: saleData.id });
      
      // 2. Đá văng người dùng sang Trang Thanh Toán Độc Lập (như TikTok)
      // Không lưu vào giỏ hàng chung, mà pass thẳng qua Route State
      navigate('/checkout', {
         state: {
            checkoutItems: [{
               productId: saleData.product.id,
               name: saleData.product.name,
               price: saleData.salePrice || saleData.product.price,
               image: saleData.product.image,
               quantity: 1
            }],
            isBuyNow: true,
            reservationId: res.data.reservationId
         }
      });
      
    } catch(err) {
      setStatus('failed');
      setMessage(err.response ? err.response.data.message : 'Lỗi kết nối máy chủ');
      fetchActiveSale();
    }
  };

  // Helper formatting
  const timeDiff = saleData ? saleData.startTime - localTime : 0;
  const isStarted = saleData && saleData.startTime > 0 && timeDiff <= 0;
  
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00:00";
    const totalS = Math.floor(ms / 1000);
    const h = Math.floor(totalS / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalS % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalS % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // If no sale is active and user is not admin, hide the banner entirely
  if (!saleData && !isAdmin) return null;

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl overflow-hidden relative border border-gray-700">
      
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-red-600 opacity-20 blur-3xl"></div>
      
      {/* Admin Toggle */}
      {isAdmin && (
        <button 
          onClick={openAdminPanel}
          title="Thiết lập Flash Sale"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
      )}

      {/* Admin Panel Modal */}
      {showAdmin && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-xl mt-10 md:mt-0">
            <h3 className="text-3xl text-yellow-300 font-bold mb-8 text-center">Cấu Hình Đợt Flash Sale</h3>
            
            {adminError && <div className="text-red-400 bg-red-900/40 p-3 rounded mb-6 text-sm text-center font-bold">{adminError}</div>}
            
            {/* Grid 2 Cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chọn Sản phẩm (Chiếm full width dòng 1) */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-gray-300 text-sm font-semibold mb-2 block">Sản phẩm Sale</label>
                <select 
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    const p = allProducts.find(x => x.id === e.target.value);
                    if(p) setAdminSalePrice(p.price); // Gợi ý giá gốc để tiện sửa
                  }}
                  className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                >
                  <option value="">-- Chọn sản phẩm có sẵn trong DB --</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Tồn kho thực: {p.stock} chiếc)</option>
                  ))}
                </select>
              </div>

              {/* Cột 1: Giá và Số lượng */}
              <div className="space-y-6">
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">Giá Khuyến Mãi (VNĐ)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={adminSalePrice} 
                    onChange={e=>setAdminSalePrice(Number(e.target.value))} 
                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                    placeholder="Ví dụ: 9900000"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">Số lượng trích kho</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={adminQty} 
                    onChange={e=>setAdminQty(Number(e.target.value))} 
                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                  />
                </div>
              </div>

              {/* Cột 2: Thời gian */}
              <div className="space-y-6">
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">Thời điểm Khai Hỏa</label>
                  <input 
                    type="datetime-local" 
                    value={adminStartTime} 
                    onChange={e=>setAdminStartTime(e.target.value)} 
                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" 
                    style={{colorScheme: 'dark'}}
                  />
                  <p className="text-gray-500 text-xs mt-2 italic">Mẹo: Chọn thời gian lớn hơn hiện tại để xem đếm ngược</p>
                </div>
              </div>
              
            </div>

            <div className="flex flex-col-reverse md:flex-row md:space-x-4 pt-8 mt-6 border-t border-gray-700">
              <button onClick={()=>setShowAdmin(false)} className="w-full md:w-1/3 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 rounded-xl transition-colors mt-4 md:mt-0">
                Trở Về
              </button>
              <button onClick={submitAdminSetup} className="w-full md:w-2/3 bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-wider py-3.5 rounded-xl transition-transform hover:scale-[1.02]">
                Phát Động Chiến Dịch 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Flash Sale Display */}
      {!saleData ? (
        <div className="p-10 text-center">
            <p className="text-gray-400 text-lg">Hiện tại không có chương trình Flash Sale nào diễn ra.</p>
            {isAdmin && <p className="text-yellow-500 mt-2 text-sm italic">Nhấp vào icon Cài Đặt góc phải để Tạo mới Flash Sale</p>}
        </div>
      ) : (
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
        
        {/* Product Image Space If Any */}
        <div className="w-full md:w-1/4 flex justify-center mb-4 md:mb-0">
           {saleData.product ? (
              <img src={saleData.product.image} alt={saleData.product.name} className="h-40 object-contain drop-shadow-2xl" />
           ) : (
              <BoltIcon className="w-32 h-32 text-yellow-500/20" />
           )}
        </div>

        {/* Info Side */}
        <div className="flex-1 w-full md:px-8 mb-6 md:mb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 italic tracking-wider">
              FLASH SALE
            </h2>
            
            {/* The Countdown Clock */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono font-bold text-2xl shadow-inner border tracking-widest ${
              isStarted ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'
            }`}>
              <ClockIcon className="w-6 h-6" />
              <span>{formatTime(timeDiff)}</span>
            </div>
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
            {saleData.product ? saleData.product.name : 'Đang tải dữ liệu sản phẩm...'}
          </h3>
          <div className="flex items-end space-x-4 mb-5">
            <span className="text-4xl font-black text-yellow-400">
                {saleData.salePrice ? saleData.salePrice.toLocaleString() + 'đ' : '0đ'}
            </span>
            {saleData.product && (
               <span className="text-lg text-gray-400 line-through font-semibold mb-1">
                  {(saleData.product.price || 0).toLocaleString()}đ
               </span>
            )}
          </div>

          <div className="text-gray-300 text-sm mb-1 font-semibold">Tình trạng kho hàng:</div>
          <div className="w-full max-w-sm bg-gray-800 rounded-full h-4 mb-2 relative overflow-hidden ring-1 ring-gray-700">
            {(() => {
                const p = saleData.totalStock > 0 ? Math.max(0, Math.min(100, (saleData.stock / saleData.totalStock) * 100)) : 0;
                return (
                  <div 
                    className={`h-4 rounded-full transition-all duration-300 flex items-center justify-end px-1 ${
                       p > 20 ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400' : 'bg-gray-600'
                    }`}
                    style={{ width: `${p}%` }}
                  >
                     {p > 20 && <FireIcon className="w-3 h-3 text-red-900" />}
                  </div>
                );
            })()}
          </div>
          <div className="text-gray-400 text-sm flex items-center font-medium">
            <span>Đã bán: <span className="text-white font-bold">{saleData.totalStock - saleData.stock}</span></span>
            <span className="mx-2 opacity-50">|</span>
            <span>Còn lại: <span className="text-yellow-400 font-bold">{saleData.stock}</span> / {saleData.totalStock}</span>
          </div>
        </div>

        {/* CTA Side */}
        <div className="w-full md:w-auto flex flex-col items-center justify-center min-w-[240px]">
          {status === 'idle' || status === 'loading' ? (
             <button 
              onClick={handleBuy}
              disabled={!isStarted || saleData.stock <= 0 || status === 'loading'}
              className={`w-full py-5 px-8 rounded-2xl font-black text-2xl uppercase tracking-wider transition-all shadow-xl flex justify-center items-center ${
                !isStarted 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-b-4 border-gray-900' 
                  : (saleData.stock > 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border-b-4 border-yellow-700 hover:scale-[1.03] hover:shadow-yellow-500/20'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border-b-4 border-gray-900')
              }`}
            >
              {status === 'loading' ? '⏳ Đang giật...' : (!isStarted ? 'Chưa Bán' : (saleData.stock > 0 ? 'Săn Ngay' : 'Hết Hàng'))}
            </button>
          ) : (
             <div className={`w-full p-4 rounded-xl flex flex-col items-center justify-center space-y-1 font-bold text-center border shadow-inner ${
                status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
             }`}>
                {status === 'success' ? <CheckCircleIcon className="w-8 h-8 mb-1" /> : <XCircleIcon className="w-8 h-8 mb-1" />}
                <span className="text-sm">{message}</span>
             </div>
          )}

          {(status === 'success' || status === 'failed') && (
            <button 
              onClick={() => { setStatus('idle'); setMessage(''); fetchActiveSale(); }}
              className="mt-5 text-sm text-gray-500 hover:text-white underline transition-colors focus:outline-none"
            >
              🔄 Tải lại trang Săn Sale
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default FlashSaleWidget;
