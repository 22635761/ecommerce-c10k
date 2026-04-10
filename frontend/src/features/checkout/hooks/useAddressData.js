import { useState, useEffect } from 'react';
import { getProvinces, getDistricts, getWards } from '../../../services/addressService';

export const useAddressData = (formData, setFormData, setShippingFee, calculateShipping) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(true);

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingAddress(true);
      const data = await getProvinces();
      setProvinces(data);
      setLoadingAddress(false);
    };
    loadProvinces();
  }, []);

  const handleProvinceChange = async (e) => {
    const selectedCode = parseInt(e.target.value);
    const selectedProvince = provinces.find(p => p.code === selectedCode);
    if (!selectedProvince) return;

    setFormData(prev => ({
      ...prev,
      province: selectedProvince.name,
      provinceCode: selectedCode,
      ghnProvinceId: selectedProvince.ghnId,
      district: '', districtCode: '', ghnDistrictId: null,
      ward: '', wardCode: '', ghnWardCode: ''
    }));
    setDistricts([]);
    setWards([]);
    if (setShippingFee) setShippingFee(0);
    setLoadingAddress(true);
    const districtData = await getDistricts(selectedCode);
    setDistricts(districtData);
    setLoadingAddress(false);
  };

  const handleDistrictChange = async (e) => {
    const selectedCode = parseInt(e.target.value);
    const selectedDistrict = districts.find(d => d.code === selectedCode);
    if (!selectedDistrict) return;

    setFormData(prev => ({
      ...prev,
      district: selectedDistrict.name,
      districtCode: selectedCode,
      ghnDistrictId: selectedDistrict.ghnId,  // GHN district id
      ward: '', wardCode: '', ghnWardCode: ''
    }));
    setWards([]);
    if (setShippingFee) setShippingFee(0);
    setLoadingAddress(true);
    const wardData = await getWards(selectedCode);
    setWards(wardData);
    setLoadingAddress(false);
  };

  // KEY FIX: sử dụng w.code (GHN WardCode string) làm value của option
  const handleWardChange = (e) => {
    const selectedWardCode = e.target.value; // GHN WardCode string e.g. "21204"
    const selectedWard = wards.find(w => w.code === selectedWardCode);
    if (!selectedWard) return;

    setFormData(prev => ({
      ...prev,
      ward: selectedWard.name,
      wardCode: selectedWard.code,
      ghnWardCode: selectedWard.ghnCode
    }));

    // Trigger GHN fee calc sau khi chọn xong phường
    if (calculateShipping && formData.ghnDistrictId) {
      calculateShipping({
        provinceName: formData.province,
        districtId: formData.ghnDistrictId,
        wardCode: selectedWard.ghnCode
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return {
    provinces, districts, wards, loadingAddress,
    handleProvinceChange, handleDistrictChange, handleWardChange, handleChange
  };
};
