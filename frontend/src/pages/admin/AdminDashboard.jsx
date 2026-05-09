import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, Link, useLocation } from 'react-router-dom';
import axios from '../../utils/api';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  LayoutDashboard, Package, ShoppingBag, Users, ShoppingCart, UserCheck,
  Tag, FolderOpen, BookOpen, RotateCcw, Wallet, LogOut, Search,
  Bell, Download, TrendingUp, TrendingDown, ArrowUpRight, Store,
  Globe, Smartphone, CheckCircle, XCircle, Zap, Building, Filter, X,
  CreditCard, Activity, AlertTriangle, MessageCircle, Star,
} from 'lucide-react';

// ─── Sidebar navigation config ──────────────────────────────────────────────
const NAV = {
  MAIN: [
    { to: '/admin',               label: 'Dashboard',        icon: LayoutDashboard },
    { to: '/admin/productlist',   label: 'Products',         icon: Package },
    { to: '/admin/orderlist',     label: 'Orders',           icon: ShoppingBag },
    { to: '/admin/staff-manage',   label: 'Staff',            icon: Users },
    { to: '/admin/pos',           label: 'POS Terminal',     icon: ShoppingCart },
  ],
  OTHER: [
    { to: '/admin/categories',       label: 'Categories',       icon: FolderOpen },
    { to: '/admin/vouchers',         label: 'Vouchers',         icon: Tag },
    { to: '/admin/purchase-ledger',  label: 'Purchase Ledger',  icon: BookOpen },
    { to: '/admin/returns',          label: 'Returns',          icon: RotateCcw },
    { to: '/admin/wallet-requests',  label: 'Wallet Requests',  icon: Wallet },
    { to: '/admin/combos',           label: 'Combo Deals',      icon: Zap },
    { to: '/admin/pos-people',       label: 'POS People',       icon: UserCheck },
    { to: '/admin/activity',         label: 'Activity Log',     icon: Activity },
    { to: '/admin/messages',         label: 'Messages',         icon: MessageCircle },
    { to: '/admin/reviews',          label: 'Reviews',          icon: Star },
    { to: '/profile',                label: 'Bank Accounts',    icon: Building },
  ],
  ACCOUNT: [
    { to: '/',  label: 'Back to Store', icon: Store },
  ],
};

// ─── Semi-circle gauge chart ─────────────────────────────────────────────────
const SemiGauge = ({ channels, total }) => {
  const cx = 130, cy = 120;
  const rings = [
    { r: 88, sw: 13 },
    { r: 70, sw: 13 },
    { r: 52, sw: 13 },
  ];
  const COLORS = ['#111827', '#6b7280', '#d1d5db'];

  const arcPath = (cx, cy, r, pct) => {
    // Semi-circle: 180° (left) to 0° (right), clockwise fill
    const startRad = Math.PI;
    const endRad = Math.PI - Math.min(pct, 1) * Math.PI;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = pct > 0.5 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const bgPath = (cx, cy, r) => arcPath(cx, cy, r, 1);

  return (
    <svg viewBox="0 0 260 130" className="w-full max-w-[280px] mx-auto">
      {rings.map((ring, i) => {
        const pct = total > 0 ? (channels[i]?.value || 0) / total : 0;
        return (
          <g key={i}>
            <path d={bgPath(cx, cy, ring.r)} fill="none" stroke="#f3f4f6" strokeWidth={ring.sw} strokeLinecap="round" />
            {pct > 0 && (
              <path d={arcPath(cx, cy, ring.r, pct)} fill="none" stroke={COLORS[i]} strokeWidth={ring.sw} strokeLinecap="round" />
            )}
          </g>
        );
      })}
      <text x={cx} y={cy - 12} textAnchor="middle" style={{ fontSize: '20px', fontWeight: '800', fill: '#111827' }}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: '10px', fill: '#9ca3af', letterSpacing: '0.05em' }}>
        TOTAL SALES
      </text>
    </svg>
  );
};

