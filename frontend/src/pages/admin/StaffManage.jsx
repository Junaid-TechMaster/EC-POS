// frontend/src/pages/admin/StaffManage.jsx
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Plus, Eye, Trash2, Edit2, X, Save,
  UserCheck, Shield, CheckSquare, Square, Mail, Lock, User,
} from 'lucide-react';

const API = '/api/users';

const STAFF_PERMISSIONS = [
  { key: 'pos_sales',        label: 'POS Terminal',        desc: 'Process in-store sales' },
  { key: 'view_orders',      label: 'View Orders',         desc: 'Browse all customer orders' },
  { key: 'manage_products',  label: 'Manage Products',     desc: 'Edit products and stock levels' },
  { key: 'view_reports',     label: 'View Reports',        desc: 'Access stats and analytics' },
  { key: 'manage_customers', label: 'Manage Customers',    desc: 'Customer and vendor management' },
  { key: 'manage_inventory', label: 'Manage Inventory',    desc: 'Purchases, returns, stock' },
];

const Avatar = ({ name, size = 'md' }) => {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const PermissionBadge = ({ perm }) => {
  const meta = STAFF_PERMISSIONS.find(p => p.key === perm);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
      {meta?.label || perm}
    </span>
  );
};

const StaffManage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') navigate('/login');
  }, [currentUser, navigate]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}?roles=staff,admin`, { withCredentials: true });
      setStaffList(Array.isArray(data) ? data : []);
    } catch {
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const togglePermission = (key) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const selectAllPermissions = () => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.length === STAFF_PERMISSIONS.length
        ? []
        : STAFF_PERMISSIONS.map(p => p.key),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/staff`, form, { withCredentials: true });
      setFormSuccess(`Staff account created! OTP has been sent to ${form.email}.`);
      setForm({ name: '', email: '', password: '', permissions: [] });
      fetchStaff();
      setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openModal = () => {
    setForm({ name: '', email: '', password: '', permissions: [] });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <UserCheck size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-sm text-gray-500">
              {staffList.filter(s => s.role === 'admin').length} admin · {staffList.filter(s => s.role === 'staff').length} staff
            </p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> Add New Staff
        </button>
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-green-600 font-semibold">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-3" />
          Loading staff...
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck size={28} className="text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-2">No staff members yet</p>
          <p className="text-sm text-gray-400 mb-5">Create your first staff account to get started.</p>
          <button onClick={openModal} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <Plus size={14} className="inline mr-1" /> Add New Staff
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Staff Member</div>
            <div className="col-span-5">Permissions</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {staffList.map(s => (
            <div key={s._id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50 transition-colors">
              {/* Name + email */}
              <div className="col-span-3 flex items-center gap-3">
                <Avatar name={s.name} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
              </div>

              {/* Permissions */}
              <div className="col-span-5 flex flex-wrap gap-1.5">
                {s.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2 py-0.5">
                    <Shield size={10} /> Full Access
                  </span>
                ) : s.permissions?.length > 0 ? (
                  s.permissions.map(p => <PermissionBadge key={p} perm={p} />)
                ) : (
                  <span className="text-xs text-gray-400 italic">No permissions set</span>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2">
                {s.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1">
                    Admin
                  </span>
                ) : s.isVerified === false ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                    Pending Setup
                  </span>
                ) : s.mustChangePassword ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                    Set Password
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                    Active
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Link
                  to={s.role === 'admin' ? `/admin/user/${s._id}/edit` : `/admin/staff/${s._id}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-colors"
                  title={s.role === 'admin' ? 'Edit admin' : 'View'}
                >
                  {s.role === 'admin' ? <Edit2 size={15} /> : <Eye size={15} />}
                </Link>
                {s.role !== 'admin' && (
                  <Link
                    to={`/admin/user/${s._id}/edit`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-500 transition-colors"
                    title="Edit permissions"
                  >
                    <Edit2 size={15} />
                  </Link>
                )}
                {s._id !== currentUser?._id && s.role !== 'admin' && (
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Staff Modal ────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Create Staff Account</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{formError}</div>
              )}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{formSuccess}</div>
              )}

              {/* Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5 block">
                  <User size={14} /> Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ahmed Ali"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5 block">
                  <Mail size={14} /> Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">A verification OTP will be sent to this email.</p>
              </div>

              {/* Temporary password */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5 block">
                  <Lock size={14} /> Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="e.g. 1234asdf"
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <span className="text-xs">Hide</span> : <span className="text-xs">Show</span>}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Staff will be forced to set their own password after first login.</p>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Shield size={14} /> Feature Access
                  </label>
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-xs text-green-600 hover:underline font-medium"
                  >
                    {form.permissions.length === STAFF_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {STAFF_PERMISSIONS.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => togglePermission(key)}
                        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          form.permissions.includes(key)
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        <CheckSquare size={12} className={form.permissions.includes(key) ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={15} /> {saving ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Staff Account?</h3>
                <p className="text-sm text-gray-500">{deleteTarget.name} ({deleteTarget.email})</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">This account will be permanently deleted. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget._id)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManage;
