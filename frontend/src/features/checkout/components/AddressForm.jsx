import React, { useState, useEffect, useRef } from 'react';
import {
  MapPinIcon, XMarkIcon, MagnifyingGlassIcon, CheckCircleIcon,
  ChevronRightIcon, StarIcon, TrashIcon, PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const GOONG_KEY = '4aFVnvVD9eoiKWGzmjIlEYsiKDoOa57603HrD0qu';

// ─── Geocoding ────────────────────────────────────────────────────────────────
const geocodeText = async (text) => {
  if (!text) return null;
  const q = encodeURIComponent(text + ', Việt Nam');
  try {
    if (GOONG_KEY) {
      const r = await fetch(`https://rsapi.goong.io/geocode?address=${q}&api_key=${GOONG_KEY}`);
      const d = await r.json();
      const loc = d.results?.[0]?.geometry?.location;
      if (loc) return { lat: loc.lat, lng: loc.lng };
    }
    const r = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=1&lang=vi`);
    const d = await r.json();
    const f = d.features?.[0];
    if (f) return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
  } catch {}
  return null;
};

const searchPlaces = async (query, ward, district, province) => {
  if (!query || query.length < 2) return [];
  const context = [ward, district, province].filter(Boolean).join(', ');
  const q = encodeURIComponent(`${query}, ${context}, Việt Nam`);
  const results = [];
  try {
    if (GOONG_KEY) {
      const r = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_KEY}&input=${q}&radius=5000`);
      const d = await r.json();
      for (const item of (d.predictions || []).slice(0, 6)) {
        results.push({
          id: item.place_id,
          primary: item.structured_formatting?.main_text || item.description.split(',')[0],
          secondary: item.structured_formatting?.secondary_text || item.description.split(',').slice(1).join(',').trim(),
          placeId: item.place_id,
          source: 'goong', lat: null, lng: null,
        });
      }
    }
    if (results.length < 4) {
      const r2 = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=5&lang=vi`);
      const d2 = await r2.json();
      for (const f of (d2.features || [])) {
        const p = f.properties;
        const primary = [p.name, p.housenumber].filter(Boolean).join(' ');
        if (!primary) continue;
        results.push({
          id: `p-${f.geometry.coordinates.join(',')}`,
          primary, secondary: [p.street, p.city || p.state].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], source: 'photon',
        });
      }
    }
  } catch {}
  const seen = new Set();
  return results.filter(r => {
    if (!r.lat && !r.lng) return true;
    const key = `${Math.round(r.lat * 1000)},${Math.round(r.lng * 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 7);
};

const resolveGoongCoords = async (placeId) => {
  if (!GOONG_KEY || !placeId) return null;
  try {
    const r = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${GOONG_KEY}`);
    const d = await r.json();
    const loc = d.result?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch { return null; }
};

// ─── LeafletMap ───────────────────────────────────────────────────────────────
const LeafletMap = ({ lat, lng, label }) => {
  const divRef = useRef(null);
  const inst = useRef({ map: null, marker: null });

  useEffect(() => {
    const tryInit = () => {
      if (!divRef.current) return;
      if (!window.L) { setTimeout(tryInit, 200); return; }
      if (inst.current.map) return;
      const map = window.L.map(divRef.current, { center: [10.7769, 106.7009], zoom: 12, zoomControl: true, scrollWheelZoom: false });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#ee4d2d;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,.4)"></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28],
      });
      inst.current = { map, marker: window.L.marker([10.7769, 106.7009], { icon }).addTo(map) };
      setTimeout(() => map.invalidateSize(), 200);
    };
    tryInit();
    return () => { if (inst.current.map) { inst.current.map.remove(); inst.current = { map: null, marker: null }; } };
  }, []);

  useEffect(() => {
    const { map, marker } = inst.current;
    if (!map || !marker || !lat || !lng) return;
    const pos = [lat, lng];
    map.flyTo(pos, 16, { animate: true, duration: 0.8 });
    marker.setLatLng(pos);
    if (label) marker.bindPopup(`<div style="font-size:12px;font-weight:600;max-width:200px">📍 ${label}</div>`, { maxWidth: 220 }).openPopup();
  }, [lat, lng, label]);

  return <div ref={divRef} style={{ height: 200, borderRadius: 12, overflow: 'hidden', zIndex: 0 }} className="w-full border border-gray-200" />;
};

// ─── SavedAddressCard ─────────────────────────────────────────────────────────
const SavedAddressCard = ({ addr, isSelected, onSelect, onSetDefault, onDelete }) => (
  <div
    onClick={onSelect}
    className={`relative flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
      isSelected ? 'border-[#ee4d2d] bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
    }`}
  >
    {addr.isDefault && (
      <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 bg-[#ee4d2d] text-white rounded-sm">Mặc định</span>
    )}
    <div className="flex items-center gap-2 pr-16">
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#ee4d2d]' : 'border-gray-300'}`}>
        {isSelected && <div className="w-2 h-2 rounded-full bg-[#ee4d2d]" />}
      </div>
      <span className="font-bold text-gray-800 text-sm">{addr.customerName}</span>
      <span className="text-gray-400 text-xs">· {addr.phone}</span>
    </div>
    <p className="text-xs text-gray-500 line-clamp-2 pl-6">
      {addr.address}, {addr.ward}, {addr.district}, {addr.province}
    </p>
    <div className="flex items-center gap-3 pl-6 mt-1">
      {!addr.isDefault && (
        <button type="button" onClick={e => { e.stopPropagation(); onSetDefault(addr.id); }}
          className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
          <StarIcon className="w-3 h-3" /> Đặt mặc định
        </button>
      )}
      <button type="button" onClick={e => { e.stopPropagation(); onDelete(addr.id); }}
        className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-0.5">
        <TrashIcon className="w-3 h-3" /> Xóa
      </button>
    </div>
  </div>
);

// ─── Main AddressForm ─────────────────────────────────────────────────────────
const AddressForm = ({
  formData, handleChange, handleProvinceChange, handleDistrictChange, handleWardChange,
  provinces, districts, wards, loadingAddress,
  // Address book props (từ CheckoutPage)
  savedAddresses = [], onSetDefault, onDeleteAddress, onSelectSavedAddress,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streetQuery, setStreetQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: 10.7769, lng: 106.7009 });
  const [mapLabel, setMapLabel] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showAddressBook, setShowAddressBook] = useState(false);

  const suggestRef = useRef(null);
  const debounceRef = useRef(null);

  const hasFilledAddress = !!(formData.customerName && formData.phone && formData.province && formData.address);

  // Geocode khi province/district/ward thay đổi
  useEffect(() => {
    if (!formData.province) return;
    geocodeText(formData.province).then(c => { if (c) { setMapCoords(c); setMapLabel(formData.province); } });
  }, [formData.province]);

  useEffect(() => {
    if (!formData.district) return;
    geocodeText([formData.district, formData.province].filter(Boolean).join(', '))
      .then(c => { if (c) { setMapCoords(c); setMapLabel(`${formData.district}, ${formData.province}`); } });
  }, [formData.district]);

  useEffect(() => {
    if (!formData.ward) return;
    geocodeText([formData.ward, formData.district, formData.province].filter(Boolean).join(', '))
      .then(c => { if (c) { setMapCoords(c); setMapLabel([formData.address, formData.ward, formData.district, formData.province].filter(Boolean).join(', ')); setStreetQuery(''); setSelectedSuggestion(null); } });
  }, [formData.ward]);

  // Debounce street search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!streetQuery || streetQuery.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      const res = await searchPlaces(streetQuery, formData.ward, formData.district, formData.province);
      setSuggestions(res); setShowSuggestions(res.length > 0); setLoadingSuggestions(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [streetQuery, formData.ward, formData.district, formData.province]);

  useEffect(() => {
    const fn = e => { if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSelectSuggestion = async (item) => {
    setShowSuggestions(false);
    setStreetQuery(item.primary);
    setSelectedSuggestion(item);
    handleChange({ target: { name: 'address', value: [item.primary, item.secondary].filter(Boolean).join(', ') } });
    let coords = item.lat && item.lng ? { lat: item.lat, lng: item.lng } : null;
    if (!coords && item.placeId) coords = await resolveGoongCoords(item.placeId);
    if (!coords) coords = await geocodeText(`${item.primary}, ${formData.district}, ${formData.province}`);
    if (coords) { setMapCoords(coords); setMapLabel([item.primary, item.secondary].filter(Boolean).join(', ')); }
  };

  // Chọn địa chỉ từ sổ đã lưu
  const handlePickSaved = (addr) => {
    onSelectSavedAddress(addr);
    setStreetQuery(addr.address || '');
    setSelectedSuggestion(null);
    setShowAddressBook(false);
    setIsModalOpen(false);
    // Geocode để cập nhật map
    geocodeText([addr.address, addr.ward, addr.district, addr.province].filter(Boolean).join(', '))
      .then(c => { if (c) { setMapCoords(c); setMapLabel([addr.address, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')); } });
  };

  const handleConfirm = () => {
    if (!formData.customerName || !formData.phone || !formData.province || !formData.address) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!'); return;
    }
    setIsModalOpen(false);
  };

  const openModal = () => { setStreetQuery(formData.address || ''); setIsModalOpen(true); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#ee4d2d,#ee4d2d 10px,#f5a623 0,#f5a623 20px)', backgroundSize: '28px 4px' }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPinIcon className="w-5 h-5 text-[#ee4d2d]" />
          <h2 className="text-base font-bold text-[#ee4d2d]">Địa Chỉ Nhận Hàng</h2>
          {savedAddresses.length > 0 && (
            <button onClick={() => setShowAddressBook(!showAddressBook)}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              <StarSolid className="w-3.5 h-3.5 text-yellow-400" />
              Địa chỉ đã lưu ({savedAddresses.length})
            </button>
          )}
        </div>

        {/* Sổ địa chỉ đã lưu */}
        {showAddressBook && savedAddresses.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Chọn địa chỉ đã lưu</p>
            {savedAddresses.map(addr => (
              <SavedAddressCard
                key={addr.id} addr={addr}
                isSelected={formData.address === addr.address && formData.province === addr.province}
                onSelect={() => handlePickSaved(addr)}
                onSetDefault={onSetDefault}
                onDelete={onDeleteAddress}
              />
            ))}
            <button onClick={() => { setShowAddressBook(false); openModal(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition">
              <PlusIcon className="w-4 h-4" /> Thêm địa chỉ mới
            </button>
          </div>
        )}

        {!showAddressBook && (
          hasFilledAddress ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-bold text-gray-900">{formData.customerName}</span>
                  <span className="text-gray-500 text-sm border-l border-gray-300 pl-3">{formData.phone}</span>
                  <span className="text-[11px] px-1.5 py-0.5 border border-[#ee4d2d] text-[#ee4d2d] rounded-sm">Mặc định</span>
                </div>
                <p className="text-gray-600 text-sm truncate">{formData.address}, {formData.ward}, {formData.district}, {formData.province}</p>
              </div>
              <button onClick={openModal} className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap flex items-center gap-0.5">
                Thay đổi <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-700">Bạn chưa có địa chỉ nhận hàng.</p>
              <button onClick={openModal} className="bg-[#ee4d2d] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d73d22] transition">
                + Thêm địa chỉ
              </button>
            </div>
          )
        )}
      </div>

      {/* ─── MODAL ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '92vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Địa chỉ nhận hàng</h3>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-700" /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Họ tên + SĐT */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-500">Họ và tên</label>
                  <input type="text" name="customerName" placeholder="Nguyễn Văn A" value={formData.customerName || ''} onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]/30 outline-none" />
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-500">Số điện thoại</label>
                  <input type="tel" name="phone" placeholder="09xxxxxxxx" value={formData.phone || ''} onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:border-[#ee4d2d] outline-none" />
                </div>
              </div>

              {/* Tỉnh / Huyện / Xã */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-500 z-10">
                  Tỉnh, Huyện, Xã {loadingAddress && <span className="text-[#ee4d2d] animate-pulse">•</span>}
                </label>
                <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#ee4d2d] transition">
                  <select name="provinceCode" value={formData.provinceCode || ''} onChange={handleProvinceChange}
                    className="px-3 py-3 border-r border-gray-200 text-sm bg-white outline-none focus:bg-orange-50">
                    <option value="">Tỉnh/Thành</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                  <select name="districtCode" value={formData.districtCode || ''} onChange={handleDistrictChange}
                    disabled={!formData.provinceCode || loadingAddress}
                    className="px-3 py-3 border-r border-gray-200 text-sm bg-white outline-none disabled:bg-gray-50 disabled:text-gray-300">
                    <option value="">Quận/Huyện</option>
                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                  <select name="wardCode" value={formData.wardCode || ''} onChange={handleWardChange}
                    disabled={!formData.districtCode || loadingAddress}
                    className="px-3 py-3 text-sm bg-white outline-none disabled:bg-gray-50 disabled:text-gray-300">
                    <option value="">Phường/Xã</option>
                    {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Street autocomplete */}
              <div ref={suggestRef} className="relative">
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-500 z-10">Tên đường, Số nhà, Toà nhà</label>
                  <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-[#ee4d2d] focus-within:ring-1 focus-within:ring-[#ee4d2d]/30 overflow-hidden">
                    <input type="text" placeholder="VD: 123 Lê Lợi..."
                      value={streetQuery}
                      onChange={e => { setStreetQuery(e.target.value); handleChange({ target: { name: 'address', value: e.target.value } }); if (e.target.value.length < 2) setShowSuggestions(false); }}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                    />
                    {loadingSuggestions
                      ? <div className="w-4 h-4 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin mr-3" />
                      : streetQuery
                        ? <button onClick={() => { setStreetQuery(''); setSuggestions([]); setShowSuggestions(false); handleChange({ target: { name: 'address', value: '' } }); }}
                          className="text-gray-300 hover:text-gray-500 mr-3"><XMarkIcon className="w-4 h-4" /></button>
                        : <MagnifyingGlassIcon className="w-4 h-4 text-gray-300 mr-3" />
                    }
                  </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden" style={{ top: '100%', marginTop: 4 }}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <MapPinIcon className="w-3.5 h-3.5 text-[#ee4d2d]" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{suggestions.length} vị trí được tìm thấy</span>
                    </div>
                    {suggestions.map(item => (
                      <button key={item.id} type="button" onClick={() => handleSelectSuggestion(item)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 text-left border-b border-gray-50 last:border-0 group transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                          <MapPinIcon className="w-4 h-4 text-gray-400 group-hover:text-[#ee4d2d] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 line-clamp-1 group-hover:text-[#ee4d2d]">{item.primary}</p>
                          {item.secondary && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.secondary}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedSuggestion && !showSuggestions && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    <span>Đã ghim: <strong>{selectedSuggestion.primary}</strong></span>
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-500">Ghi chú</label>
                <textarea name="note" rows={2} placeholder="Giao giờ hành chính, gọi trước 30 phút..."
                  value={formData.note || ''} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-[#ee4d2d] outline-none resize-none" />
              </div>

              {/* Bản đồ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">Xác nhận vị trí</span>
                  {mapLabel && <span className="text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Đã xác định</span>}
                </div>
                <LeafletMap lat={mapCoords.lat} lng={mapCoords.lng} label={mapLabel} />
                {mapLabel && <p className="text-xs text-gray-400 mt-1 line-clamp-1">📍 {mapLabel}</p>}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-medium transition">
                Hủy bỏ
              </button>
              <button onClick={handleConfirm}
                className="px-8 py-2.5 rounded-xl bg-[#ee4d2d] text-white hover:bg-[#d73d22] text-sm font-bold transition shadow-sm">
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