// ─── Stat card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, trend, trendLabel, icon, color }) => {
  const Icon = icon;
  const up = (trend ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${color}`}>
          <Icon size={14} /> {label}
        </div>
        <button className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
        {sub && <span className="text-xs font-bold text-green-500 mb-0.5">{sub}</span>}
      </div>
      {trend != null && (
        <div className="flex items-center gap-1.5 text-xs">
          {up
            ? <TrendingUp size={13} className="text-green-500" />
            : <TrendingDown size={13} className="text-red-400" />}
          <span className={`font-bold ${up ? 'text-green-500' : 'text-red-400'}`}>
            {up ? '+' : ''}{trend}%
          </span>
          <span className="text-gray-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar item ─────────────────────────────────────────────────────────────
const NavItem = ({ to, label, icon, active, badge = 0 }) => {
  const Icon = icon;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-green-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

// ─── Custom tooltip for charts ────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: Rs {Number(p.value).toFixed(0)}
        </p>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [posStats, setPosStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [walkInCount, setWalkInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [msgCount, setMsgCount] = useState(0);
  const audioCtxRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  const playBeep = (double = false) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const doPlay = () => {
        const tone = (startTime) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          osc.start(startTime);
          osc.stop(startTime + 0.4);
        };
        const now = ctx.currentTime;
        tone(now);
        if (double) tone(now + 0.5);
      };
      if (ctx.state === 'suspended') ctx.resume().then(doPlay).catch(() => {});
      else doPlay();
    } catch { /* audio unavailable */ }
  };

  // Dashboard filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [channelFilter, setChannelFilter] = useState(''); // '' | 'online' | 'pos'
  const [revDays, setRevDays] = useState(7);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchMsgCount = () => {
      axios.get('/api/messages/conversations', { withCredentials: true })
        .then(({ data }) => {
          const total = Array.isArray(data) ? data.reduce((sum, c) => sum + (c.adminUnread || 0), 0) : 0;
          if (total > prevMsgCountRef.current) playBeep(true);
          prevMsgCountRef.current = total;
          setMsgCount(total);
        })
        .catch(() => {});
    };
    fetchMsgCount();
    const iv = setInterval(fetchMsgCount, 30000);
    return () => clearInterval(iv);
  }, [user]);

  // 60-second reminder beep while unread messages exist
  useEffect(() => {
    const id = setInterval(() => {
      if (prevMsgCountRef.current > 0) playBeep(false);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let cancelled = false;
    const fetchAll = async (silent = false) => {
      try {
        const params = new URLSearchParams({ pageSize: 200 });
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo)   params.set('to', dateTo);

        const [ordRes, prodRes, usrRes, posRes, revRes, walkRes, lowRes] = await Promise.all([
          axios.get(`/api/orders?${params}`, { withCredentials: true }),
          axios.get('/api/products'),
          axios.get('/api/users', { withCredentials: true }),
          axios.get('/api/transactions/pos/stats', { withCredentials: true }).catch(() => ({ data: null })),
          axios.get(`/api/orders/stats/revenue?days=${revDays}`, { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get('/api/people/customers', { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get('/api/products/low-stock', { withCredentials: true }).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setOrders(Array.isArray(ordRes.data) ? ordRes.data : ordRes.data.orders || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || []);
        setUsersList(usrRes.data);
        setPosStats(posRes.data);
        setRevenueData(revRes.data || []);
        setWalkInCount(Array.isArray(walkRes.data) ? walkRes.data.length : 0);
        setLowStockItems(Array.isArray(lowRes.data) ? lowRes.data : []);
      } catch {
        // silent during background polls
        if (!silent) console.error('Dashboard fetch failed');
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    };

    fetchAll(false);
    // Live updates: refresh every 20s so card payments and refunds reflect quickly
    const id = setInterval(() => fetchAll(true), 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user, dateFrom, dateTo, revDays]);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  // Apply channel filter to orders for recent table
  const visibleOrders = channelFilter === 'online'
    ? orders.filter(o => !o.shippingAddress?.address?.includes('POS') && !o.shippingAddress?.address?.includes('In-Store'))
    : channelFilter === 'pos'
    ? orders.filter(o => o.shippingAddress?.address === 'In-Store')
    : orders;

  const onlineRevenue = orders.filter(o => o.isPaid && !o.isCancelled).reduce((s, o) => s + o.totalPrice, 0);
  const posRevenue = posStats?.totalRevenue || 0;
  const totalRevenue = onlineRevenue + posRevenue;
  const paidCount = orders.filter(o => o.isPaid).length;
  const pendingCount = orders.filter(o => !o.isPaid && !o.isCancelled).length;
  const hasDateFilter = dateFrom || dateTo;

  // Revenue trend: compare last 3 days vs first 3 days of revenueData window
  const calcTrend = () => {
    if (revenueData.length < 4) return null;
    const half = Math.floor(revenueData.length / 2);
    const recent = revenueData.slice(-half).reduce((s, d) => s + (d.total || 0), 0);
    const older  = revenueData.slice(0, half).reduce((s, d) => s + (d.total || 0), 0);
    if (older === 0) return null;
    return parseFloat(((recent - older) / older * 100).toFixed(1));
  };
  const revTrend = calcTrend();

  // Top 3 products by units sold
  const top3 = [...products].sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0)).slice(0, 3);
  const topMax = top3[0]?.unitsSold || 1;

  // Channel gauge data
  const gaugeChannels = [
    { label: 'Online Store', value: onlineRevenue, icon: Globe },
    { label: 'POS / In-store', value: posRevenue, icon: ShoppingCart },
    { label: 'Walk-in', value: posRevenue * 0.15, icon: Smartphone },
  ];
  const gaugeTotal = orders.length + (posStats?.totalSales || 0);

  // Payment method breakdown for bar
  const payBreakdown = posStats?.paymentBreakdown
    ? Object.entries(posStats.paymentBreakdown).map(([method, amount]) => ({ method, amount }))
    : [];

  const BAR_COLORS = ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac', '#bbf7d0', '#f0fdf4'];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f6fa]">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">EC</span>
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-sm leading-none">OrganicPOS</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Main</p>
            <div className="flex flex-col gap-0.5">
              {NAV.MAIN.map(item => (
                <NavItem
                  key={item.to}
                  {...item}
                  active={location.pathname === item.to}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Other</p>
            <div className="flex flex-col gap-0.5">
              {NAV.OTHER.map(item => (
                <NavItem
                  key={item.to}
                  {...item}
                  active={location.pathname === item.to}
                  badge={item.to === '/admin/messages' ? msgCount : 0}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Account</p>
            <div className="flex flex-col gap-0.5">
              {NAV.ACCOUNT.map(item => (
                <NavItem key={item.to} {...item} active={false} />
              ))}
            </div>
          </div>
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-400">Welcome back, {user.name?.split(' ')[0]}! Here's what's happening.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <Filter size={13} className="text-gray-400 flex-shrink-0" />
            {/* Date range */}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-green-500" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-green-500" />

            {/* Channel filter */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-semibold">
              {[['', 'All'], ['online', 'Online'], ['pos', 'On-Site']].map(([val, label]) => (
                <button key={val} onClick={() => setChannelFilter(val)}
                  className={`px-3 py-1.5 transition-colors ${channelFilter === val ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Revenue window */}
            <select value={revDays} onChange={e => setRevDays(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-green-500 bg-white">
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>

            {hasDateFilter && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                <X size={12} /> Clear dates
              </button>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-green-600 font-bold text-xl">Loading…</div>
          ) : (
            <>
              {/* ── Stat cards ─────────────────────────────────────── */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Total Revenue" icon={TrendingUp} color="text-blue-500"
                  value={`Rs ${totalRevenue.toLocaleString('en', { maximumFractionDigits: 0 })}`}
                  sub={`+Rs ${(posStats?.todayRevenue || 0).toFixed(0)} today`}
                  trend={revTrend} trendLabel="vs previous period"
                />
                <StatCard
                  label="Total Orders" icon={ShoppingBag} color="text-orange-500"
                  value={orders.length.toLocaleString()}
                  sub={`${paidCount} paid · ${pendingCount} pending`}
                  trend={null}
                />
                <StatCard
                  label="Customers" icon={Users} color="text-purple-500"
                  value={usersList.length.toLocaleString()}
                  sub={walkInCount > 0 ? `+${walkInCount} walk-in` : null}
                  trend={null}
                />
                <StatCard
                  label="POS Today" icon={ShoppingCart} color="text-green-600"
                  value={`Rs ${(posStats?.todayRevenue || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`}
                  sub={`${posStats?.todaySales || 0} txns`}
                  trend={null}
                />
              </div>

              {/* ── Low Stock Alert ────────────────────────────────── */}
              {lowStockItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={16} className="text-amber-600" />
                      </div>
                      <h3 className="font-bold text-amber-900 text-sm">Low Stock Alert</h3>
                      <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {lowStockItems.length} products
                      </span>
                    </div>
                    <Link to="/admin/productlist" className="text-xs text-amber-700 font-semibold hover:text-amber-900 transition-colors">
                      View all →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lowStockItems.slice(0, 8).map((p) => (
                      <Link
                        key={p._id}
                        to={`/admin/product/${p._id}/edit`}
                        className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 hover:border-amber-400 transition-colors"
                      >
                        {(p.images?.[0] || p.image) && (
                          <img
                            src={p.images?.[0] || p.image}
                            alt={p.name}
                            className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">{p.name}</p>
                          <p className="text-xs text-red-600 font-bold">{p.countInStock} left</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Middle row ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Channel Performance */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900">Channel Performance</h3>
                    <button className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100">
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Revenue by sales channel</p>

                  <SemiGauge channels={gaugeChannels} total={gaugeTotal} />

                  <div className="flex flex-col gap-3 mt-4">
                    {[
                      { label: 'Online Store', value: orders.length, revenue: onlineRevenue, color: '#111827', icon: Globe },
                      { label: 'POS / In-store', value: posStats?.totalSales || 0, revenue: posRevenue, color: '#6b7280', icon: ShoppingCart },
                      { label: 'Walk-in (est.)', value: Math.round((posStats?.totalSales || 0) * 0.15), revenue: Math.round(posRevenue * 0.15), color: '#d1d5db', icon: Smartphone },
                    ].map((ch) => {
                      const Icon = ch.icon;
                      const pct = gaugeTotal > 0 ? ((ch.value / gaugeTotal) * 100).toFixed(1) : 0;
                      return (
                        <div key={ch.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ch.color }} />
                            <Icon size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{ch.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{ch.value} units</span>
                            <span className="text-xs font-bold text-gray-900">Rs {ch.revenue.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${Number(pct) > 40 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Average Sales</h3>
                      {revenueData.length > 0 && (
                        <p className="text-2xl font-extrabold text-gray-900 mt-1">
                          Rs {revenueData.reduce((s, d) => s + d.revenue, 0).toLocaleString('en', { maximumFractionDigits: 0 })}
                          <span className="text-sm font-semibold text-green-500 ml-2">↑ 1.8%</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Revenue</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Target</span>
                    </div>
                  </div>

                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#22c55e' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No revenue data yet</div>
                  )}
                </div>
              </div>

              {/* ── Bottom row ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Top 3 products */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Top 3 Products</h3>
                    <Link to="/admin/productlist" className="text-xs text-green-600 font-semibold hover:underline">View all</Link>
                  </div>

                  {top3.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={top3.map(p => ({ name: p.name?.slice(0, 12) + (p.name?.length > 12 ? '…' : ''), sold: p.unitsSold || 0 }))} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl">
                              <p className="font-semibold">{label}</p>
                              <p className="text-green-400">{payload[0].value} units sold</p>
                            </div>
                          ) : null} />
                          <Bar dataKey="sold" radius={[6, 6, 0, 0]}>
                            {top3.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="flex flex-col gap-2 mt-3">
                        {top3.map((p, i) => (
                          <div key={p._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: BAR_COLORS[i] }}>
                                {i + 1}
                              </span>
                              <span className="text-xs text-gray-700 font-medium truncate max-w-[110px]">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${((p.unitsSold || 0) / topMax) * 100}%`, background: BAR_COLORS[i] }} />
                              </div>
                              <span className="text-xs font-bold text-gray-900 w-6 text-right">{p.unitsSold || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No product data</div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Recent Orders
                      {channelFilter && <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{channelFilter}</span>}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{visibleOrders.length} shown</span>
                      <Link to="/admin/orderlist" className="text-xs text-green-600 font-semibold hover:underline">View all</Link>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-50">
                          <th className="px-5 py-3 font-semibold">Order</th>
                          <th className="px-5 py-3 font-semibold">Customer</th>
                          <th className="px-5 py-3 font-semibold">Amount</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {visibleOrders.slice(0, 6).map(order => (
                          <tr key={order._id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3">
                              <Link to={`/order/${order._id}`} className="text-xs font-bold text-green-600 hover:underline">
                                #{order._id.slice(-6).toUpperCase()}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-600">{order.user?.name || 'Deleted'}</td>
                            <td className="px-5 py-3 text-xs font-bold text-gray-900">Rs {order.totalPrice.toFixed(0)}</td>
                            <td className="px-5 py-3">
                              {order.isCancelled ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  <XCircle size={9} /> Cancelled
                                </span>
                              ) : order.isDelivered ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <CheckCircle size={9} /> Delivered
                                </span>
                              ) : order.isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Shipped
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr><td colSpan={4} className="px-5 py-10 text-center text-xs text-gray-400">No orders yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* POS payment breakdown */}
                  {payBreakdown.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">POS by Payment Method</p>
                      <div className="flex flex-wrap gap-2">
                        {payBreakdown.map(({ method, amount }) => {
                          const isBank = ['Online', 'Card', 'JazzCash', 'Easypaisa', 'NayaPay', 'SadaPay'].includes(method);
                          return (
                            <div key={method} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${isBank ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                              {isBank && <CreditCard size={11} className="text-blue-500" />}
                              <span className={`text-xs font-semibold ${isBank ? 'text-blue-700' : 'text-gray-700'}`}>{method}</span>
                              <span className="text-xs font-bold text-green-600">Rs {Number(amount).toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Stats summary strip ─────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Paid Orders', value: paidCount, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Pending Orders', value: pendingCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Products Listed', value: products.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'POS All-Time Txns', value: posStats?.totalSales || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl px-5 py-4 flex items-center justify-between`}>
                    <p className="text-xs font-semibold text-gray-600">{label}</p>
                    <p className={`text-xl font-extrabold ${color}`}>{value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
