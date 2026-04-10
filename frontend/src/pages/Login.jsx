// frontend/src/pages/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/'); // Redirect to Home upon success!
    } catch (err) {
      // Catch errors from the backend (like "Invalid email" or "User exists")
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center pb-16 pt-8">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm w-full max-w-md">
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full text-green-600"><Leaf size={32} /></div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</div>}

        <form onSubmit={submitHandler} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="John Doe" />
            </div>
          )}
          
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="hello@organic.com" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="••••••••" />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors mt-4">
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-green-600 font-bold hover:underline outline-none">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;