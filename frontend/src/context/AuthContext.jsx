// frontend/src/context/AuthContext.jsx
import { createContext, useState } from 'react';
import axios from 'axios';

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
    const { data } = await axios.post('http://localhost:5000/api/users/login', 
      { email, password },
      { withCredentials: true } // <-- ADD THIS
    );
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

const register = async (name, email, password) => {
    const { data } = await axios.post('http://localhost:5000/api/users', 
      { name, email, password },
      { withCredentials: true } // <-- ADD THIS
    );
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  const logout = async () => {
    await axios.post('http://localhost:5000/api/users/logout');
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};