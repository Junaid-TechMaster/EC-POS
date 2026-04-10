// frontend/src/pages/Profile.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Package, CheckCircle, XCircle } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Security Check: Kick them out if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch the user's orders
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/orders/myorders', {
          withCredentials: true // Need this to send the secure JWT cookie!
        });
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    if (user) fetchMyOrders();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto pb-16 pt-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: User Details */}
        <div className="md:w-1/3">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sticky top-6 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <User size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">{user.name}</h2>
            <p className="text-gray-500 text-center mb-8">{user.email}</p>

            <div className="space-y-4">
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-1">Account Type</p>
                <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors mt-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="text-green-600" /> My Orders
          </h2>

          {loading ? (
            <div className="text-green-600 font-bold">Loading orders...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
              You haven't placed any orders yet. Time to buy some organic goodness!
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                      <th className="p-4 font-bold">ID</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Total</th>
                      <th className="p-4 font-bold">Paid</th>
                      <th className="p-4 font-bold">Delivered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-900">{order._id.substring(0, 8)}...</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm font-bold text-gray-900">${order.totalPrice.toFixed(2)}</td>
                        <td className="p-4">
                          {order.isPaid ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
                        </td>
                        <td className="p-4">
                          {order.isDelivered ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;