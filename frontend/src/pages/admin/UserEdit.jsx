// frontend/src/pages/admin/UserEdit.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

const STAFF_PERMISSIONS = [
  { key: 'pos_sales',        label: 'POS Terminal — process sales' },
  { key: 'view_orders',      label: 'View Orders' },
  { key: 'manage_products',  label: 'Manage Products (edit/stock)' },
  { key: 'view_reports',     label: 'View Reports & Stats' },
  { key: 'manage_customers', label: 'Manage Customers & Vendors' },
  { key: 'manage_inventory', label: 'Manage Inventory & Purchases' },
];

const UserEdit = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const togglePermission = (key) => {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`/api/users/${userId}`, { withCredentials: true });
        setName(data.name);
        setEmail(data.email);
        setRole(data.role);
        setPermissions(data.permissions || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      await axios.put(
        `/api/users/${userId}`,
        { name, email, role, permissions },
        { withCredentials: true }
      );
      alert('User updated successfully!');
      navigate('/admin/userlist');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      setUpdateLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/admin/userlist" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-medium mb-6 transition-colors">
        <ArrowLeft size={20} /> Back to Users
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Edit User</h1>

        {loading ? (
          <div className="text-green-600 font-bold text-center py-8">Loading User...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
        ) : (
          <form onSubmit={submitHandler} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50" />
            </div>

            <div className="flex flex-col gap-2 mt-2 border-t pt-6">
              <label className="font-bold text-gray-700 text-lg">Account Privileges</label>
              <div className="flex gap-4 mt-2">
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center justify-center gap-3 font-bold transition-colors ${role === 'user' ? 'border-gray-800 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-400'}`}>
                  <input type="radio" name="role" value="user" checked={role === 'user'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  Standard User
                </label>
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center justify-center gap-3 font-bold transition-colors ${role === 'staff' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400'}`}>
                  <input type="radio" name="role" value="staff" checked={role === 'staff'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  Staff
                </label>
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center justify-center gap-3 font-bold transition-colors ${role === 'admin' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
                  <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  Administrator
                </label>
              </div>
            </div>

            {role === 'staff' && (
              <div className="flex flex-col gap-3 mt-2 border-t pt-6">
                <label className="font-bold text-gray-700 text-lg">Staff Permissions</label>
                <p className="text-sm text-gray-500 -mt-1">Select which features this staff member can access.</p>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {STAFF_PERMISSIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={updateLoading} className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
              <Save size={20} /> {updateLoading ? 'Saving...' : 'Update User'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserEdit;