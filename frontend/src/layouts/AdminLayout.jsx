import { useContext } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Allow /admin/login without auth
  if (location.pathname === '/admin/login') {
    return (
      <div className="min-h-screen w-full bg-[#f5f6fa] font-sans">
        <Outlet />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f6fa] font-sans">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
