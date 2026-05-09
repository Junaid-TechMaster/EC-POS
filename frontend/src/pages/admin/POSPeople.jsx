import { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Users, Building2, Plus, Pencil, Trash2, X, Check, Search, ArrowLeft, Globe, Eye } from 'lucide-react';

const AVATAR_COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];

const Avatar = ({ name, src }) => {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [imgFailed, setImgFailed] = useState(false);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const API = '/api/people';

const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '' };
const EMPTY_VENDOR   = { name: '', company: '', phone: '', email: '', address: '' };

const Input = ({ label, value, onChange, required, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}{required && ' *'}</label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || label}
      required={required}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
    />
  </div>
);

const POSPeople = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('customers');

  // Customers
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingOnlineCustomer, setEditingOnlineCustomer] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);

  // Vendors
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorModal, setVendorModal] = useState(false);

  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const fetchCustomers = async (search = '') => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await axios.get(`${API}/customers${q}`, { withCredentials: true });
      setCustomers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchVendors = async (search = '') => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await axios.get(`${API}/vendors${q}`, { withCredentials: true });
      setVendors(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); fetchVendors(); }, []);

  // ─── Customers ───────────────────────────────────────────────────────────────
  const openNewCustomer = () => {
    setEditingCustomer(null);
    setEditingOnlineCustomer(false);
    setCustomerForm(EMPTY_CUSTOMER);
    setCustomerModal(true);
  };
  const openEditCustomer = (c) => {
    setEditingCustomer(c);
    setEditingOnlineCustomer(false);
    setCustomerForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' });
    setCustomerModal(true);
  };
  const openEditOnlineCustomer = (c) => {
    setEditingCustomer(c);
    setEditingOnlineCustomer(true);
    setCustomerForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' });
    setCustomerModal(true);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer && editingOnlineCustomer) {
        // Online user — update name/phone/address via User API (no role change)
        await axios.put(
          `/api/users/${editingCustomer._id}`,
          { name: customerForm.name, phone: customerForm.phone, savedAddress: { addressLine1: customerForm.address } },
          { withCredentials: true }
        );
      } else if (editingCustomer) {
        await axios.put(`${API}/customers/${editingCustomer._id}`, customerForm, { withCredentials: true });
      } else {
        await axios.post(`${API}/customers`, customerForm, { withCredentials: true });
      }
      setCustomerModal(false);
      fetchCustomers(customerSearch);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await axios.delete(`${API}/customers/${id}`, { withCredentials: true });
      fetchCustomers(customerSearch);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const deleteOnlineCustomer = async (userId) => {
    if (!confirm('Delete this online user account? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/users/${userId}`, { withCredentials: true });
      fetchCustomers(customerSearch);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  // ─── Vendors ─────────────────────────────────────────────────────────────────
  const openNewVendor = () => { setEditingVendor(null); setVendorForm(EMPTY_VENDOR); setVendorModal(true); };
  const openEditVendor = (v) => { setEditingVendor(v); setVendorForm({ name: v.name, company: v.company, phone: v.phone || '', email: v.email || '', address: v.address || '' }); setVendorModal(true); };

  const saveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await axios.put(`${API}/vendors/${editingVendor._id}`, vendorForm, { withCredentials: true });
      } else {
        await axios.post(`${API}/vendors`, vendorForm, { withCredentials: true });
      }
      setVendorModal(false);
      fetchVendors(vendorSearch);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const deleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      await axios.delete(`${API}/vendors/${id}`, { withCredentials: true });
      fetchVendors(vendorSearch);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const setCustomerField = (field) => (val) => setCustomerForm(f => ({ ...f, [field]: val }));
  const setVendorField   = (field) => (val) => setVendorForm(f => ({ ...f, [field]: val }));

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">POS People</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('customers')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-colors ${tab === 'customers' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={16} /> Customers ({customers.length})
        </button>
        <button
          onClick={() => setTab('vendors')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-colors ${tab === 'vendors' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Building2 size={16} /> Vendors ({vendors.length})
        </button>
      </div>

      {/* ─── CUSTOMERS ─── */}
      {tab === 'customers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); fetchCustomers(e.target.value); }}
                placeholder="Search by name or phone..."
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400 w-64"
              />
            </div>
            <button onClick={openNewCustomer} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              <Plus size={15} /> Add Customer
            </button>
          </div>

          {loading ? <p className="text-gray-400 text-sm py-8 text-center">Loading...</p> : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['','Name','Phone','Email','Address','Spent',''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <Avatar name={c.name} src={c.profilePicture} />
                          {c.source === 'online' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center" title="Online customer">
                              <Globe size={9} className="text-white" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        {c.source === 'online' && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Online</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{c.address || '—'}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        Rs {(c.totalSpent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        {c.source === 'online' && (
                          <span className="block text-[10px] text-gray-400 font-normal">online orders</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end items-center">
                          <Link
                            to={`/admin/customer/${c._id}${c.source === 'online' ? '?source=online' : '?source=pos'}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="View details"
                          >
                            <Eye size={14} />
                          </Link>
                          {c.source !== 'online' ? (
                            <>
                              <button onClick={() => openEditCustomer(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Pencil size={14} /></button>
                              <button onClick={() => deleteCustomer(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openEditOnlineCustomer(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit details"><Pencil size={14} /></button>
                              <button onClick={() => deleteOnlineCustomer(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete user account"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400">No customers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── VENDORS ─── */}
      {tab === 'vendors' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={vendorSearch}
                onChange={e => { setVendorSearch(e.target.value); fetchVendors(e.target.value); }}
                placeholder="Search by name or company..."
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400 w-64"
              />
            </div>
            <button onClick={openNewVendor} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              <Plus size={15} /> Add Vendor
            </button>
          </div>

          {loading ? <p className="text-gray-400 text-sm py-8 text-center">Loading...</p> : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['','Name','Company','Phone','Email','Address',''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vendors.map(v => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Avatar name={v.name} src={null} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600">{v.company}</td>
                      <td className="px-4 py-3 text-gray-600">{v.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{v.email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{v.address || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end items-center">
                          <Link
                            to={`/admin/vendor/${v._id}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="View details"
                          >
                            <Eye size={14} />
                          </Link>
                          <button onClick={() => openEditVendor(v)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                          <button onClick={() => deleteVendor(v._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400">No vendors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Modal */}
      {customerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">
                {editingCustomer ? (editingOnlineCustomer ? 'Edit Online Customer' : 'Edit Customer') : 'New Customer'}
              </h3>
              <button onClick={() => { setCustomerModal(false); setEditingOnlineCustomer(false); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={saveCustomer} className="p-6 flex flex-col gap-4">
              <Input label="Name" value={customerForm.name} onChange={setCustomerField('name')} required />
              <Input label="Phone" value={customerForm.phone} onChange={setCustomerField('phone')} placeholder="03XX-XXXXXXX" />
              {editingOnlineCustomer ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 select-none">
                    {customerForm.email}
                    <span className="ml-2 text-[10px] text-gray-400">(login email — cannot be changed)</span>
                  </div>
                </div>
              ) : (
                <Input label="Email" value={customerForm.email} onChange={setCustomerField('email')} placeholder="email@example.com" />
              )}
              <Input label="Address" value={customerForm.address} onChange={setCustomerField('address')} placeholder="Street, City" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setCustomerModal(false); setEditingOnlineCustomer(false); }} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {vendorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h3>
              <button onClick={() => setVendorModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={saveVendor} className="p-6 flex flex-col gap-4">
              <Input label="Name" value={vendorForm.name} onChange={setVendorField('name')} required />
              <Input label="Company" value={vendorForm.company} onChange={setVendorField('company')} required />
              <Input label="Phone" value={vendorForm.phone} onChange={setVendorField('phone')} placeholder="03XX-XXXXXXX" />
              <Input label="Email" value={vendorForm.email} onChange={setVendorField('email')} />
              <Input label="Address" value={vendorForm.address} onChange={setVendorField('address')} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setVendorModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> {editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPeople;
