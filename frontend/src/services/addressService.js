import axios from 'axios';

const GHN_BASE = 'https://dev-online-gateway.ghn.vn/shiip/public-api';
const GHN_TOKEN = 'b29f8bbf-349f-11f1-a973-aee5264794df';
const GHN_HEADERS = { Token: GHN_TOKEN };

// Cache to avoid repeated API calls
let provinceCache = null;
const districtCache = {};
const wardCache = {};

// Danh sách tỉnh thành THỰC TẾ của Việt Nam (63 tỉnh) — dùng để lọc data test GHN Sandbox
const REAL_PROVINCES = new Set([
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội','Hà Tĩnh',
  'Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa',
  'Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai',
  'Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ',
  'Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị',
  'Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa',
  'Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Hồ Chí Minh',
  'Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái'
]);

const isTestEntry = (name = '') => {
  const n = name.toLowerCase();
  return (
    n.includes('test') ||
    n.includes('alert') ||
    n.includes('xss') ||
    /\b0[0-9]\b/.test(name) ||   // "Hà Nội 02", "01", "03"...
    /\b\d{3}\b/.test(name)        // "001", "002"...
  );
};

export const getProvinces = async () => {
  if (provinceCache) return provinceCache;
  try {
    const res = await axios.get(`${GHN_BASE}/master-data/province`, { headers: GHN_HEADERS });
    const data = (res.data.data || [])
      .filter(p => {
        const name = p.ProvinceName || '';
        // Bỏ entry test, chỉ giữ tỉnh thật
        if (isTestEntry(name)) return false;
        return true;
      })
      .map(p => ({
        code: p.ProvinceID,
        name: p.ProvinceName.trim(),
        ghnId: p.ProvinceID
      }))
      // Dedupe theo tên (bỏ bản trùng, giữ bản có ID nhỏ hơn = bản gốc)
      .reduce((acc, p) => {
        const key = p.name.toLowerCase().replace(/\s+/g, ' ');
        if (!acc.map[key]) {
          acc.map[key] = true;
          acc.list.push(p);
        }
        return acc;
      }, { map: {}, list: [] }).list
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    provinceCache = data;
    return data;
  } catch (err) {
    console.error('[GHN] Lỗi lấy tỉnh thành:', err);
    return [];
  }
};


// ──────────────────────────────────────────────
// Lấy danh sách Quận/Huyện theo ProvinceID GHN
// ──────────────────────────────────────────────
export const getDistricts = async (provinceId) => {
  if (districtCache[provinceId]) return districtCache[provinceId];
  try {
    const res = await axios.post(`${GHN_BASE}/master-data/district`,
      { province_id: parseInt(provinceId) },
      { headers: GHN_HEADERS }
    );
    const data = (res.data.data || [])
      .filter(d => !isTestEntry(d.DistrictName || ''))
      .map(d => ({
        code: d.DistrictID,
        name: d.DistrictName,
        ghnId: d.DistrictID
      }));
    districtCache[provinceId] = data;
    return data;
  } catch (err) {
    console.error('[GHN] Lỗi lấy quận huyện:', err);
    return [];
  }
};

// ──────────────────────────────────────────────
// Lấy danh sách Phường/Xã theo DistrictID GHN
// ──────────────────────────────────────────────
export const getWards = async (districtId) => {
  if (wardCache[districtId]) return wardCache[districtId];
  try {
    const res = await axios.get(`${GHN_BASE}/master-data/ward?district_id=${districtId}`, {
      headers: GHN_HEADERS
    });
    const data = (res.data.data || [])
      .filter(w => !isTestEntry(w.WardName || ''))
      .map(w => ({
        code: w.WardCode,
        name: w.WardName,
        ghnCode: w.WardCode
      }));
    wardCache[districtId] = data;
    return data;
  } catch (err) {
    console.error('[GHN] Lỗi lấy phường xã:', err);
    return [];
  }
};
