// frontend/src/pages/Login.jsx
import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Leaf, ArrowLeft, Mail, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';

const API = '/api/users';
const OTP_SECONDS = 120;

// ─── OTP Input: 6 individual boxes ───────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const inputsRef = useRef([]);

  const handleKey = (i, e) => {
    const digits = value.split('');
    if (e.key === 'Backspace') {
      digits[i] = '';
      onChange(digits.join(''));
      if (i > 0) inputsRef.current[i - 1]?.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    digits[i] = e.key;
    onChange(digits.join(''));
    if (i < 5) inputsRef.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center my-4">
      {[...Array(6)].map((_, i) => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onKeyDown={e => handleKey(i, e)}
          onChange={() => {}}
          className="w-11 h-13 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition-colors py-3"
        />
      ))}
    </div>
  );
};

// ─── Countdown timer ──────────────────────────────────────────────────────────
const useCountdown = (initial) => {
  const [secs, setSecs] = useState(initial);
  const timerRef = useRef(null);

  const start = (from = initial) => {
    setSecs(from);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);
  return { secs, start };
};

const Login = () => {
  // ── Mode: 'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'setpassword'
  const [mode, setMode] = useState('login');

  // login / register
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);

  // OTP verify (after register)
  const [otp, setOtp]         = useState('');

  // forgot / reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw]     = useState(false);

  // setpassword (first login for staff)
  const [setpwNew, setSetpwNew]       = useState('');
  const [setpwConfirm, setSetpwConfirm] = useState('');
  const [showSetPw, setShowSetPw]     = useState(false);
  const [setPwRole, setSetPwRole]     = useState('user');

  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const { login, setUserFromData } = useContext(AuthContext);
  const navigate = useNavigate();
  const { secs, start: startTimer } = useCountdown(OTP_SECONDS);

  const clearMessages = () => { setError(''); setInfo(''); };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg === 'EMAIL_NOT_VERIFIED') {
        // resend OTP and move to verify step
        await axios.post(`${API}/resend-otp`, { email, type: 'verify' });
        startTimer();
        setMode('verify');
        setError('');
        setInfo('Your email is not verified. A new OTP has been sent.');
      } else {
        setError(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await axios.post(`${API}/`, { name, email, password });
      startTimer();
      setMode('verify');
      setInfo('A 6-digit OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the full 6-digit OTP'); return; }
    clearMessages();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/verify-otp`, { email, otp }, { withCredentials: true });
      setUserFromData(data);
      // Staff first-login: force password change before entering dashboard
      if (data.mustChangePassword) {
        setSetPwRole(data.role || 'user');
        setMode('setpassword');
      } else {
        navigate(data.role === 'staff' ? '/staff' : data.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      setError(msg === 'OTP_EXPIRED' ? 'OTP has expired. Please resend.' : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Set Password (first-time staff login) ─────────────────────────────────
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (setpwNew.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (setpwNew !== setpwConfirm) { setError('Passwords do not match.'); return; }
    clearMessages();
    setLoading(true);
    try {
      await axios.post(`${API}/set-password`, { newPassword: setpwNew }, { withCredentials: true });
      navigate(setPwRole === 'staff' ? '/staff' : setPwRole === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async (type = 'verify') => {
    clearMessages();
    try {
      await axios.post(`${API}/resend-otp`, { email: type === 'forgot' ? forgotEmail : email, type });
      startTimer();
      setOtp('');
      setResetOtp('');
      setInfo('New OTP sent. Check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await axios.post(`${API}/forgot-password`, { email: forgotEmail });
      startTimer();
      setMode('reset');
      setInfo('OTP sent to your email (if it exists in our system).');
    } catch {
      setMode('reset');
      setInfo('OTP sent to your email (if it exists in our system).');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (resetOtp.length < 6) { setError('Enter the full 6-digit OTP'); return; }
    clearMessages();
    setLoading(true);
    try {
      await axios.post(`${API}/reset-password`, { email: forgotEmail, otp: resetOtp, newPassword });
      setMode('login');
      setInfo('Password reset! You can now log in.');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      setError(msg === 'OTP_EXPIRED' ? 'OTP expired. Please request a new one.' : msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center pb-16 pt-8">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm w-full max-w-md">

        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full text-green-600"><Leaf size={32} /></div>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Welcome Back</h2>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            {info  && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{info}</div>}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="hello@organic.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => { clearMessages(); setForgotEmail(email); setMode('forgot'); }} className="text-sm text-green-600 hover:underline text-right -mt-2">
                Forgot Password?
              </button>
              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-8 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button onClick={() => { clearMessages(); setMode('register'); }} className="text-green-600 font-bold hover:underline">Sign Up</button>
            </div>
          </>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Create Account</h2>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="hello@organic.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2">
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => { clearMessages(); setMode('login'); }} className="text-green-600 font-bold hover:underline">Log In</button>
            </div>
          </>
        )}

        {/* ── VERIFY OTP (after register) ── */}
        {mode === 'verify' && (
          <>
            <button onClick={() => { clearMessages(); setMode('register'); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex justify-center mb-4 text-green-600"><Mail size={40} /></div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify Your Email</h2>
            <p className="text-sm text-gray-500 text-center mb-2">We sent a 6-digit OTP to <strong>{email}</strong></p>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-2 text-sm">{error}</div>}
            {info  && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-2 text-sm">{info}</div>}
            <form onSubmit={handleVerify} className="flex flex-col items-center gap-4">
              <OTPInput value={otp} onChange={setOtp} />
              <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              {secs > 0 ? (
                <>OTP expires in <span className="font-bold text-gray-700">{fmtTime(secs)}</span></>
              ) : (
                <button onClick={() => handleResend('verify')} className="text-green-600 font-bold hover:underline">Resend OTP</button>
              )}
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <>
            <button onClick={() => { clearMessages(); setMode('login'); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
              <ArrowLeft size={15} /> Back to Login
            </button>
            <div className="flex justify-center mb-4 text-green-600"><KeyRound size={40} /></div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Forgot Password?</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Enter your email and we&apos;ll send you a reset OTP.</p>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            <form onSubmit={handleForgotRequest} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="your@email.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          </>
        )}

        {/* ── SET PASSWORD (first-time staff login) ── */}
        {mode === 'setpassword' && (
          <>
            <div className="flex justify-center mb-4 text-green-600"><Lock size={40} /></div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Set Your Password</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Create a personal password for your staff account. You&apos;ll use this going forward.
            </p>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showSetPw ? 'text' : 'password'}
                    value={setpwNew}
                    onChange={e => setSetpwNew(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="At least 6 characters"
                  />
                  <button type="button" onClick={() => setShowSetPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSetPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={setpwConfirm}
                  onChange={e => setSetpwConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Repeat your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading || setpwNew.length < 6 || setpwNew !== setpwConfirm}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2"
              >
                {loading ? 'Saving...' : 'Save Password & Go to Dashboard'}
              </button>
            </form>
          </>
        )}

        {/* ── RESET PASSWORD ── */}
        {mode === 'reset' && (
          <>
            <button onClick={() => { clearMessages(); setMode('forgot'); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex justify-center mb-4 text-green-600"><KeyRound size={40} /></div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 text-center mb-2">Enter the OTP sent to <strong>{forgotEmail}</strong></p>
            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-2 text-sm">{error}</div>}
            {info  && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-2 text-sm">{info}</div>}
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <OTPInput value={resetOtp} onChange={setResetOtp} />
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-colors" placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || resetOtp.length < 6} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              {secs > 0 ? (
                <>OTP expires in <span className="font-bold text-gray-700">{fmtTime(secs)}</span></>
              ) : (
                <button onClick={() => handleResend('forgot')} className="text-green-600 font-bold hover:underline">Resend OTP</button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
