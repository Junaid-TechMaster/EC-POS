// frontend/src/context/AuthContext.jsx
import { createContext, useState } from 'react';
import axios from '../utils/api';

// 1. We tell Vite's linter to relax about exporting this context object
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  
  // 2. LAZY INITIALIZATION: We check localStorage immediately instead of waiting for useEffect!
  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

const login = async (email, password) => {
    const { data } = await axios.post('/api/users/login',
      { email, password },
      { withCredentials: true } // <-- ADD THIS
    );
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

const register = async (name, email, password) => {
    const { data } = await axios.post('/api/users',
      { name, email, password },
      { withCredentials: true }
    );
    // register now returns { pendingVerification: true } — do NOT set user yet
    return data;
  };

  // Called after OTP verification succeeds — data comes from /verify-otp response
  const setUserFromData = (data) => {
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  // Merge partial fields into the current user (e.g. profilePicture after avatar upload)
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem('userInfo', JSON.stringify(next));
      return next;
    });
  };

  const logout = async () => {
    await axios.post('/api/users/logout');
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUserFromData, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};