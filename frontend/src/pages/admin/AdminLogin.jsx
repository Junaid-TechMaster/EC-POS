import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, BarChart3, Users, ShoppingBag, Zap } from 'lucide-react';

const API = '/api/users';

const FEATURES = [
  { icon: BarChart3, text: 'Real-time analytics & reports' },
  { icon: ShoppingBag, text: 'POS terminal & order management' },
  { icon: Users, text: 'Staff & customer management' },
  { icon: Zap, text: 'Inventory & purchase ledger' },
];

const fmtTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const RightPanel = ({ children }) => (
  <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-10 w-full max-w-md mx-auto">
    {children}
  </div>
);

export default function AdminLogin() {
  const { user, login, setUserFromData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpLoading, setOtpLoading] = useState(false);

  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwRole, setPwRole] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showNewResetPw, setShowNewResetPw] = useState(false);

  useEffect(() => {
    if (mode !== 'verify' && mode !== 'forgot') return;
    setOtpTimer(120);
    const id = setInterval(() => setOtpTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
    else if (user?.role === 'staff') navigate('/staff', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      if (msg === 'EMAIL_NOT_VERIFIED') {
        try { await axios.post(`${API}/resend-otp`, { email, type: 'verify' }, { withCredentials: true }); } catch {}
        setMode('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (refs, idx, val, setter) => {
    if (!/^[0-9]?$/.test(val)) return;
    setter(prev => { const n = [...prev]; n[idx] = val; return n; });
    if (val && idx < 5) refs[idx + 1]?.focus();
  };

  const handleVerify = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    setOtpLoading(true);
    try {
      const { data } = await axios.post(`${API}/verify-otp`, { email, otp }, { withCredentials: true });
      if (data.mustChangePassword) {
        setPwRole(data.role);
        setUserFromData(data);
        setMode('setpassword');
      } else {
        setUserFromData(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async (type) => {
    try {
      await axios.post(`${API}/resend-otp`, { email, type }, { withCredentials: true });
      setOtpTimer(120);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (pwNew.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (pwNew !== pwConfirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/set-password`, { password: pwNew }, { withCredentials: true });
      if (pwRole === 'staff') navigate('/staff', { replace: true });
      else navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/forgot-password`, { email }, { withCredentials: true });
      setMode('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const otp = resetOtpDigits.join('');
    if (otp.length !== 6) { setError('Enter all 6 digits'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/reset-password`, { email, otp, password: newPassword }, { withCredentials: true });
      setMode('login');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyRefs = Array(6).fill(null);
  const resetRefs = Array(6).fill(null);

  const renderOtpBoxes = (digits, setDigits, refs) => (
    <div className="flex gap-2 justify-center my-4">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleOtpInput(refs, i, e.target.value, setDigits)}
          onKeyDown={e => { if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1]?.focus(); }}
          className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-green-700 via-emerald-600 to-teal-700 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck size={22} className="text-green-700" />
          </div>
          <div>
            <span className="text-white font-bold text-xl">EC-POS</span>
            <span className="text-green-200 text-xs block leading-none">Admin Portal</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Manage your<br />store with ease.
          </h2>
          <p className="text-green-100 text-lg mb-10 leading-relaxed">
            Your all-in-one dashboard for ecommerce and in-store point-of-sale management.
          </p>
          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-green-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-green-300 text-sm">Built for organic &amp; grocery retail</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 lg:bg-white overflow-y-auto">

        {/* LOGIN */}
        {mode === 'login' && (
          <RightPanel>
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">EC-POS Admin</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm mb-8">Sign in to your admin portal</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-green-600 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setRemember(r => !r)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${remember ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}
                >
                  {remember && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-2">Demo Credentials</p>
              <div className="flex flex-col gap-1 text-xs text-amber-700 font-mono">
                <span>admin@ecpos.com / admin123</span>
                <span>staff@ecpos.com / staff123</span>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Back to <Link to="/" className="text-green-600 hover:underline font-medium">Customer Store</Link>
            </p>
          </RightPanel>
        )}

        {/* VERIFY OTP */}
        {mode === 'verify' && (
          <RightPanel>
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Mail size={22} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">
              We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            {renderOtpBoxes(otpDigits, setOtpDigits, verifyRefs)}

            <p className="text-center text-xs text-gray-500 mb-5">
              {otpTimer > 0
                ? <>Code expires in <span className="font-semibold text-gray-700">{fmtTimer(otpTimer)}</span></>
                : <button onClick={() => resendOtp('verify')} className="text-green-600 hover:underline font-medium">Resend Code</button>
              }
            </p>

            <button
              onClick={handleVerify}
              disabled={otpLoading || otpDigits.join('').length !== 6}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {otpLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</> : 'Verify & Continue'}
            </button>
            <button onClick={() => { setMode('login'); setError(''); }} className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">← Back to Sign In</button>
          </RightPanel>
        )}

        {/* SET PASSWORD */}
        {mode === 'setpassword' && (
          <RightPanel>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Lock size={22} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set your password</h1>
            <p className="text-gray-500 text-sm mb-6">Choose a secure password for your account.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm mt-2 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Set Password & Continue'}
              </button>
            </form>
          </RightPanel>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <RightPanel>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <Mail size={22} className="text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset code.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleForgotRequest} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : 'Send Reset Code'}
              </button>
            </form>
            <button onClick={() => { setMode('login'); setError(''); }} className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">← Back to Sign In</button>
          </RightPanel>
        )}

        {/* RESET PASSWORD */}
        {mode === 'reset' && (
          <RightPanel>
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Lock size={22} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter reset code</h1>
            <p className="text-gray-500 text-sm mb-4">
              Code sent to <span className="font-semibold text-gray-700">{email}</span>
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            {renderOtpBoxes(resetOtpDigits, setResetOtpDigits, resetRefs)}

            <form onSubmit={handleReset} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewResetPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 bg-gray-50 focus:bg-white text-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowNewResetPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewResetPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
            <button onClick={() => { setMode('forgot'); setError(''); }} className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">← Back</button>
          </RightPanel>
        )}

      </div>
    </div>
  );
}
