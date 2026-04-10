import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import productClient from '../../../shared/api/product-api';

const CLOUDINARY_CLOUD_NAME = 'dxkfusgxs';
const CLOUDINARY_UPLOAD_PRESET = 'ecommerce_c10k';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSpecsForm, setShowSpecsForm] = useState(false);
  
  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);
  const hoverFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    oldPrice: '',
    image: '',
    hoverImage: '',
    category: 'iphone',
    stock: '',
    rating: 4.5,
    reviews: 0,
    colors: [],
    screenSize: '',
    screenTechnology: '',
    rearCamera: '',
    frontCamera: '',
    chipset: '',
    ram: '',
    storage: '',
    battery: '',
    charging: '',
    waterResistance: ''
  });
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    // Debounce Search 500ms
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productClient.get('/', {
        params: { page, limit: 20, search }
      });
      setProducts(response.data.data || []);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    setUploading(true);
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadForm
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload ảnh thất bại');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setFormData({ ...formData, [field]: imageUrl });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews)
      };

      if (editingProduct) {
        await productClient.put(`/${editingProduct.id}`, productData);
      } else {
        await productClient.post('/', productData);
      }

      fetchProducts();
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      alert(editingProduct ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!');
    } catch (error) {
      console.error('Error saving product:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await productClient.delete(`/${id}`);
        fetchProducts();
        alert('Xóa sản phẩm thành công!');
      } catch (error) {
        console.error('Error deleting product:', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Xóa thất bại');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      oldPrice: product.oldPrice || '',
      image: product.image || '',
      hoverImage: product.hoverImage || '',
      category: product.category || 'iphone',
      stock: product.stock || '',
      rating: product.rating || 4.5,
      reviews: product.reviews || 0,
      colors: product.colors || [],
      screenSize: product.screenSize || '',
      screenTechnology: product.screenTechnology || '',
      rearCamera: product.rearCamera || '',
      frontCamera: product.frontCamera || '',
      chipset: product.chipset || '',
      ram: product.ram || '',
      storage: product.storage || '',
      battery: product.battery || '',
      charging: product.charging || '',
      waterResistance: product.waterResistance || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      oldPrice: '',
      image: '',
      hoverImage: '',
      category: 'iphone',
      stock: '',
      rating: 4.5,
      reviews: 0,
      colors: [],
      screenSize: '',
      screenTechnology: '',
      rearCamera: '',
      frontCamera: '',
      chipset: '',
      ram: '',
      storage: '',
      battery: '',
      charging: '',
      waterResistance: ''
    });
    setNewColor('');
    setShowSpecsForm(false);
  };

  const addColor = () => {
    if (newColor.trim()) {
      setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
      setNewColor('');
    }
  };

  const removeColor = (index) => {
    setFormData({ ...formData, colors: formData.colors.filter((_, i) => i !== index) });
  };

  const categories = [
    { value: 'iphone', label: 'iPhone' },
    { value: 'samsung', label: 'Samsung' },
    { value: 'xiaomi', label: 'Xiaomi' },
    { value: 'google', label: 'Google' }
  ];

  const specFields = [
    { key: 'screenSize', label: 'Kích thước màn hình', placeholder: 'Ví dụ: 6.9 inches' },
    { key: 'screenTechnology', label: 'Công nghệ màn hình', placeholder: 'Ví dụ: Dynamic AMOLED 2X' },
    { key: 'rearCamera', label: 'Camera sau', placeholder: 'Ví dụ: 200MP + 50MP + 12MP' },
    { key: 'frontCamera', label: 'Camera trước', placeholder: 'Ví dụ: 12MP' },
    { key: 'chipset', label: 'Chipset', placeholder: 'Ví dụ: Snapdragon 8 Gen 3' },
    { key: 'ram', label: 'RAM', placeholder: 'Ví dụ: 12GB' },
    { key: 'storage', label: 'Bộ nhớ trong', placeholder: 'Ví dụ: 256GB' },
    { key: 'battery', label: 'Pin', placeholder: 'Ví dụ: 5000 mAh' },
    { key: 'charging', label: 'Sạc nhanh', placeholder: 'Ví dụ: 45W' },
    { key: 'waterResistance', label: 'Chống nước', placeholder: 'Ví dụ: IP68' }
  ];

  if (loading) return <div className="text-center py-8">Đang tải...</div>;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-lg shadow-sm border border-gray-100 items-center justify-between">
        <input
          type="text"
          placeholder="🔍 Tìm theo tên sản phẩm (Gõ để tìm tự động)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-96 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <div className="text-sm text-gray-500">
          Đang hiển thị {products.length} sản phẩm
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 text-sm">{product.id?.slice(-6)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                    {categories.find((c) => c.value === product.category)?.label || product.category}
                  </span>
                </td>
                <td className="px-6 py-4">{product.price.toLocaleString()}đ</td>
                <td className="px-6 py-4">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(product)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4 pb-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang trước
          </button>
          <div className="px-4 py-2">
            Trang <span className="font-bold">{page}</span> / {totalPages}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang tiếp
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tồn kho *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá (VNĐ) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá cũ (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ảnh chính *</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="URL hoặc upload ảnh"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-gray-100 rounded-lg">
                        <PhotoIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} className="hidden" />
                    {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded border" />}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Ảnh hover</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.hoverImage}
                        onChange={(e) => setFormData({ ...formData, hoverImage: e.target.value })}
                        placeholder="URL hoặc upload ảnh"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button type="button" onClick={() => hoverFileInputRef.current?.click()} className="px-3 py-2 bg-gray-100 rounded-lg">
                        <PhotoIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <input ref={hoverFileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hoverImage')} className="hidden" />
                    {formData.hoverImage && <img src={formData.hoverImage} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded border" />}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Màu sắc</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Ví dụ: Đen, Trắng, Xanh"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button type="button" onClick={addColor} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Thêm</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center space-x-2">
                        <span>{color}</span>
                        <button type="button" onClick={() => removeColor(index)} className="text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSpecsForm(!showSpecsForm)}
                    className="flex items-center justify-between w-full py-2 text-left font-semibold text-gray-700"
                  >
                    <span>📋 Thông số kỹ thuật</span>
                    {showSpecsForm ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                  </button>

                  {showSpecsForm && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {specFields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={formData[field.key]}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {uploading ? 'Đang upload...' : editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
