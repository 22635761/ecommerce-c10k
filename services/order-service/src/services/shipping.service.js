class ShippingService {
  calculateFee(provinceName, totalWeight, totalAmount) {
    console.log('Calculating fee for province:', provinceName);
    
    const province = provinceName?.toLowerCase()?.trim() || '';
    
    // Phí theo tỉnh
    if (province.includes('hồ chí minh') || province.includes('ho chi minh')) {
      console.log('Matched: Hồ Chí Minh -> 20000');
      return 20000;
    }
    if (province.includes('hà nội') || province.includes('ha noi')) {
      console.log('Matched: Hà Nội -> 35000');
      return 35000;
    }
    if (province.includes('đà nẵng') || province.includes('da nang')) {
      console.log('Matched: Đà Nẵng -> 40000');
      return 40000;
    }
    if (province.includes('bình dương') || province.includes('binh duong')) {
      console.log('Matched: Bình Dương -> 25000');
      return 25000;
    }
    if (province.includes('đồng nai') || province.includes('dong nai')) {
      console.log('Matched: Đồng Nai -> 30000');
      return 30000;
    }
    if (province.includes('long an')) {
      console.log('Matched: Long An -> 30000');
      return 30000;
    }
    if (province.includes('cần thơ') || province.includes('can tho')) {
      console.log('Matched: Cần Thơ -> 45000');
      return 45000;
    }
    
    console.log('No match found, default 50000');
    return 50000;
  }

  calculateWeight(items) {
    return items.reduce((total, item) => total + (300 * item.quantity), 0);
  }
}

module.exports = new ShippingService();
