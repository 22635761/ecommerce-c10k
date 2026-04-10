import React, { useState, useEffect } from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon, PhotoIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import productClient from '../../../shared/api/product-api';
import { useAuth } from '../../auth/hooks/useAuth';

const ReviewSection = ({ productId, onReviewAdded }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyForm, setReplyForm] = useState({ reviewId: null, text: '' });
  const { user, isAuthenticated } = useAuth();
  
  const [form, setForm] = useState({
    rating: 5,
    comment: '',
    files: []
  });

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await productClient.get(`/${productId}/reviews`);
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải đánh giá', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3); // Max 3 ảnh
      setForm({ ...form, files: selectedFiles });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    setSubmitting(true);
    try {
      const CLOUDINARY_CLOUD_NAME = 'dxkfusgxs';
      const CLOUDINARY_UPLOAD_PRESET = 'ecommerce_c10k';
      
      const imageUrls = [];

      // Upload each file to Cloudinary directly from Client
      for (const file of form.files) {
        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: uploadForm,
        });
        const data = await response.json();
        if (data.secure_url) {
          imageUrls.push(data.secure_url);
        }
      }

      // Send JSON payload to Backend
      const payload = {
        rating: form.rating,
        comment: form.comment,
        images: imageUrls,
        userId: user ? user.id : undefined,
        userName: user ? user.name : undefined
      };

      await productClient.post(`/${productId}/reviews`, payload);

      alert('Cảm ơn bạn đã đánh giá!');
      setForm({ rating: 5, comment: '', files: [] }); // Reset form
      fetchReviews(); // Reload list
      if (onReviewAdded) onReviewAdded(); // Notify parent to reload product rating

    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi thêm đánh giá (Có thể bạn chưa đăng nhập)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminReply = async (reviewId) => {
    if (!replyForm.text.trim()) return;
    try {
      await productClient.post(`/${productId}/reviews/${reviewId}/reply`, { adminReply: replyForm.text });
      setReplyForm({ reviewId: null, text: '' });
      fetchReviews();
    } catch (e) {
      alert('Có lỗi, bạn không có quyền Admin hoặc phiên đăng nhập đã hết');
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "submit"}
            disabled={!interactive}
            onClick={() => interactive && setForm({ ...form, rating: star })}
            className={`transition ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            {star <= rating ? (
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Đánh giá & Nhận xét</h3>
      
      {/* Form Viết Đánh Giá */}
      {!isAuthenticated ? (
        <div className="text-center py-6 border border-gray-100 bg-gray-50 rounded-xl mb-8">
          <p className="text-sm text-gray-500 mb-3">Bạn cần đăng nhập bằng tài khoản thành viên để đánh giá.</p>
          <button 
            type="button"
            onClick={() => window.dispatchEvent(new Event('openLoginModal'))} 
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-100 bg-gray-50 p-4 rounded-xl mb-8 shadow-inner shadow-gray-200/50">
          <h4 className="font-semibold mb-3">Gửi đánh giá của bạn</h4>
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm font-medium">Chất lượng sản phẩm:</span>
            {renderStars(form.rating, true)}
          </div>
          
          <div className="mb-3">
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              rows="3"
              placeholder="Chia sẻ cảm nhận chân thật của bạn về chất lượng và độ hoàn thiện sản phẩm..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
                <PhotoIcon className="w-4 h-4 text-emerald-600" /> Thêm ảnh từ máy
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
              <span className="text-xs text-gray-400">{form.files.length}/3 ảnh đính kèm</span>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang tải lên mây...' : <>Đăng đánh giá <PaperAirplaneIcon className="w-4 h-4" /></>}
            </button>
          </div>
          
          {/* Xem trước ảnh */}
          {form.files.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {form.files.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-16 h-16 object-cover rounded-md border-2 border-emerald-100" />
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      {/* Danh sách Đánh giá */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 animate-pulse">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl border-gray-200">
          <p className="text-gray-500">Chưa có đánh giá nào. Hãy trở thành người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                    {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">{rev.userName}</h5>
                    {renderStars(rev.rating)}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <p className="text-gray-700 text-sm mb-3 mt-2">{rev.comment}</p>
              
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-3 mt-3">
                  {rev.images.map((imgUrl, i) => (
                    <a href={imgUrl} target="_blank" rel="noreferrer" key={i}>
                      <img src={imgUrl} alt="review-img" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-100 hover:border-emerald-400 transition" />
                    </a>
                  ))}
                </div>
              )}

              {/* Admin Reply Block */}
              {rev.adminReply ? (
                <div className="mt-4 bg-yellow-50/80 border border-yellow-200/60 p-3 rounded-lg ml-6 relative">
                  <div className="absolute -left-2 top-4 w-2 h-2 bg-yellow-100 border-b border-l border-yellow-200/60 transform rotate-45"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Admin</span>
                    <span className="text-xs text-gray-400">{new Date(rev.adminReplyAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="text-sm text-gray-800">{rev.adminReply}</p>
                </div>
              ) : user?.role === 'admin' ? (
                <div className="mt-3 ml-6">
                  {replyForm.reviewId === rev.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea 
                        className="w-full text-sm border border-gray-200 rounded p-2 focus:ring-1 focus:ring-gray-300 outline-none" 
                        rows="2" placeholder="Nhập câu trả lời đính chính..."
                        value={replyForm.text} onChange={(e) => setReplyForm({ ...replyForm, text: e.target.value })}
                      ></textarea>
                      <div className="flex gap-2 justify-end">
                        <button className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setReplyForm({ reviewId: null, text: '' })}>Hủy</button>
                        <button className="text-xs px-3 py-1 bg-red-600 text-white font-medium rounded hover:bg-red-700 shadow-sm" onClick={() => handleAdminReply(rev.id)}>Đăng trả lời</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setReplyForm({ reviewId: rev.id, text: '' })}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                    >
                      <PaperAirplaneIcon className="w-3 h-3" /> QTV Trả lời khách hàng này
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
