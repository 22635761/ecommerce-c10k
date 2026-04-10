const vn = require('vn-provinces');

class AddressController {
  // Lấy danh sách tỉnh/thành
  async getProvinces(req, res) {
    try {
      const provinces = vn.getProvinces();
      res.status(200).json({ success: true, data: provinces });
    } catch (error) {
      console.error('Error getting provinces:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách quận/huyện theo tỉnh
  async getDistricts(req, res) {
    try {
      const { provinceId } = req.params;
      const districts = vn.getDistrictsByProvinceCode(provinceId);
      res.status(200).json({ success: true, data: districts });
    } catch (error) {
      console.error('Error getting districts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách phường/xã theo quận/huyện
  async getWards(req, res) {
    try {
      const { districtId } = req.params;
      const wards = vn.getWardsByDistrictCode(districtId);
      res.status(200).json({ success: true, data: wards });
    } catch (error) {
      console.error('Error getting wards:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AddressController();
