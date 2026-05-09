import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Wallet, Package, Heart, Gift, Star, Plus, RotateCcw,
  Truck, CheckCircle, XCircle, Clock, ArrowRight, Award, Camera,
  Building2, Trash2, CreditCard, ArrowLeft, AlertCircle, Smartphone,
  LayoutDashboard, ShoppingCart, FolderOpen, Users, Tag, ShieldCheck,
  MapPin, Edit2, DollarSign, Calendar,
} from 'lucide-react';
import axios from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCard from '../components/ProductCard';

const stripePromise = loadStripe('pk_test_51TRBkgL17gjGQnnv4vZHeefuuMlf5Aldi8gNCTIAoQhAosNhHzlA8MaqcHzap4KBwMparCMPxV9uJm2DWHUYEaSw00Gix4vFgY');

const CARD_STYLE = {
  style: {
    base: { fontSize: '15px', color: '#374151', '::placeholder': { color: '#9ca3af' }, fontFamily: 'inherit' },
    invalid: { color: '#ef4444' },
  },
};

const WalletCardForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !amount) return;
    setProcessing(true);
    setMsg('');
    setIsError(false);
    try {
      const { data: { clientSecret } } = await axios.post(
        '/api/wallet/card-intent',
        { amount: Number(amount) },
        { withCredentials: true }
      );
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        setIsError(true);
        setMsg(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        const { data } = await axios.post(
          '/api/wallet/card-confirm',
          { paymentIntentId: result.paymentIntent.id, amount: Number(amount) },
          { withCredentials: true }
        );
        onSuccess(data.newBalance);
        setMsg(`Rs ${Number(amount).toLocaleString()} added to your wallet!`);
        setAmount('');
        elements.getElement(CardElement).clear();
      }
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Amount (Rs) *</label>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 500" min="1" required
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Card Details *</label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-green-500 transition-colors">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>
      {msg && (
        <p className={`text-sm flex items-center gap-1.5 font-medium ${isError ? 'text-red-500' : 'text-green-600'}`}>
          {isError ? <AlertCircle size={14} /> : <CheckCircle size={14} />} {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing || !amount}
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
      >
        <CreditCard size={16} />
        {processing ? 'Processing…' : `Pay Rs ${amount ? Number(amount).toLocaleString() : '0'}`}
      </button>
      <p className="text-xs text-gray-400 text-center">🔒 Secured by Stripe. Your card info is never stored on our servers.</p>
    </form>
  );
};

const USER_TABS = [
  { id: 'profile',   label: 'Profile',     icon: User },
  { id: 'wallet',    label: 'Wallet',      icon: Wallet },
  { id: 'orders',    label: 'My Orders',   icon: Package },
  { id: 'favorites', label: 'Saved Items', icon: Heart },
  { id: 'vouchers',  label: 'Rewards',     icon: Gift },
];

const ADMIN_TABS = [
  { id: 'profile', label: 'My Profile',    icon: User },
  { id: 'wallet',  label: 'Wallet',        icon: Wallet },
  { id: 'orders',  label: 'My Orders',     icon: Package },
  { id: 'banks',   label: 'Bank Accounts', icon: Building2 },
];

const ADMIN_LINKS = [
  { to: '/admin',                label: 'Dashboard',       icon: LayoutDashboard, color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100' },
  { to: '/admin/pos',            label: 'POS Terminal',    icon: ShoppingCart,    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100' },
  { to: '/admin/productlist',    label: 'Products',        icon: Package,         color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100' },
  { to: '/admin/orderlist',      label: 'Orders',          icon: Package,         color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100' },
  { to: '/admin/categories',     label: 'Categories',      icon: FolderOpen,      color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100' },
  { to: '/admin/userlist',       label: 'Users',           icon: Users,           color: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-100' },
  { to: '/admin/vouchers',       label: 'Vouchers',        icon: Tag,             color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-100' },
  { to: '/admin/wallet-requests',label: 'Wallet Requests', icon: Wallet,          color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100' },
];

const Profile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const avatarRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const tabs = isAdmin ? ADMIN_TABS : USER_TABS;
  const rawTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(
    tabs.find(t => t.id === rawTab) ? rawTab : 'profile'
  );
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payMethod, setPayMethod] = useState('card');   // 'card' | 'manual'
  const [selBankIdx, setSelBankIdx] = useState('');      // index into merchantBanks
  const [topupAmount, setTopupAmount] = useState('');
  const [topupRef, setTopupRef] = useState('');
  const [topupMsg, setTopupMsg] = useState('');
  const [topupRequests, setTopupRequests] = useState([]);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');

  const [merchantBanks, setMerchantBanks] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Admin: add bank account form
  const [bankForm, setBankForm] = useState({ bankName: '', accountTitle: '', accountNumber: '', iban: '', logo: '', isDefault: false });
  const [showBankForm, setShowBankForm] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [profRes, ordersRes, banksRes, addrRes] = await Promise.all([
          axios.get('/api/users/profile', { withCredentials: true }),
          axios.get('/api/orders/myorders', { withCredentials: true }),
          axios.get('/api/users/merchant/banks', { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get('/api/users/address', { withCredentials: true }).catch(() => ({ data: null })),
        ]);
        setProfile(profRes.data);
        // Hydrate auth-context with latest profile data so the navbar reflects existing picture
        if (profRes.data?.profilePicture && profRes.data.profilePicture !== user.profilePicture) {
          updateUser({ profilePicture: profRes.data.profilePicture });
        }
        setOrders(ordersRes.data);
        setMerchantBanks(banksRes.data || []);
        setSavedAddress(addrRes.data || null);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate, updateUser]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      axios.get('/api/users/favorites', { withCredentials: true })
        .then((r) => setFavorites(r.data)).catch(() => {});
    }
    if (activeTab === 'wallet') {
      loadTopupRequests();
    }
  }, [activeTab]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingAvatar(true);
    try {
      const { data: uploadData } = await axios.post('/api/upload/avatar', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await axios.put('/api/users/profile/picture', { profilePicture: uploadData.url }, { withCredentials: true });
      setProfile(p => ({ ...p, profilePicture: uploadData.url }));
      updateUser({ profilePicture: uploadData.url });
    } catch (err) {
      alert(err.response?.data?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadTopupRequests = async () => {
    try {
      const { data } = await axios.get('/api/wallet/mine', { withCredentials: true });
      setTopupRequests(data);
    } catch {
      // silent
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!topupRef.trim()) { setTopupMsg('Please enter your transaction reference number.'); return; }
    const bankName = selBankIdx !== '' ? merchantBanks[selBankIdx]?.bankName : '';
    try {
      await axios.post(
        '/api/wallet',
        { amount: topupAmount, transactionRef: topupRef, bankName },
        { withCredentials: true }
      );
      setTopupMsg('Request submitted! Admin will review and credit your wallet shortly.');
      setTopupAmount('');
      setTopupRef('');
      setSelBankIdx('');
      loadTopupRequests();
    } catch (err) {
      setTopupMsg(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        '/api/users/bonus/redeem',
        { points: redeemPoints },
        { withCredentials: true }
      );
      setProfile((p) => ({ ...p, walletBalance: data.walletBalance, bonusPoints: data.bonusPoints }));
      setRedeemMsg(`Redeemed ${redeemPoints} pts → ${format(Number(redeemPoints))} added`);
      setRedeemPoints('');
    } catch (err) {
      setRedeemMsg(err.response?.data?.message || 'Redemption failed');
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/users/merchant/banks', bankForm, { withCredentials: true });
      setMerchantBanks(data);
      setBankForm({ bankName: '', accountTitle: '', accountNumber: '', iban: '', isDefault: false });
      setShowBankForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add bank account');
    }
  };

  const handleDeleteBankAccount = async (idx) => {
    if (!window.confirm('Remove this bank account?')) return;
    try {
      const { data } = await axios.delete(`/api/users/merchant/banks/${idx}`, { withCredentials: true });
      setMerchantBanks(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const getOrderStatusBadge = (order) => {
    if (order.isCancelled) return { label: 'Cancelled',  cls: 'bg-red-100 text-red-600'      };
    const s = order.orderStatus || (order.isDelivered ? 'delivered' : order.isPaid ? 'shipped' : 'pending');
    const map = {
      pending:    { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-700' },
      processing: { label: 'Processing', cls: 'bg-blue-100 text-blue-700'    },
      shipped:    { label: 'Shipped',    cls: 'bg-purple-100 text-purple-700' },
      delivered:  { label: 'Delivered',  cls: 'bg-green-100 text-green-700'  },
    };
    return map[s] || map.pending;
  };

  if (!user) return null;
  if (loading) return <div className="text-center py-20 text-green-600 font-semibold">Loading profile…</div>;

  const avatarSrc = profile?.profilePicture;

  return (
    <div className="w-full pb-16">
      <Link to={isAdmin ? '/admin' : '/'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
        <ArrowLeft size={15} /> {isAdmin ? 'Back to Dashboard' : 'Back to Home'}
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-2">My Account</h1>

      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <aside className="md:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-20">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-gray-100">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-200 bg-green-50 flex items-center justify-center">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-green-600">{profile?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center shadow hover:bg-green-700 transition-colors disabled:opacity-50"
                  title="Change profile picture"
                >
                  {uploadingAvatar ? <span className="text-[10px]">…</span> : <Camera size={13} />}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <p className="font-bold text-gray-900">{profile?.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-full">{profile?.email}</p>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold mt-2">
                  <ShieldCheck size={11} /> Admin
                </span>
              ) : (
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-600 font-semibold">
                    <Wallet size={10} className="inline mr-0.5" />{format(profile?.walletBalance || 0)}
                  </span>
                  <span className="text-purple-600 font-semibold">
                    <Award size={10} className="inline mr-0.5" />{profile?.bonusPoints || 0} pts
                  </span>
                </div>
              )}
            </div>

            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const TIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <TIcon size={16} /> {tab.label}
                  </button>
                );
              })}
              <hr className="my-2 border-gray-100" />
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <XCircle size={16} /> Logout
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5">

              {/* Stats row (non-admin) */}
              {!isAdmin && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Total Spent',
                      value: format(orders.reduce((s, o) => s + (o.totalPrice || 0), 0)),
                      icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50',
                    },
                    {
                      label: 'Last Order',
                      value: orders.length > 0 ? new Date(orders[0].createdAt).toLocaleDateString() : '—',
                      icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50',
                    },
                    {
                      label: 'Total Orders',
                      value: orders.length,
                      icon: Package, color: 'text-purple-600', bg: 'bg-purple-50',
                    },
                  ].map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 flex flex-col gap-2`}>
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <StatIcon size={16} className={stat.color} />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        <p className={`font-extrabold text-base ${stat.color}`}>{stat.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Personal info + Default Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Full Name',    value: profile?.name },
                      { label: 'Email',        value: profile?.email },
                      { label: 'Account Type', value: profile?.role },
                      { label: 'Member Since', value: new Date(profile?.createdAt).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="font-semibold text-gray-900 capitalize text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default Address card */}
                {!isAdmin && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin size={17} className="text-green-600" /> Default Address
                      </h2>
                      <Link to="/profile/shipping"
                        className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:underline">
                        <Edit2 size={13} /> Edit
                      </Link>
                    </div>
                    {savedAddress?.addressLine1 ? (
                      <div className="flex flex-col gap-2 text-sm">
                        <p className="font-semibold text-gray-900">{savedAddress.fullName}</p>
                        <p className="text-gray-600">{savedAddress.addressLine1}</p>
                        {savedAddress.addressLine2 && <p className="text-gray-500">{savedAddress.addressLine2}</p>}
                        <p className="text-gray-600">
                          {[savedAddress.city, savedAddress.state, savedAddress.postalCode].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-gray-600">{savedAddress.country}</p>
                        {savedAddress.phone && <p className="text-gray-500">{savedAddress.phone}</p>}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <MapPin size={28} className="text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">No address saved yet</p>
                        <Link to="/profile/shipping"
                          className="mt-3 text-sm text-green-600 font-semibold hover:underline">
                          Add address
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin: quick-access panel links */}
              {isAdmin && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-green-600" /> Admin Panel
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ADMIN_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border font-semibold text-sm transition-colors ${link.color}`}
                        >
                          <Icon size={22} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Banks Tab (admin only) ── */}
          {activeTab === 'banks' && (
            <div className="flex flex-col gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={18} className="text-green-600" /> Merchant Bank Accounts
                  </h2>
                  <button
                    onClick={() => setShowBankForm(v => !v)}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Plus size={14} /> Add Account
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  These accounts are shown to customers when they submit a manual wallet top-up request.
                </p>

                {showBankForm && (
                  <form onSubmit={handleAddBankAccount} className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input required value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Bank Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input required value={bankForm.accountTitle} onChange={e => setBankForm(f => ({ ...f, accountTitle: e.target.value }))} placeholder="Account Title" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input required value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="Account Number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input value={bankForm.iban} onChange={e => setBankForm(f => ({ ...f, iban: e.target.value }))} placeholder="IBAN (optional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    {/* Logo URL */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                        {bankForm.logo ? (
                          <img src={bankForm.logo} alt="logo" className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; }} />
                        ) : (
                          <Building2 size={18} className="text-gray-400" />
                        )}
                      </div>
                      <input
                        value={bankForm.logo}
                        onChange={e => setBankForm(f => ({ ...f, logo: e.target.value }))}
                        placeholder="Bank logo URL (optional)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={bankForm.isDefault} onChange={e => setBankForm(f => ({ ...f, isDefault: e.target.checked }))} className="accent-green-600" />
                      Set as default account
                    </label>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">Save</button>
                      <button type="button" onClick={() => setShowBankForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200">Cancel</button>
                    </div>
                  </form>
                )}

                {merchantBanks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No bank accounts added yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {merchantBanks.map((bank, idx) => (
                      <div key={idx} className={`flex items-start justify-between p-4 rounded-xl border ${bank.isDefault ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        {/* Logo + info */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {bank.logo ? (
                              <img src={bank.logo} alt={bank.bankName} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <Building2 size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                              {bank.bankName}
                              {bank.isDefault && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Default</span>}
                            </p>
                            <p className="text-sm text-gray-600">{bank.accountTitle}</p>
                            <p className="text-sm font-mono text-gray-700">{bank.accountNumber}</p>
                            {bank.iban && <p className="text-xs text-gray-400">IBAN: {bank.iban}</p>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteBankAccount(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Wallet Tab ── */}
          {activeTab === 'wallet' && (
            <div className="flex flex-col gap-6">

              {/* Balance cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-1 opacity-80 text-sm"><Wallet size={16} /> Wallet Balance</div>
                  <p className="text-4xl font-extrabold">{format(profile?.walletBalance || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-1 opacity-80 text-sm"><Star size={16} /> Bonus Points</div>
                  <p className="text-4xl font-extrabold">{profile?.bonusPoints || 0}</p>
                  <p className="text-xs opacity-70 mt-1">1 point = {format(1)} in wallet</p>
                </div>
              </div>

              {/* Top-Up section */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Plus size={18} className="text-green-600" /> Add Money to Wallet
                </h3>

                {/* Payment method tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => { setPayMethod('card'); setTopupMsg(''); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      payMethod === 'card'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    <CreditCard size={15} /> Credit / Debit Card
                  </button>
                  <button
                    onClick={() => { setPayMethod('manual'); setTopupMsg(''); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      payMethod === 'manual'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    <Smartphone size={15} /> Bank / Mobile Transfer
                  </button>
                </div>

                {/* ── Card Payment ── */}
                {payMethod === 'card' && (
                  <Elements stripe={stripePromise}>
                    <WalletCardForm
                      onSuccess={(newBalance) => {
                        setProfile(p => ({ ...p, walletBalance: newBalance }));
                        loadTopupRequests();
                      }}
                    />
                  </Elements>
                )}

                {/* ── Manual Transfer ── */}
                {payMethod === 'manual' && (
                  <>
                    {merchantBanks.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">
                        No payment accounts configured yet. Please contact support.
                      </p>
                    ) : (
                      <>
                        {/* Payment method dropdown */}
                        <div className="mb-4">
                          <label className="text-xs text-gray-500 mb-1 block">Select Payment Method *</label>
                          <select
                            value={selBankIdx}
                            onChange={e => setSelBankIdx(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-white"
                          >
                            <option value="">-- Choose a payment method --</option>
                            {merchantBanks.map((bank, idx) => (
                              <option key={idx} value={idx}>
                                {bank.bankName}{bank.isDefault ? ' ★ Recommended' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Show selected account details */}
                        {selBankIdx !== '' && (() => {
                          const bank = merchantBanks[Number(selBankIdx)];
                          const isMobile = ['jazzcash', 'easypaisa', 'nayapay', 'sadapay'].some(
                            m => bank.bankName.toLowerCase().includes(m)
                          );
                          return (
                            <div className={`p-4 rounded-xl border mb-5 ${bank.isDefault ? 'border-green-300 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {isMobile ? <Smartphone size={16} className="text-blue-600" /> : <Building2 size={16} className="text-blue-600" />}
                                <span className="font-bold text-gray-900">{bank.bankName}</span>
                                {bank.isDefault && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Account Title:</span>
                                  <p className="font-semibold text-gray-900">{bank.accountTitle}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">{isMobile ? 'Mobile / Account No:' : 'Account No:'}</span>
                                  <p className="font-mono font-bold text-gray-900 text-base">{bank.accountNumber}</p>
                                </div>
                                {bank.iban && (
                                  <div className="sm:col-span-2">
                                    <span className="text-gray-500">IBAN:</span>
                                    <p className="font-mono text-gray-700">{bank.iban}</p>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3">
                                Send the exact amount to the account above, then fill in the form below with your transaction reference.
                              </p>
                            </div>
                          );
                        })()}

                        {/* Request form */}
                        <form onSubmit={handleTopup} className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Amount (Rs) *</label>
                              <input
                                type="number" value={topupAmount}
                                onChange={e => setTopupAmount(e.target.value)}
                                placeholder="e.g. 500" min="1" required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Transaction Reference / TID *</label>
                              <input
                                type="text" value={topupRef}
                                onChange={e => setTopupRef(e.target.value)}
                                placeholder="e.g. TXN123456789" required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={selBankIdx === ''}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all self-start"
                          >
                            <Plus size={15} /> Submit Top-Up Request
                          </button>
                        </form>
                        {topupMsg && (
                          <p className={`text-sm mt-3 font-medium flex items-center gap-1.5 ${topupMsg.startsWith('Request submitted') ? 'text-green-600' : 'text-red-500'}`}>
                            {topupMsg.startsWith('Request submitted') ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {topupMsg}
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Top-Up History */}
              {topupRequests.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" /> Top-Up History
                  </h3>
                  <div className="flex flex-col gap-3">
                    {topupRequests.map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div>
                          <p className="font-bold text-gray-900">Rs {req.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{req.bankName || 'Transfer'} · {req.transactionRef}</p>
                          <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                          {req.adminNote && <p className="text-xs text-gray-600 mt-0.5 italic">{req.adminNote}</p>}
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redeem Points */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award size={18} className="text-purple-600" /> Redeem Bonus Points</h3>
                <form onSubmit={handleRedeem} className="flex gap-3">
                  <input type="number" value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)}
                    placeholder={`Available: ${profile?.bonusPoints || 0} pts`} min="1" max={profile?.bonusPoints || 0}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" required />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">Redeem</button>
                </form>
                {redeemMsg && <p className="text-sm mt-2 text-purple-600">{redeemMsg}</p>}
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No orders yet</p>
                  <Link to="/shop" className="mt-3 inline-block text-green-600 font-medium hover:underline">Start Shopping</Link>
                </div>
              ) : (
                orders.map((order) => {
                  const { label: statusLabel, cls: statusCls } = getOrderStatusBadge(order);
                  return (
                    <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Order #{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusCls}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-600">{order.orderItems.length} item(s)</p>
                          <p className="font-bold text-gray-900">{format(order.totalPrice)}</p>
                        </div>
                        <Link to={`/order/${order._id}`} className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
                          View <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Favorites Tab ── */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Saved Items ({favorites.length})</h2>
              {favorites.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Heart size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No saved items</p>
                  <Link to="/shop" className="mt-3 inline-block text-green-600 font-medium hover:underline">Explore products</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {favorites.map((p) => (
                    <Link to={`/product/${p.slug || p._id}`} key={p._id} className="block group">
                      <ProductCard id={p._id} slug={p.slug} title={p.name} price={p.price} oldPrice={p.oldPrice} rating={p.rating} reviews={p.numReviews}
                        image={p.image} images={p.images} countInStock={p.countInStock} unitsSold={p.unitsSold} savedByCount={p.savedByCount}
                        featureTags={p.featureTags} status={p.status} isFavorite={true} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Vouchers / Rewards Tab ── */}
          {activeTab === 'vouchers' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Gift size={20} className="text-green-600" /> Rewards & Vouchers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-extrabold text-green-700">{format(profile?.walletBalance || 0)}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm text-gray-600 mb-1">Bonus Points</p>
                  <p className="text-2xl font-extrabold text-purple-700">{profile?.bonusPoints || 0} pts</p>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 mb-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2"><Star size={16} /> How to earn rewards</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Earn 10 bonus points for every purchase</li>
                  <li>• Play games for 60 minutes → earn 10 in wallet</li>
                  <li>• 1 bonus point = {format(1)} when redeemed</li>
                </ul>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setActiveTab('wallet')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all">
                  <Award size={16} /> Redeem Points
                </button>
                <Link to="/games" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all">
                  <RotateCcw size={16} /> Play & Earn
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
