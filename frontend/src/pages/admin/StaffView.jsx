import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Mail, Phone, Calendar, ShieldCheck, Briefcase,
  TrendingUp, ShoppingCart, CreditCard, Clock, Edit,
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

const StaffView = () => {
  const { id } = useParams();
  const { user: adminUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [posSales, setPosSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') navigate('/login');
  }, [adminUser, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [staffRes, salesRes] = await Promise.all([
          axios.get(`${API}/users/${id}`, { withCredentials: true }),
          axios.get(`${API}/transactions/pos?servedBy=${id}&limit=200`, { withCredentials: true }),
        ]);
        setStaff(staffRes.data);
        setPosSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fmt = (v) => `Rs ${Number(v || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-24">
        <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-semibold">Staff member not found</p>
        <Link to="/admin/userlist" className="mt-4 inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
          <ArrowLeft size={14} /> Back to Staff Management
        </Link>
      </div>
    );
  }

  const totalRevenue = posSales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);

  const paymentBreakdown = posSales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
    return acc;
  }, {});

  const roleColor = staff.role === 'admin' ? 'from-green-400 to-teal-500' : 'from-blue-400 to-indigo-500';
  const roleBadge = staff.role === 'admin'
    ? <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full w-fit"><ShieldCheck size={11} /> Admin</span>
    : <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full w-fit"><Briefcase size={11} /> Staff</span>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/userlist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} /> Back to Staff Management
        </Link>
        <Link
          to={`/admin/user/${id}/edit`}
          className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-xl font-semibold transition-colors"
        >
          <Edit size={14} /> Edit
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <div className="xl:w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`h-20 bg-gradient-to-br ${roleColor}`} />
            <div className="px-5 pb-5 -mt-10">
              <Avatar name={staff.name} src={staff.profilePicture} size="lg" />
              <div className="mt-3">
                <h1 className="text-xl font-extrabold text-gray-900">{staff.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Member since {timeAgo(staff.createdAt)}</p>
                <div className="mt-2">{roleBadge}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="POS Sales" value={posSales.length} icon={ShoppingCart} color="bg-blue-500" />
            <StatCard label="Revenue" value={fmt(totalRevenue)} icon={TrendingUp} color="bg-green-500" />
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="flex flex-col gap-3">
              {staff.email && (
                <div className="flex items-start gap-3">
                  <Mail size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${staff.email}`} className="text-sm text-blue-600 hover:underline break-all">{staff.email}</a>
                </div>
              )}
              {staff.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{staff.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Joined {fmtDate(staff.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Payment method breakdown */}
          {Object.keys(paymentBreakdown).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Payment Methods</h3>
              <div className="flex flex-col gap-2">
                {Object.entries(paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard size={13} className="text-gray-400" />
                      <span className="text-gray-600">{method}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT MAIN ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-blue-500" /> POS Sales History
              </h2>
              <span className="text-sm text-gray-400">{fmt(totalRevenue)} total · {posSales.length} sales</span>
            </div>

            {posSales.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No POS sales recorded for this staff member</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Customer</th>
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
                            <div>
                              <div>{fmtDate(sale.createdAt)}</div>
                              <div className="text-gray-300">{fmtTime(sale.createdAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {sale.customer ? (
                            <span className="text-sm font-medium text-gray-700">{sale.customer.name}</span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Walk-in</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            {sale.products?.slice(0, 2).map((p, i) => (
                              <span key={i} className="text-xs text-gray-600">
                                {p.product?.name || p.name || 'Product'} <span className="text-gray-400">×{p.qty}</span>
                              </span>
                            ))}
                            {(sale.products?.length || 0) > 2 && (
                              <span className="text-xs text-gray-400">+{sale.products.length - 2} more</span>
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
                      <td colSpan={4} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Total Revenue Processed</td>
                      <td className="px-5 py-3 text-right font-bold text-blue-700">{fmt(totalRevenue)}</td>
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

export default StaffView;
