import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, User, Phone, Mail, Globe, CheckCircle } from 'lucide-react';
import axios from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const COUNTRIES = [
  'Pakistan', 'United States', 'United Kingdom', 'UAE', 'Saudi Arabia',
  'Canada', 'Australia', 'Germany', 'France', 'India', 'Bangladesh',
  'Turkey', 'Egypt', 'Malaysia', 'Singapore',
];

const Field = ({ label, icon: Icon, required, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
      {label}{required && ' *'}
    </label>
    <div className={`relative ${Icon ? '' : ''}`}>
      {Icon && <Icon size={15} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" />}
      {children}
    </div>
  </div>
);

const ShippingInfo = () => {
  const { user } = useContext(AuthContext);
  const { cartItems, cartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/users/address', { withCredentials: true })
      .then(({ data }) => {
        setForm({
          fullName:     data.fullName     || user?.name  || '',
          email:        user?.email       || '',
          phone:        data.phone        || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city:         data.city         || '',
          state:        data.state        || '',
          postalCode:   data.postalCode   || '',
          country:      data.country      || 'Pakistan',
        });
      })
      .catch(() => {
        setForm(f => ({ ...f, fullName: user?.name || '', email: user?.email || '' }));
      });
  }, [user, navigate]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const inputCls = (withIcon = true) =>
    `w-full ${withIcon ? 'pl-9' : 'px-4'} pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm`;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await axios.put('/api/users/address', {
        fullName:     form.fullName,
        phone:        form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city:         form.city,
        state:        form.state,
        postalCode:   form.postalCode,
        country:      form.country,
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-8 px-4">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Profile
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Information</h1>
      <p className="text-sm text-gray-500 mb-8">Your saved address is pre-filled at checkout</p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ── FORM ── */}
        <form onSubmit={handleSave} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" icon={User} required>
              <input required value={form.fullName} onChange={set('fullName')}
                placeholder="Your full name" className={inputCls(true)} />
            </Field>
            <Field label="Email" icon={Mail}>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="your@email.com" className={inputCls(true)} />
            </Field>
            <Field label="Phone" icon={Phone}>
              <input value={form.phone} onChange={set('phone')}
                placeholder="03XX-XXXXXXX" className={inputCls(true)} />
            </Field>
            <Field label="Country" icon={Globe}>
              <select value={form.country} onChange={set('country')}
                className={`${inputCls(true)} bg-white appearance-none`}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Address Line 1" icon={MapPin} required>
            <input required value={form.addressLine1} onChange={set('addressLine1')}
              placeholder="House no., Street, Area" className={inputCls(true)} />
          </Field>

          <Field label="Address Line 2" icon={MapPin}>
            <input value={form.addressLine2} onChange={set('addressLine2')}
              placeholder="Apartment, Suite, Floor (optional)" className={inputCls(true)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City" required>
              <input required value={form.city} onChange={set('city')}
                placeholder="City" className={inputCls(false)} />
            </Field>
            <Field label="State / Province">
              <input value={form.state} onChange={set('state')}
                placeholder="e.g. Punjab" className={inputCls(false)} />
            </Field>
            <Field label="Zip Code">
              <input value={form.postalCode} onChange={set('postalCode')}
                placeholder="e.g. 54000" className={inputCls(false)} />
            </Field>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          {saved && (
            <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle size={15} /> Address saved! Redirecting…
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              <Save size={16} /> {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Exit Without Saving
            </button>
          </div>
        </form>

        {/* ── SUMMARY SIDEBAR ── */}
        {cartItems.length > 0 && (
          <div className="lg:w-80 flex-shrink-0 w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Order Summary</h2>
                <span className="text-xs text-gray-400">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3 max-h-72 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">IMG</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-green-700 text-lg">{fmt(cartTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingInfo;
