// Dữ liệu tỉnh thành Việt Nam và phí vận chuyển từ TP.HCM
const provinces = [
  // TP Hồ Chí Minh (khu vực nội thành)
  { code: 'HCM', name: 'Hồ Chí Minh', region: 'inner_city', fee: 20000 },
  // Các tỉnh miền Nam (khu vực lân cận)
  { code: 'BD', name: 'Bình Dương', region: 'near', fee: 30000 },
  { code: 'DN', name: 'Đồng Nai', region: 'near', fee: 35000 },
  { code: 'LA', name: 'Long An', region: 'near', fee: 35000 },
  { code: 'TV', name: 'Tiền Giang', region: 'near', fee: 40000 },
  { code: 'BT', name: 'Bến Tre', region: 'near', fee: 45000 },
  { code: 'VL', name: 'Vĩnh Long', region: 'near', fee: 45000 },
  { code: 'CT', name: 'Cần Thơ', region: 'far', fee: 55000 },
  // Các tỉnh miền Trung
  { code: 'DNG', name: 'Đà Nẵng', region: 'central', fee: 70000 },
  { code: 'QN', name: 'Quảng Nam', region: 'central', fee: 70000 },
  { code: 'QNG', name: 'Quảng Ngãi', region: 'central', fee: 75000 },
  { code: 'BDH', name: 'Bình Định', region: 'central', fee: 75000 },
  { code: 'PY', name: 'Phú Yên', region: 'central', fee: 80000 },
  { code: 'KH', name: 'Khánh Hòa', region: 'central', fee: 80000 },
  { code: 'NT', name: 'Ninh Thuận', region: 'central', fee: 85000 },
  { code: 'BTH', name: 'Bình Thuận', region: 'central', fee: 85000 },
  // Các tỉnh miền Bắc
  { code: 'HN', name: 'Hà Nội', region: 'north', fee: 90000 },
  { code: 'HP', name: 'Hải Phòng', region: 'north', fee: 90000 },
  { code: 'QNIN', name: 'Quảng Ninh', region: 'north', fee: 95000 },
  { code: 'NB', name: 'Nam Định', region: 'north', fee: 90000 },
  { code: 'TB', name: 'Thái Bình', region: 'north', fee: 90000 },
  { code: 'BN', name: 'Bắc Ninh', region: 'north', fee: 90000 },
  { code: 'BG', name: 'Bắc Giang', region: 'north', fee: 90000 },
  { code: 'HY', name: 'Hưng Yên', region: 'north', fee: 90000 },
  { code: 'HD', name: 'Hải Dương', region: 'north', fee: 90000 },
  { code: 'LC', name: 'Lào Cai', region: 'north', fee: 100000 },
  { code: 'YG', name: 'Yên Bái', region: 'north', fee: 100000 },
  { code: 'TG', name: 'Thái Nguyên', region: 'north', fee: 95000 },
  // Các tỉnh Tây Nguyên
  { code: 'DL', name: 'Đắk Lắk', region: 'highland', fee: 80000 },
  { code: 'DN', name: 'Đắk Nông', region: 'highland', fee: 80000 },
  { code: 'GL', name: 'Gia Lai', region: 'highland', fee: 85000 },
  { code: 'KT', name: 'Kon Tum', region: 'highland', fee: 85000 },
  { code: 'LD', name: 'Lâm Đồng', region: 'highland', fee: 75000 },
  // Các tỉnh miền Tây
  { code: 'AG', name: 'An Giang', region: 'mekong', fee: 55000 },
  { code: 'KG', name: 'Kiên Giang', region: 'mekong', fee: 60000 },
  { code: 'CM', name: 'Cà Mau', region: 'mekong', fee: 65000 },
  { code: 'ST', name: 'Sóc Trăng', region: 'mekong', fee: 55000 },
  { code: 'BL', name: 'Bạc Liêu', region: 'mekong', fee: 60000 },
  { code: 'HG', name: 'Hậu Giang', region: 'mekong', fee: 55000 },
  { code: 'TV', name: 'Trà Vinh', region: 'mekong', fee: 50000 },
  { code: 'DT', name: 'Đồng Tháp', region: 'mekong', fee: 50000 }
];

// Hàm lấy danh sách tỉnh thành
const getProvinces = () => {
  return provinces.map(p => ({ code: p.code, name: p.name, fee: p.fee }));
};

// Hàm tính phí vận chuyển theo tỉnh
const getShippingFee = (provinceCode) => {
  const province = provinces.find(p => p.code === provinceCode);
  return province ? province.fee : 50000; // Mặc định 50k nếu không tìm thấy
};

// Hàm lấy tên tỉnh theo code
const getProvinceName = (provinceCode) => {
  const province = provinces.find(p => p.code === provinceCode);
  return province ? province.name : '';
};

module.exports = { provinces, getProvinces, getShippingFee, getProvinceName };
