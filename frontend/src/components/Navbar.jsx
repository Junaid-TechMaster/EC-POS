import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, Search, Heart, Gamepad2, ChevronDown,
  Menu, X, Wallet, LogOut, Settings, Package, MessageSquare, BarChart2,
  Flame, Sparkles, TrendingUp, Tag, Folder
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';

const FLAG_API = (code) => `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

const Navbar = () => {
  const { cartCount, openCart } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const { currency, changeCurrency, SUPPORTED_CURRENCIES } = useContext(CurrencyContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');

  const navigate = useNavigate();
  const currencyRef = useRef(null);
  const userMenuRef = useRef(null);
  const exploreRef = useRef(null);

  // Auto-detect location via free IP API
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data.success && data.country_code) {
          setCountryCode(data.country_code);
          setCountryName(data.country);
        }
      } catch {
        // silent fail
      }
    };
    detect();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-base">🦊</span>
            </div>
            <span className="font-extrabold text-gray-900 text-lg hidden sm:block"><span className="text-orange-500">CoZy</span> FoX</span>
          </Link>

          {/* Explore Dropdown */}
          <div className="relative hidden md:block" ref={exploreRef}>
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-green-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Folder size={16} /> All Categories <ChevronDown size={14} />
            </button>
            {exploreOpen && (
              <div className="absolute left-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl w-56 py-2 z-50">
                <Link to="/categories" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 font-semibold border-b border-gray-100">
                  <Folder size={16} className="text-gray-400" /> All Categories
                </Link>
                <Link to="/shop" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700">
                  <Package size={16} className="text-gray-400" /> All Products
                </Link>
                <Link to="/tag/featured" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-700">
                  <Sparkles size={16} className="text-purple-400" /> Featured
                </Link>
                <Link to="/tag/hot" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-700">
                  <Flame size={16} className="text-red-400" /> Hot Products
                </Link>
                <Link to="/tag/bestseller" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-700">
                  <TrendingUp size={16} className="text-amber-400" /> Best Sellers
                </Link>
                <Link to="/tag/new" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700">
                  <Sparkles size={16} className="text-blue-400" /> New Arrivals
                </Link>
                <Link to="/tag/sale" onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700">
                  <Tag size={16} className="text-green-400" /> Sale Items
                </Link>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-500 bg-gray-50"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Location Flag */}
            {countryCode && (
              <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-1">
                <img src={FLAG_API(countryCode)} alt={countryName} className="w-5 h-4 rounded-sm object-cover" />
                <span>{countryCode}</span>
              </div>
            )}

            {/* Currency Switcher */}
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-full px-3 py-1 hover:border-green-500 transition-colors"
              >
                {currency} <ChevronDown size={14} />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-2 z-50">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { changeCurrency(c.code); setCurrencyOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${currency === c.code ? 'text-green-600 font-bold' : 'text-gray-700'}`}
                    >
                      <span>{c.code}</span>
                      <span className="text-gray-400 text-xs">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link to="/favorites" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors hidden sm:block">
              <Heart size={22} />
            </Link>

            {/* Compare */}
            <Link to="/compare" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors hidden sm:block" title="Compare Products">
              <BarChart2 size={22} />
            </Link>

            {/* Contact */}
            <Link to="/contact" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors hidden sm:block" title="Contact Us">
              <MessageSquare size={22} />
            </Link>

            {/* Games */}
            <Link to="/games" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors hidden sm:block" title="Play & Earn">
              <Gamepad2 size={22} />
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
              title="View Cart"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-green-50 text-green-700 rounded-full pl-1 pr-3 py-1 text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border border-green-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center">
                      <User size={13} />
                    </span>
                  )}
                  <span className="hidden sm:block max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl w-52 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={16} /> My Profile
                    </Link>
                    <Link to="/profile?tab=wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Wallet size={16} /> Wallet
                    </Link>
                    <Link to="/profile?tab=orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Package size={16} /> My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    {user.role === 'staff' && (
                      <Link to="/staff" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={16} /> Staff Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search + Links */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </button>
            </form>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => changeCurrency(c.code)}
                    className={`text-xs px-2 py-1 rounded-full border ${currency === c.code ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600'}`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
              {countryCode && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <img src={FLAG_API(countryCode)} alt={countryName} className="w-5 h-4 rounded-sm" />
                  <span>{countryName}</span>
                </div>
              )}
            </div>
            <nav className="flex flex-col gap-1">
              <Link to="/shop" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 font-semibold hover:text-green-600 flex items-center gap-2"><Package size={16} className="text-gray-400" /> All Products</Link>
              <Link to="/categories" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 font-semibold hover:text-green-600 flex items-center gap-2"><Folder size={16} className="text-gray-400" /> Categories</Link>
              <div className="border-t border-gray-100 my-1" />
              <Link to="/tag/featured" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-purple-600 flex items-center gap-2"><Sparkles size={15} className="text-purple-400" /> Featured</Link>
              <Link to="/tag/hot" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-red-600 flex items-center gap-2"><Flame size={15} className="text-red-400" /> Hot Products</Link>
              <Link to="/tag/bestseller" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-amber-600 flex items-center gap-2"><TrendingUp size={15} className="text-amber-400" /> Best Sellers</Link>
              <Link to="/tag/new" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-blue-600 flex items-center gap-2"><Sparkles size={15} className="text-blue-400" /> New Arrivals</Link>
              <Link to="/tag/sale" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-green-600 flex items-center gap-2"><Tag size={15} className="text-green-400" /> Sale Items</Link>
              <div className="border-t border-gray-100 my-1" />
              <Link to="/favorites" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-green-600 flex items-center gap-2"><Heart size={15} className="text-gray-400" /> Wishlist</Link>
              <Link to="/compare" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-green-600 flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Compare</Link>
              <Link to="/games" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-green-600 flex items-center gap-2"><Gamepad2 size={15} className="text-gray-400" /> Games & Earn</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="py-2 text-gray-700 hover:text-green-600 flex items-center gap-2"><MessageSquare size={15} className="text-gray-400" /> Contact Us</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
