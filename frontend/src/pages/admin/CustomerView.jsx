import { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Mail, Phone, MapPin, Wallet, Star, ShoppingBag,
  Globe, User, Calendar, Trash2, Plus, TrendingUp, CreditCard,
  Package, Clock, Edit, ShoppingCart, Gift,
} from 'lucide-react';

const API = '/api';

const AVATAR_COLORS = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500'];

const Avatar = ({ name, src, size = 'lg' }) => {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const [failed, setFailed] = useState(false);
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-sm';
  if (src && !failed) {
    return <img src={src} alt={name} className={`${dim} rounded-full object-cover border-4 border-white shadow-md`} onError={() => setFailed(true)} />;
  }
  return <div className={`${dim} rounded-full ${color} flex items-center justify-center text-white font-bold border-4 border-white shadow-md`}>{initials}</div>;
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

const STATUS_COLORS = {
  true: 'bg-green-100 text-green-700',
  false: 'bg-amber-100 text-amber-700',
};

const CustomerView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'pos';
  const { user: adminUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [posSales, setPosSales] = useState([]);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos');

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
        if (source === 'online') {
          const [userRes, ordersRes, posRes] = await Promise.all([
            axios.get(`${API}/users/${id}`, { withCredentials: true }),
            axios.get(`${API}/orders?userId=${id}&pageSize=100`, { withCredentials: true }),
            axios.get(`${API}/transactions/pos?customerId=${id}&limit=100`, { withCredentials: true }),
          ]);
          setCustomer({ ...userRes.data, source: 'online' });
          const ordData = ordersRes.data;
          setOnlineOrders(Array.isArray(ordData) ? ordData : ordData.orders || []);
          setPosSales(Array.isArray(posRes.data) ? posRes.data : []);
          setActiveTab('orders');
        } else {
          const [custRes, posRes] = await Promise.all([
            axios.get(`${API}/people/customers/${id}`, { withCredentials: true }),
            axios.get(`${API}/transactions/pos?customerId=${id}&limit=100`, { withCredentials: true }),
          ]);
          setCustomer(custRes.data);
          setNotes(custRes.data.notes || []);
          setPosSales(Array.isArray(posRes.data) ? posRes.data : []);
          setActiveTab('pos');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, source]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || source === 'online') return;
    setNoteSaving(true);
    try {
      const { data } = await axios.post(`${API}/people/customers/${id}/notes`, { text: noteText }, { withCredentials: true });
      setNotes(data);
      setNoteText('');
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setNoteSaving(false); }
  };

  const deleteNote = async (noteId) => {
    try {
      const { data } = await axios.delete(`${API}/people/customers/${id}/notes/${noteId}`, { withCredentials: true });
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

  if (!customer) {
    return (
      <div className="text-center py-24">
        <User size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-semibold">Customer not found</p>
        <Link to="/admin/pos-people" className="mt-4 inline-flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
          <ArrowLeft size={14} /> Back to POS People
        </Link>
      </div>
    );
  }

  const totalPosSales = posSales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
  const totalOnlineOrders = onlineOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  // Compute totalSpent from actual sales (not the stored DB value which can be stale)
  const computedTotalSpent = source === 'online'
    ? totalOnlineOrders + totalPosSales
    : totalPosSales;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/pos-people" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Back to POS People
        </Link>
        <div className="flex items-center gap-2">
          {source !== 'online' && (
            <Link
              to={`/admin/pos-people`}
              className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-600 px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              <Edit size={14} /> Edit
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <div className="xl:w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-green-400 to-teal-500" />
            <div className="px-5 pb-5 -mt-10">
              <Avatar name={customer.name} src={customer.profilePicture} size="lg" />
              <div className="mt-3">
                <h1 className="text-xl font-extrabold text-gray-900">{customer.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Joined {timeAgo(customer.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {source === 'online' ? (
                    <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                      <Globe size={11} /> Online Customer
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                      <ShoppingCart size={11} /> POS Customer
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Spent" value={fmt(computedTotalSpent)} icon={TrendingUp} color="bg-green-500" />
            <StatCard label="POS Sales" value={posSales.length} icon={ShoppingCart} color="bg-blue-500" />
            {source === 'online' && (
              <>
                <StatCard label="Wallet" value={fmt(customer.walletBalance)} icon={Wallet} color="bg-purple-500" />
                <StatCard label="Orders" value={onlineOrders.length} icon={ShoppingBag} color="bg-orange-500" />
                {customer.bonusPoints > 0 && (
                  <StatCard label="Bonus Pts" value={customer.bonusPoints} icon={Gift} color="bg-pink-500" />
                )}
              </>
            )}
            {source !== 'online' && (
              <StatCard label="POS Revenue" value={fmt(totalPosSales)} icon={CreditCard} color="bg-teal-500" />
            )}
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="flex flex-col gap-3">
              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline break-all">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{customer.address}</span>
                </div>
              )}
              {customer.country && (
                <div className="flex items-start gap-3">
                  <Globe size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{customer.country}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Joined {fmtDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Notes (POS customers only) */}
          {source !== 'online' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Notes</h3>
              <form onSubmit={addNote} className="mb-3">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note about this customer…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
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
          )}
        </div>

        {/* ── RIGHT MAIN ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {source === 'online' && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${activeTab === 'orders' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ShoppingBag size={15} /> Online Orders ({onlineOrders.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${activeTab === 'pos' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ShoppingCart size={15} /> POS Sales ({posSales.length})
            </button>
          </div>

          {/* Online Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Online Orders</h2>
                <span className="text-sm text-gray-400">{fmt(totalOnlineOrders)} total</span>
              </div>
              {onlineOrders.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No online orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3">Order ID</th>
                        <th className="px-5 py-3">Items</th>
                        <th className="px-5 py-3">Total</th>
                        <th className="px-5 py-3">Payment</th>
                        <th className="px-5 py-3">Delivery</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {onlineOrders.map(o => (
                        <tr key={o._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3.5">
                            <Link to={`/admin/order/${o._id}`} className="font-mono text-xs text-blue-600 hover:underline">#{o._id.slice(-6).toUpperCase()}</Link>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{o.orderItems?.length || 0} item(s)</td>
                          <td className="px-5 py-3.5 font-semibold text-gray-900">{fmt(o.totalPrice)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {o.isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.isDelivered ? 'bg-green-100 text-green-700' : o.isCancelled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {o.isDelivered ? 'Delivered' : o.isCancelled ? 'Cancelled' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Total</td>
                        <td className="px-5 py-3 font-bold text-green-700">{fmt(totalOnlineOrders)}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* POS Sales */}
          {activeTab === 'pos' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">POS Sales History</h2>
                <span className="text-sm text-gray-400">{fmt(totalPosSales)} total</span>
              </div>
              {posSales.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No POS sales recorded for this customer</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Products</th>
                        <th className="px-5 py-3">Payment</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {posSales.map(sale => (
                        <tr key={sale._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {fmtDate(sale.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              {sale.products?.slice(0, 3).map((p, i) => (
                                <span key={i} className="text-xs text-gray-600">
                                  {p.product?.name || p.name || 'Product'} <span className="text-gray-400">×{p.qty}</span>
                                </span>
                              ))}
                              {(sale.products?.length || 0) > 3 && (
                                <span className="text-xs text-gray-400">+{sale.products.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{sale.paymentMethod}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-gray-900">{fmt(sale.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Total Revenue</td>
                        <td className="px-5 py-3 text-right font-bold text-green-700">{fmt(totalPosSales)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Favorites (online users) */}
          {source === 'online' && customer.favorites?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={16} className="text-amber-400" /> Saved Products ({customer.favorites.length})
              </h2>
              <p className="text-sm text-gray-400">Customer has {customer.favorites.length} saved product(s) in their wishlist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerView;
