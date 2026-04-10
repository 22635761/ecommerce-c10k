import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  UserCircleIcon, KeyIcon, ClipboardDocumentListIcon,
  CheckCircleIcon, ExclamationCircleIcon, PencilSquareIcon
} from '@heroicons/react/24/outline';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// ─── Thông báo toast nhỏ ──────────────────────────────────────────────────
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const isOk = type === 'success';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mb-5 ${
      isOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
    }`}>
      {isOk
        ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
        : <ExclamationCircleIcon className="w-5 h-5 shrink-0" />}
      {msg}
    </div>
  );
};

// ─── Field component ─────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${
      props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-800 border-gray-200'
    } ${props.className || ''}`}
  />
);

// ─── Tab Thông tin cá nhân ────────────────────────────────────────────────
const InfoTab = ({ user, onSaved }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    birthday: user?.birthday ? user.birthday.slice(0, 10) : ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT', headers: authHeader(), body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cập nhật thành công!', 'success');
        onSaved?.(data.data);
      } else {
        showToast(data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Toast msg={toast.msg} type={toast.type} />

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {(form.name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800">{form.name || 'Chưa có tên'}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Họ và tên">
          <Input
            type="text" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Nhập họ và tên"
          />
        </Field>
        <Field label="Email">
          <Input type="email" value={user?.email || ''} disabled />
        </Field>
        <Field label="Số điện thoại">
          <Input
            type="tel" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="Nhập số điện thoại"
          />
        </Field>
        <Field label="Ngày sinh">
          <Input
            type="date" value={form.birthday}
            onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Giới tính">
        <div className="flex gap-4">
          {['male', 'female', 'other'].map(g => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio" name="gender" value={g}
                checked={form.gender === g}
                onChange={() => setForm(p => ({ ...p, gender: g }))}
                className="accent-emerald-600"
              />
              <span className="text-sm text-gray-700">
                {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <button
        type="submit" disabled={loading}
        className="w-full sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  );
};

// ─── Tab Đổi mật khẩu ────────────────────────────────────────────────────
const PasswordTab = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return showToast('Mật khẩu xác nhận không khớp', 'error');
    }
    if (form.newPassword.length < 6) {
      return showToast('Mật khẩu mới phải ít nhất 6 ký tự', 'error');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đổi mật khẩu thành công!', 'success');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Toast msg={toast.msg} type={toast.type} />
      <Field label="Mật khẩu hiện tại">
        <Input
          type="password" value={form.currentPassword} required
          onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
          placeholder="Nhập mật khẩu hiện tại"
        />
      </Field>
      <Field label="Mật khẩu mới">
        <Input
          type="password" value={form.newPassword} required
          onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
          placeholder="Ít nhất 6 ký tự"
        />
      </Field>
      <Field label="Xác nhận mật khẩu mới">
        <Input
          type="password" value={form.confirmPassword} required
          onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="Nhập lại mật khẩu mới"
        />
      </Field>

      {/* Strength hint */}
      {form.newPassword.length > 0 && (
        <div className="space-y-1">
          {[
            { ok: form.newPassword.length >= 6, text: 'Ít nhất 6 ký tự' },
            { ok: /[A-Z]/.test(form.newPassword), text: 'Có chữ hoa' },
            { ok: /[0-9]/.test(form.newPassword), text: 'Có số' },
          ].map(r => (
            <p key={r.text} className={`text-xs flex items-center gap-1 ${r.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
              {r.ok ? '✓' : '○'} {r.text}
            </p>
          ))}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
      </button>
    </form>
  );
};

// ─── TABS config ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'info',     label: 'Thông tin cá nhân',  icon: UserCircleIcon },
  { id: 'password', label: 'Đổi mật khẩu',       icon: KeyIcon },
  { id: 'orders',   label: 'Đơn mua',            icon: ClipboardDocumentListIcon },
];

// ─── Main page ────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/auth/profile`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) setProfileData(d.data); })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const displayUser = profileData || user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-emerald-600">Trang chủ</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600 font-medium">Tài khoản của tôi</span>
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* ── Sidebar tabs ── */}
        <aside className="md:w-56 shrink-0">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-black mx-auto mb-2 shadow">
              {(displayUser?.name || displayUser?.email || '?')[0].toUpperCase()}
            </div>
            <p className="font-bold text-gray-800 text-sm truncate">{displayUser?.name || 'Chưa có tên'}</p>
            <p className="text-xs text-gray-400 truncate">{displayUser?.email}</p>
          </div>

          {/* Tab list */}
          <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-left transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content area ── */}
        <main className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            {(() => {
              const tab = TABS.find(t => t.id === activeTab);
              return (
                <>
                  <tab.icon className="w-5 h-5 text-emerald-600" />
                  <h1 className="text-lg font-bold text-gray-800">{tab.label}</h1>
                </>
              );
            })()}
          </div>

          {loadingProfile && activeTab === 'info' ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'info' && (
                <InfoTab
                  user={displayUser}
                  onSaved={data => {
                    setProfileData(data);
                    updateProfile?.(data);
                  }}
                />
              )}
              {activeTab === 'password' && <PasswordTab />}
              {activeTab === 'orders' && (
                  <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-semibold mb-3">Xem lịch sử đơn hàng của bạn</p>
                  <Link
                    to="/profile/orders"
                    className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
                  >
                    Đến trang Đơn mua
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
