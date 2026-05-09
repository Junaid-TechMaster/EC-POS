import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle, XCircle, ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft, Search, X, Filter } from 'lucide-react';

const PAGE_SIZE = 20;

const OrderList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
        if (search)       params.set('search', search);
        if (filterStatus) params.set('status', filterStatus);
        if (filterFrom)   params.set('from', filterFrom);
        if (filterTo)     params.set('to', filterTo);

        const { data } = await axios.get(
          `/api/orders?${params}`,
          { withCredentials: true }
        );
        if (!cancelled) {
          if (Array.isArray(data)) {
            setOrders(data); setPages(1); setTotal(data.length);
          } else {
            setOrders(data.orders || []); setPages(data.pages || 1); setTotal(data.total || 0);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, page, search, filterStatus, filterFrom, filterTo]);

  const setFilter = (setter) => (val) => { setter(val); setPage(1); };

  const hasFilters = search || filterStatus || filterFrom || filterTo;
  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setPage(1); };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-5">
        <ShoppingBag className="text-green-600" size={30} /> Order Management
        {total > 0 && <span className="text-lg font-normal text-gray-400">({total})</span>}
      </h1>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* User / order ID search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setFilter(setSearch)(e.target.value)}
              placeholder="Search by customer name or order ID…"
              className="pl-8 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilter(setFilterStatus)(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilter(setFilterFrom)(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilter(setFilterTo)(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-green-600 font-bold">Loading Orders...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-bold">ID</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Total</th>
                    <th className="p-4 font-bold">Paid</th>
                    <th className="p-4 font-bold">Delivered</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order._id} className={`hover:bg-gray-50 transition-colors ${order.isCancelled ? 'opacity-60' : ''}`}>
                      <td className="p-4 text-sm text-gray-500">{order._id.substring(0, 8)}…</td>
                      <td className="p-4 text-sm text-gray-600">{order.user ? order.user.name : 'Deleted'}</td>
                      <td className="p-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-semibold text-gray-800">Rs {order.totalPrice.toFixed(0)}</td>
                      <td className="p-4">
                        {order.isPaid
                          ? <CheckCircle size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-red-400" />}
                      </td>
                      <td className="p-4">
                        {order.isDelivered
                          ? <CheckCircle size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-red-400" />}
                      </td>
                      <td className="p-4">
                        {order.isCancelled
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Cancelled</span>
                          : order.isDelivered
                          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Delivered</span>
                          : order.isPaid
                          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Paid</span>
                          : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Pending</span>}
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/admin/order/${order._id}`} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold text-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-400">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold ${p === page ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;
