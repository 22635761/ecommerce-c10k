import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { discountAPI } from '../../../services/discountService';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    perUserLimit: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await discountAPI.getAllDiscounts();
      setDiscounts(response.data.data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      if (editingDiscount) {
        await discountAPI.updateDiscount(editingDiscount.id, data);
      } else {
        await discountAPI.createDiscount(data);
      }
      
      fetchDiscounts();
      setShowModal(false);
      resetForm();
      alert(editingDiscount ? 'Cập nhật thành công!' : 'Thêm mã giảm giá thành công!');
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
      try {
        await discountAPI.deleteDiscount(id);
        fetchDiscounts();
        alert('Xóa thành công!');
      } catch (error) {
        console.error('Error deleting discount:', error);
        alert('Xóa thất bại');
      }
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value || '',
      minOrderAmount: discount.minOrderAmount || '',
      maxDiscountAmount: discount.maxDiscountAmount || '',
      usageLimit: discount.usageLimit || '',
      perUserLimit: discount.perUserLimit || '',
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().slice(0, 16) : '',
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().slice(0, 16) : '',
      isActive: discount.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
      perUserLimit: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Format giá trị hiển thị
  const formatValue = (discount) => {
    if (discount.value === null || discount.value === undefined) {
      return '—';
    }
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    }
    if (discount.type === 'fixed') {
      return `${discount.value.toLocaleString()}đ`;
    }
    if (discount.type === 'free_shipping') {
      return `Tối đa ${discount.value.toLocaleString()}đ`;
    }
    return discount.value;
  };

  const getValuePlaceholder = () => {
    switch (formData.type) {
      case 'percentage': return 'Ví dụ: 10 (giảm 10%)';
      case 'fixed': return 'Ví dụ: 50000 (giảm 50.000đ)';
      case 'free_shipping': return 'Ví dụ: 30000 (miễn phí ship tối đa 30.000đ)';
      default: return 'Nhập giá trị';
    }
  };

  const getValueLabel = () => {
    switch (formData.type) {
      case 'percentage': return 'Giá trị (%)';
      case 'fixed': return 'Giá trị (VNĐ)';
      case 'free_shipping': return 'Giá trị miễn phí ship (VNĐ)';
      default: return 'Giá trị';
    }
  };

  if (loading) return <div className="text-center py-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý mã giảm giá</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Thêm mã giảm giá</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng tối thiểu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {discounts.map((discount) => (
              <tr key={discount.id}>
                <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{discount.code}</td>
                <td className="px-6 py-4">{discount.name}</td>
                <td className="px-6 py-4">
                  {discount.type === 'percentage' && 'Phần trăm'}
                  {discount.type === 'fixed' && 'Cố định'}
                  {discount.type === 'free_shipping' && 'Miễn phí ship'}
                </td>
                <td className="px-6 py-4">{formatValue(discount)}</td>
                <td className="px-6 py-4">
                  {discount.minOrderAmount ? `${discount.minOrderAmount.toLocaleString()}đ` : '—'}
                </td>
                <td className="px-6 py-4">
                  {discount.usedCount}/{discount.usageLimit || '∞'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {discount.endDate ? formatDate(discount.endDate) : 'Vĩnh viễn'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    discount.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {discount.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa mã giảm giá */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingDiscount ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã giảm giá *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg uppercase"
                    placeholder="WELCOME10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên mã *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Chào mừng thành viên mới"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mô tả chi tiết về mã giảm giá"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại giảm giá *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{getValueLabel()} *</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={getValuePlaceholder()}
                    required
                  />
                  {formData.type === 'free_shipping' && (
                    <p className="text-xs text-gray-500 mt-1">Số tiền tối đa được miễn phí vận chuyển</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Chỉ áp dụng cho %"
                    disabled={formData.type !== 'percentage'}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giới hạn số lượt</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới hạn mỗi người</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Kích hoạt</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDiscount ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;
