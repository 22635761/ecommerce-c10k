/**
 * useAddressBook — Quản lý sổ địa chỉ cá nhân (localStorage, keyed by userId)
 * - Tự động đọc địa chỉ đã lưu khi login
 * - Lưu địa chỉ mới sau mỗi lần checkout thành công
 * - Hỗ trợ set địa chỉ mặc định
 */
import { useState, useEffect, useCallback } from 'react';

const MAX_ADDRESSES = 5; // Giới hạn tối đa
const KEY = (userId) => `address_book_${userId || 'guest'}`;

const load = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(KEY(userId)) || '[]');
  } catch { return []; }
};

const save = (userId, list) => {
  localStorage.setItem(KEY(userId), JSON.stringify(list));
};

export const useAddressBook = (userId) => {
  const [addresses, setAddresses] = useState([]);

  // Load khi userId thay đổi (login/logout)
  useEffect(() => {
    setAddresses(load(userId));
  }, [userId]);

  /**
   * Lưu địa chỉ mới (gọi sau khi checkout thành công)
   * Tự động set là mặc định nếu chưa có gì
   */
  const saveAddress = useCallback((addr) => {
    if (!addr.address || !addr.province) return;

    setAddresses(prev => {
      const current = load(userId);
      const id = `addr_${Date.now()}`;
      const isFirst = current.length === 0;

      const newAddr = {
        id,
        customerName: addr.customerName || '',
        phone: addr.phone || '',
        email: addr.email || '',
        address: addr.address || '',
        ward: addr.ward || '',
        district: addr.district || '',
        province: addr.province || '',
        wardCode: addr.wardCode || '',
        districtCode: addr.districtCode || '',
        provinceCode: addr.provinceCode || '',
        ghnDistrictId: addr.ghnDistrictId || null,
        ghnWardCode: addr.ghnWardCode || null,
        note: addr.note || '',
        isDefault: isFirst, // Địa chỉ đầu tiên = mặc định
        savedAt: new Date().toISOString(),
      };

      // Kiểm tra trùng (cùng địa chỉ + phường + huyện)
      const isDuplicate = current.some(
        a => a.address === newAddr.address &&
             a.ward === newAddr.ward &&
             a.district === newAddr.district
      );
      if (isDuplicate) return current;

      // Giữ tối đa MAX_ADDRESSES, xóa bản cũ nhất (không phải default)
      let updated = [newAddr, ...current];
      if (updated.length > MAX_ADDRESSES) {
        const nonDefaultIdx = updated.findLastIndex(a => !a.isDefault);
        if (nonDefaultIdx !== -1) updated.splice(nonDefaultIdx, 1);
        else updated = updated.slice(0, MAX_ADDRESSES);
      }

      save(userId, updated);
      return updated;
    });
  }, [userId]);

  /**
   * Đặt địa chỉ làm mặc định
   */
  const setDefault = useCallback((addrId) => {
    setAddresses(prev => {
      const updated = prev.map(a => ({ ...a, isDefault: a.id === addrId }));
      save(userId, updated);
      return updated;
    });
  }, [userId]);

  /**
   * Xóa địa chỉ
   */
  const removeAddress = useCallback((addrId) => {
    setAddresses(prev => {
      const updated = prev.filter(a => a.id !== addrId);
      // Nếu xóa default, set lại default cho bản đầu tiên còn lại
      if (!updated.some(a => a.isDefault) && updated.length > 0) {
        updated[0].isDefault = true;
      }
      save(userId, updated);
      return updated;
    });
  }, [userId]);

  /**
   * Lấy địa chỉ mặc định
   */
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  return { addresses, defaultAddress, saveAddress, setDefault, removeAddress };
};
