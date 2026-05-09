import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { ShoppingCart, ShoppingBag, TrendingUp, CheckCircle, XCircle, Package } from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useContext(AuthContext);

  const [posStats, setPosStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) return;

    const fetchData = async () => {
      try {
        const [statsRes, salesRes, ordersRes] = await Promise.all([
          axios.get('/api/transactions/pos/stats', { withCredentials: true }),
          axios.get('/api/transactions/pos?limit=8', { withCredentials: true }),
          axios.get('/api/orders', { withCredentials: true }),
        ]);
        setPosStats(statsRes.data);
        setRecentSales(salesRes.data || []);
        const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || [];
        setRecentOrders(rawOrders.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.name}</p>
        </div>
        <Link
          to="/admin/pos"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <ShoppingCart size={20} /> Open POS Terminal
        </Link>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="text-center py-12 text-green-600 font-bold">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-100 p-5 rounded-2xl shadow-sm">
              <p className="text-green-600 font-bold text-xs uppercase tracking-wider mb-2">Today Revenue</p>
              <p className="text-2xl font-extrabold text-green-900">Rs {posStats?.todayRevenue?.toFixed(0) ?? 0}</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 p-5 rounded-2xl shadow-sm">
              <p className="text-teal-600 font-bold text-xs uppercase tracking-wider mb-2">Today Sales</p>
              <p className="text-2xl font-extrabold text-teal-900">{posStats?.todaySales ?? 0}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl shadow-sm">
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">Total POS Revenue</p>
              <p className="text-2xl font-extrabold text-indigo-900">Rs {posStats?.totalRevenue?.toFixed(0) ?? 0}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl shadow-sm">
              <p className="text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">Total Transactions</p>
              <p className="text-2xl font-extrabold text-amber-900">{posStats?.totalSales ?? 0}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { to: '/admin/pos', label: 'POS Terminal', icon: ShoppingCart, color: 'green' },
              { to: '/admin/orderlist', label: 'View Orders', icon: ShoppingBag, color: 'blue' },
              { to: '/admin/productlist', label: 'View Products', icon: Package, color: 'purple' },
            ].map(link => {
              const LinkIcon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group`}
                >
                  <div className={`p-3 rounded-xl bg-${link.color}-50 group-hover:bg-${link.color}-100 transition-colors`}>
                    <LinkIcon size={24} className={`text-${link.color}-600`} />
                  </div>
                  <span className="font-bold text-gray-700">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent POS Sales */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-600" />
                <h3 className="font-bold text-gray-900">Recent POS Sales</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {recentSales.length === 0 ? (
                  <p className="p-6 text-gray-400 text-center">No POS sales yet</p>
                ) : recentSales.map(sale => (
                  <div key={sale._id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {sale.customer ? sale.customer.name : 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sale.paymentMethod} · {new Date(sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-bold text-green-700">Rs {sale.totalAmount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Online Orders */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <ShoppingBag size={18} className="text-blue-500" />
                <h3 className="font-bold text-gray-900">Recent Online Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4 font-bold">ID</th>
                      <th className="p-4 font-bold">Customer</th>
                      <th className="p-4 font-bold">Total</th>
                      <th className="p-4 font-bold">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan="4" className="p-6 text-center text-gray-400">No orders yet</td></tr>
                    ) : recentOrders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-600">#{order._id.substring(0, 8)}</td>
                        <td className="p-4 text-sm text-gray-700">{order.user ? order.user.name : 'Deleted'}</td>
                        <td className="p-4 text-sm font-bold text-gray-900">Rs {order.totalPrice.toFixed(0)}</td>
                        <td className="p-4">
                          {order.isPaid
                            ? <CheckCircle size={16} className="text-green-500" />
                            : <XCircle size={16} className="text-red-400" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
