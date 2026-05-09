import { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Tag, Plus, Trash2, X, Check, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';

const API = '/api/vouchers';

const EMPTY = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minOrderValue: '', maxDiscountAmount: '', maxUses: '', expiresAt: '',
};

const VoucherManage = () => {
  const { user } = useContext(AuthContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, { withCredentials: true });
      setVouchers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVouchers(); }, []);

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const openModal = () => { setForm(EMPTY); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(API, {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
        maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || null,
      }, { withCredentials: true });
      setModal(false);
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this voucher?')) return;
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      fetchVouchers();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const isExpired = (v) => v.expiresAt && new Date(v.expiresAt) < new Date();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="text-green-600" /> Voucher Management
        </h1>
        <button onClick={openModal} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          <Plus size={15} /> New Voucher
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Code','Type','Value','Min Order','Uses','Expires','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vouchers.map(v => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-green-700 tracking-wider">{v.code}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{v.discountType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {v.discountType === 'percentage' ? `${v.discountValue}%` : `Rs ${v.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">Rs {v.minOrderValue || 0}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.usedCount}{v.maxUses > 0 ? ` / ${v.maxUses}` : ' / ∞'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isExpired(v) ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Expired</span>
                    ) : v.isActive ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <ToggleRight size={12} /> Active
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <ToggleLeft size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(v._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-400">No vouchers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-gray-800">New Voucher</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={save} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Code *</label>
                  <input value={form.code} onChange={setField('code')} placeholder="SAVE20" required className="px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:border-green-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type *</label>
                  <select value={form.discountType} onChange={setField('discountType')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (Rs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Value * {form.discountType === 'percentage' ? '(%)' : '(Rs)'}
                  </label>
                  <input type="number" min="0" value={form.discountValue} onChange={setField('discountValue')} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Min Order (Rs)</label>
                  <input type="number" min="0" value={form.minOrderValue} onChange={setField('minOrderValue')} placeholder="0 = none" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Discount (Rs)</label>
                  <input type="number" min="0" value={form.maxDiscountAmount} onChange={setField('maxDiscountAmount')} placeholder="0 = no cap" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Uses</label>
                  <input type="number" min="0" value={form.maxUses} onChange={setField('maxUses')} placeholder="0 = unlimited" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={setField('expiresAt')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                <input value={form.description} onChange={setField('description')} placeholder="Brief description..." className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> {saving ? 'Saving...' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManage;
