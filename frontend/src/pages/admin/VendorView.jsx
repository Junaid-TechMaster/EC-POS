import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar,
  Trash2, Plus, TrendingUp, Package, ShoppingCart, Clock, ChevronDown, ChevronRight,
} from 'lucide-react';

const API = '/api';

const AVATAR_COLORS = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500'];

const VendorAvatar = ({ name, size = 'lg' }) => {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-full ${color} flex items-center justify-center text-white font-bold border-4 border-white shadow-md`}>
      {initials}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-gray-100">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} mb-1`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
};

const VendorView = () => {
  const { id } = useParams();
  const { user: adminUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Notes
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') navigate('/login');
  }, [adminUser, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vendorRes, purchasesRes] = await Promise.all([
          axios.get(`${API}/people/vendors/${id}`, { withCredentials: true }),
          axios.get(`${API}/transactions/purchases?vendorId=${id}`, { withCredentials: true }),
        ]);
        setVendor(vendorRes.data);
        setNotes(vendorRes.data.notes || []);
        setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      const { data } = await axios.post(`${API}/people/vendors/${id}/notes`, { text: noteText }, { withCredentials: true });
      setNotes(data);
      setNoteText('');
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setNoteSaving(false); }
  };

  const deleteNote = async (noteId) => {
    try {
      const { data } = await axios.delete(`${API}/people/vendors/${id}/notes/${noteId}`, { withCredentials: true });
      setNotes(data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const fmt = (v) => `Rs ${Number(v || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const timeAgo = (d) => {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-24">
        <Building2 size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-semibold">Vendor not found</p>
        <Link to="/admin/pos-people" className="mt-4 inline-flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
          <ArrowLeft size={14} /> Back to POS People
        </Link>
      </div>
    );
  }

  const totalCost = purchases.reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalItems = purchases.reduce((s, p) => s + (p.items?.length || 0), 0);
  const lastPurchase = purchases[0]?.createdAt;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/pos-people" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Back to POS People
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <div className="xl:w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-indigo-400 to-purple-500" />
            <div className="px-5 pb-5 -mt-10">
              <VendorAvatar name={vendor.name} size="lg" />
              <div className="mt-3">
                <h1 className="text-xl font-extrabold text-gray-900">{vendor.name}</h1>
                {vendor.company && (
                  <p className="text-sm text-indigo-600 font-semibold mt-0.5">{vendor.company}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Added {timeAgo(vendor.createdAt)}</p>
                <div className="mt-2">
                  <span className="flex items-center gap-1 text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full w-fit">
                    <Building2 size={11} /> Vendor
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Purchases" value={purchases.length} icon={ShoppingCart} color="bg-indigo-500" />
            <StatCard label="Total Items" value={totalItems} icon={Package} color="bg-purple-500" />
            <StatCard label="Total Cost" value={fmt(totalCost)} icon={TrendingUp} color="bg-green-500" />
            <StatCard label="Last Purchase" value={lastPurchase ? fmtDate(lastPurchase) : 'Never'} icon={Clock} color="bg-orange-500" />
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="flex flex-col gap-3">
              {vendor.email && (
                <div className="flex items-start gap-3">
                  <Mail size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 hover:underline break-all">{vendor.email}</a>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{vendor.phone}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{vendor.address}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Added {fmtDate(vendor.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Notes</h3>
            <form onSubmit={addNote} className="mb-3">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note about this vendor…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                type="submit"
                disabled={noteSaving || !noteText.trim()}
                className="mt-2 w-full flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50 transition-colors"
              >
                <Plus size={14} /> {noteSaving ? 'Saving…' : 'Add Note'}
              </button>
            </form>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No notes yet</p>
              ) : notes.map(n => (
                <div key={n._id} className="bg-gray-50 rounded-xl p-3 relative group">
                  <p className="text-sm text-gray-700 pr-6">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(n.createdAt)} · {n.addedBy}</p>
                  <button
                    onClick={() => deleteNote(n._id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-indigo-500" /> Purchase History
              </h2>
              <span className="text-sm text-gray-400">{fmt(totalCost)} total</span>
            </div>

            {purchases.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Package size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No purchases recorded for this vendor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 w-8"></th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {purchases.map(p => (
                      <>
                        <tr
                          key={p._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === p._id ? null : p._id)}
                        >
                          <td className="px-5 py-3.5 text-gray-400">
                            {expandedRow === p._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {fmtDate(p.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700">{p.items?.length || 0} item(s)</td>
                          <td className="px-5 py-3.5 text-right font-bold text-gray-900">{fmt(p.totalCost)}</td>
                        </tr>
                        {expandedRow === p._id && (
                          <tr key={`${p._id}-expanded`} className="bg-indigo-50/40">
                            <td colSpan={4} className="px-8 py-3">
                              <div className="flex flex-col gap-1.5">
                                {p.items?.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <Package size={13} className="text-indigo-400 flex-shrink-0" />
                                      <span className="text-gray-700 font-medium">{item.product?.name || 'Product'}</span>
                                      <span className="text-gray-400">×{item.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      {item.costPrice > 0 && <span>Cost: {fmt(item.costPrice)}</span>}
                                      <span className="font-semibold text-gray-700">{fmt((item.costPrice || 0) * item.qty)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Total Procurement Cost</td>
                      <td className="px-5 py-3 text-right font-bold text-indigo-700">{fmt(totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorView;
