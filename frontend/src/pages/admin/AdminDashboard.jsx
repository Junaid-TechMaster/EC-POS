// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Users, ShoppingBag, LayoutDashboard, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all Admin Data simultaneously
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // We use Promise.all to fetch all three APIs at the exact same time!
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/orders', { withCredentials: true }),
          axios.get('http://localhost:5000/api/products'), // Public route
          axios.get('http://localhost:5000/api/users', { withCredentials: true })
        ]);

        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setUsersList(usersRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    // Only fetch if they are actually an admin
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  // Security Check
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // Calculate Totals dynamically
  const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 py-8 px-4 max-w-7xl mx-auto">
      
      {/* Sidebar Menu */}
      <div className="md:w-1/4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><LayoutDashboard className="text-green-600"/> Admin Panel</h2>
          <ul className="flex flex-col gap-2">
            <li><Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 font-bold"><LayoutDashboard size={18}/> Dashboard</Link></li>
            <li><Link to="#products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"><Package size={18}/> Products</Link></li>
            <li><Link to="#orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"><ShoppingBag size={18}/> Orders</Link></li>
            <li><Link to="#users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"><Users size={18}/> Users</Link></li>
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:w-3/4 flex flex-col gap-8">
        
        {loading ? (
          <div className="text-green-600 font-bold text-xl py-12 text-center">Loading Admin Data...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                <div className="text-blue-500 font-bold mb-2 uppercase text-xs tracking-wider">Total Sales</div>
                <div className="text-3xl font-extrabold text-blue-900">${totalSales.toFixed(2)}</div>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl shadow-sm">
                <div className="text-orange-500 font-bold mb-2 uppercase text-xs tracking-wider">Total Orders</div>
                <div className="text-3xl font-extrabold text-orange-900">{orders.length}</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl shadow-sm">
                <div className="text-purple-500 font-bold mb-2 uppercase text-xs tracking-wider">Total Products</div>
                <div className="text-3xl font-extrabold text-purple-900">{products.length}</div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4 font-bold">Order ID</th>
                      <th className="p-4 font-bold">User</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Total</th>
                      <th className="p-4 font-bold">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.slice(0, 5).map((order) => ( // Only show the 5 most recent orders here
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-900">{order._id.substring(0, 8)}...</td>
                        <td className="p-4 text-sm text-gray-600">{order.user ? order.user.name : 'Deleted User'}</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm font-bold text-gray-900">${order.totalPrice.toFixed(2)}</td>
                        <td className="p-4">
                          {order.isPaid ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">No orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;