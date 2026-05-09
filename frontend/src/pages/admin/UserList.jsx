// frontend/src/pages/admin/UserList.jsx
import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Trash2, Edit, Users, ShieldCheck, User as UserIcon, Briefcase, ArrowLeft, Eye } from 'lucide-react';

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

const UserList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/login');
  }, [user, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/users?roles=admin,staff', { withCredentials: true });
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => await fetchUsers();
    if (isMounted) loadUsers();
    return () => { isMounted = false; };
  }, [fetchUsers]);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/users/${id}`, { withCredentials: true });
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
        setLoading(false);
      }
    }
  };

  const roleToggleHandler = async (u) => {
    const newRole = u.role === 'staff' ? 'user' : 'staff';
    const label = newRole === 'staff' ? 'Promote to Staff' : 'Remove Staff role';
    if (!window.confirm(`${label} for ${u.name}?`)) return;
    try {
      await axios.put(
        `/api/users/${u._id}`,
        { name: u.name, email: u.email, role: newRole },
        { withCredentials: true }
      );
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
        <Users className="text-green-600" size={32}/> Staff Management
      </h1>
      <p className="text-sm text-gray-500 mb-8">Shows admin and staff accounts only. Regular customers are in <a href="/admin/pos-people" className="text-green-600 underline font-medium">POS People</a>.</p>

      {loading ? (
        <div className="text-center py-12 text-green-600 font-bold">Loading Users...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-bold w-14">Avatar</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Avatar name={u.name} src={u.profilePicture} />
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{u._id.substring(0, 8)}…</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline">{u.email}</a>
                    </td>
                    <td className="p-4">
                      {u.role === 'admin' ? (
                        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-lg text-xs font-bold w-max">
                          <ShieldCheck size={14} /> Admin
                        </span>
                      ) : u.role === 'staff' ? (
                        <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-lg text-xs font-bold w-max">
                          <Briefcase size={14} /> Staff
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-lg text-xs w-max">
                          <UserIcon size={14} /> User
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-3 items-center">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => roleToggleHandler(u)}
                          title={u.role === 'staff' ? 'Remove Staff role' : 'Promote to Staff'}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${u.role === 'staff' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {u.role === 'staff' ? 'Demote' : 'Make Staff'}
                        </button>
                      )}
                      <Link to={`/admin/staff/${u._id}`} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="View profile">
                        <Eye size={18} />
                      </Link>
                      <Link to={`/admin/user/${u._id}/edit`} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => deleteHandler(u._id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        disabled={u.role === 'admin'}
                      >
                        <Trash2 size={18} className={u.role === 'admin' ? 'opacity-50' : ''} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;