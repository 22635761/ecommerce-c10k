const axios = require('axios');

const GHN_BASE_URL = process.env.GHN_BASE_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
const GHN_TOKEN = process.env.GHN_TOKEN || 'b29f8bbf-349f-11f1-a973-aee5264794df';
const GHN_SHOP_ID = process.env.GHN_SHOP_ID || '199917'; // Zero Phone shop

const ghnHeaders = () => ({
  'Token': GHN_TOKEN,
  'ShopId': GHN_SHOP_ID,
  'Content-Type': 'application/json'
});

class GHNService {
  /**
   * Lấy danh sách Tỉnh/Thành phố từ GHN
   */
  async getProvinces() {
    const res = await axios.get(`${GHN_BASE_URL}/master-data/province`, {
      headers: { 'Token': GHN_TOKEN }
    });
    return res.data.data || [];
  }

  /**
   * Lấy danh sách Quận/Huyện theo ProvinceID
   */
  async getDistricts(provinceId) {
    const res = await axios.post(`${GHN_BASE_URL}/master-data/district`, {
      province_id: parseInt(provinceId)
    }, { headers: { 'Token': GHN_TOKEN } });
    return res.data.data || [];
  }

  /**
   * Lấy danh sách Phường/Xã theo DistrictID
   */
  async getWards(districtId) {
    const res = await axios.get(`${GHN_BASE_URL}/master-data/ward?district_id=${districtId}`, {
      headers: { 'Token': GHN_TOKEN }
    });
    return res.data.data || [];
  }

  /**
   * Tính phí vận chuyển thực tế từ GHN
   * @param {number} toDistrictId - Mã huyện người nhận (từ GHN)
   * @param {string} toWardCode   - Mã phường người nhận (từ GHN)
   * @param {number} weightGram   - Tổng trọng lượng (gram)
   * @param {number} value        - Giá trị hàng (để tính phí bảo hiểm nếu cần)
   */
  async calculateFee({ toDistrictId, toWardCode, weightGram = 500, value = 0 }) {
    try {
      const body = {
        service_type_id: 2, // 2 = Giao hàng thường, 5 = Giao hàng nhanh
        to_district_id: parseInt(toDistrictId),
        to_ward_code: String(toWardCode),
        height: 15,
        length: 15,
        weight: weightGram,
        width: 15,
        insurance_value: value > 5000000 ? Math.min(value, 10000000) : 0
      };

      const res = await axios.post(
        `${GHN_BASE_URL}/v2/shipping-order/fee`,
        body,
        { headers: ghnHeaders() }
      );

      if (res.data.code === 200 && res.data.data) {
        return {
          success: true,
          fee: res.data.data.total,
          feeDetails: {
            mainService: res.data.data.service_fee || 0,
            insurance: res.data.data.insurance_fee || 0,
            codFee: res.data.data.cod_fee || 0
          }
        };
      }

      return { success: false, fee: 35000, error: res.data.message };
    } catch (err) {
      console.error('[GHN] Lỗi tính phí ship:', err.response?.data || err.message);
      return { success: false, fee: 35000, error: err.message };
    }
  }

  /**
   * Tạo đơn hàng GHN (sau khi khách đặt hàng thành công)
   */
  async createOrder({ order, toDistrictId, toWardCode, weightGram = 500 }) {
    try {
      const body = {
        to_name: order.customerName,
        to_phone: order.phone,
        to_address: order.address,
        to_ward_code: String(toWardCode),
        to_district_id: parseInt(toDistrictId),
        weight: weightGram,
        length: 15,
        width: 15,
        height: 15,
        service_type_id: 2,
        payment_type_id: order.paymentMethod === 'cod' ? 2 : 1, // 2 = Thu tiền người nhận (COD), 1 = người gửi
        cod_amount: order.paymentMethod === 'cod' ? Math.round(order.total) : 0,
        note: order.note || '',
        required_note: 'CHOTHUHANG', // Cho thử hàng - hợp lệ trên sandbox GHN
        items: order.items.map(item => ({
          name: item.name || 'Sản phẩm',
          quantity: item.quantity,
          price: Math.round(item.price || 0)
        }))
      };

      const res = await axios.post(
        `${GHN_BASE_URL}/v2/shipping-order/create`,
        body,
        { headers: ghnHeaders() }
      );

      if (res.data.code === 200) {
        return {
          success: true,
          orderCode: res.data.data.order_code,
          sortCode: res.data.data.sort_code,
          expectedDelivery: res.data.data.expected_delivery_time
        };
      }

      return { success: false, error: res.data.message };
    } catch (err) {
      console.error('[GHN] Lỗi tạo đơn:', err.response?.data || err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Tra cứu trạng thái đơn hàng GHN theo order_code — đầy đủ thông tin
   */
  async trackOrder(ghnOrderCode) {
    try {
      const res = await axios.post(`${GHN_BASE_URL}/v2/shipping-order/detail`, {
        order_code: ghnOrderCode
      }, { headers: ghnHeaders() });

      if (res.data.code === 200) {
        const d = res.data.data;
        return {
          success: true,
          status: d.status,
          leadtime: d.leadtime,
          sortCode: d.sort_code,
          fromLocation: d.from_location,
          toLocation: d.to_location,
          logs: d.log || [],
          content: d.content,
          codAmount: d.cod_amount,
          isCodTransferred: d.is_cod_transferred
        };
      }

      return { success: false };
    } catch (err) {
      console.error('[GHN] Lỗi tra cứu đơn:', err.message);
      return { success: false };
    }
  }

  /**
   * Lấy danh sách dịch vụ vận chuyển có sẵn cho tuyến đường
   * @param {number} fromDistrictId - Mã huyện shop
   * @param {number} toDistrictId   - Mã huyện người nhận
   */
  async getAvailableServices(fromDistrictId, toDistrictId) {
    try {
      const res = await axios.post(`${GHN_BASE_URL}/v2/shipping-order/available-services`, {
        shop_id: parseInt(GHN_SHOP_ID),
        from_district: parseInt(fromDistrictId),
        to_district: parseInt(toDistrictId)
      }, { headers: { 'Token': GHN_TOKEN, 'Content-Type': 'application/json' } });

      if (res.data.code === 200) {
        return {
          success: true,
          services: (res.data.data || []).map(s => ({
            serviceId: s.service_id,
            name: s.short_name,
            serviceTypeId: s.service_type_id
          }))
        };
      }
      return { success: false, services: [] };
    } catch (err) {
      console.error('[GHN] Lỗi lấy dịch vụ:', err.message);
      return { success: false, services: [] };
    }
  }

  /**
   * Lấy thời gian giao hàng dự kiến
   * @param {number} toDistrictId
   * @param {string} toWardCode
   * @param {number} serviceId - ID dịch vụ từ getAvailableServices
   */
  async getLeadtime({ toDistrictId, toWardCode, serviceId = 53320 }) {
    try {
      const res = await axios.post(`${GHN_BASE_URL}/v2/shipping-order/leadtime`, {
        from_district_id: 1461,  // Quận Gò Vấp - HCM (địa chỉ shop)
        from_ward_code: '21304',
        to_district_id: parseInt(toDistrictId),
        to_ward_code: String(toWardCode),
        service_id: serviceId
      }, { headers: ghnHeaders() });

      if (res.data.code === 200) {
        return {
          success: true,
          leadtime: res.data.data.leadtime, // Unix timestamp
          leadtimeDisplay: new Date(res.data.data.leadtime * 1000).toLocaleDateString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit'
          })
        };
      }
      return { success: false };
    } catch (err) {
      console.error('[GHN] Lỗi lấy leadtime:', err.message);
      return { success: false };
    }
  }

  /**
   * Fallback: Tính phí thủ công nếu GHN không available
   */
  fallbackFee(provinceName) {
    const province = (provinceName || '').toLowerCase().trim();
    if (province.includes('hồ chí minh') || province.includes('ho chi minh')) return 20000;
    if (province.includes('hà nội') || province.includes('ha noi')) return 35000;
    if (province.includes('đà nẵng') || province.includes('da nang')) return 40000;
    if (province.includes('bình dương')) return 25000;
    if (province.includes('đồng nai')) return 30000;
    return 50000;
  }
}

module.exports = new GHNService();
