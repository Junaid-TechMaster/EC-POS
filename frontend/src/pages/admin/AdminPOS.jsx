import { useState, useEffect, useContext, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ShoppingCart, CreditCard, Banknote, Printer, X, Plus, Minus,
  Search, User, Tag, TrendingUp, Smartphone, Wallet, ArrowLeft,
  Store, Globe, MapPin, Building, Copy, Check, FolderOpen,
} from 'lucide-react';

const THERMAL_RECEIPT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    .thermal-receipt, .thermal-receipt * { visibility: visible !important; }
    .thermal-receipt {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 80mm !important;
      font-size: 11px !important;
      font-family: 'Courier New', monospace !important;
      color: #000 !important;
      background: #fff !important;
      padding: 4mm !important;
    }
    @page { size: 80mm auto; margin: 0; }
  }
`;

const PAYMENT_METHODS = [
  { id: 'Cash',      label: 'Cash',      icon: Banknote,    color: 'bg-green-600 hover:bg-green-700' },
  { id: 'Card',      label: 'Card',      icon: CreditCard,  color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'JazzCash',  label: 'JazzCash',  icon: Smartphone,  color: 'bg-red-600 hover:bg-red-700' },
  { id: 'Easypaisa', label: 'Easypaisa', icon: Smartphone,  color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'NayaPay',   label: 'NayaPay',   icon: Wallet,      color: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'SadaPay',   label: 'SadaPay',   icon: Wallet,      color: 'bg-orange-600 hover:bg-orange-700' },
  { id: 'Online',    label: 'Online',    icon: CreditCard,  color: 'bg-indigo-600 hover:bg-indigo-700' },
];

const AdminPOS = () => {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [posCart, setPosCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Customer selector
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const customerTimerRef = useRef(null);

  // Sale type
  const [saleType, setSaleType] = useState('onsite');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);

  // Barcode scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef(null);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // Cashier session
  const [currentSession, setCurrentSession] = useState(null);
  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchAll = async () => {
      try {
        const [prodRes, statsRes, banksRes, catRes, cashierRes] = await Promise.all([
          axios.get('/api/products?showAll=1&pageSize=500'),
          axios.get('/api/transactions/pos/stats', { withCredentials: true }).catch(() => ({ data: null })),
          axios.get('/api/users/merchant/banks', { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get('/api/categories').catch(() => ({ data: [] })),
          axios.get('/api/cashier/current', { withCredentials: true }).catch(() => ({ data: null })),
        ]);
        const arr = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || [];
        setProducts(arr);
        setStats(statsRes.data);
        setBankAccounts(Array.isArray(banksRes.data) ? banksRes.data : []);
        setCategories(catRes.data || []);
        setCurrentSession(cashierRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // Debounced customer search
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    clearTimeout(customerTimerRef.current);
    customerTimerRef.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const { data } = await axios.get(
          `/api/people/customers?search=${encodeURIComponent(customerSearch)}`,
          { withCredentials: true }
        );
        setCustomerResults(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setCustomerLoading(false);
      }
    }, 350);
    return () => clearTimeout(customerTimerRef.current);
  }, [customerSearch]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineSales(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    import('../../utils/posOfflineQueue.js').then(({ getPendingSales }) => {
      getPendingSales().then((sales) => setPendingCount(sales.length));
    });
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineSales = async () => {
    const { getPendingSales, deletePendingSale } = await import('../../utils/posOfflineQueue.js');
    const pending = await getPendingSales();
    if (pending.length === 0) return;
    let synced = 0;
    for (const sale of pending) {
      try {
        const saleId = sale.id;
        const saleData = Object.fromEntries(
          Object.entries(sale).filter(([k]) => k !== 'id' && k !== 'queuedAt')
        );
        await axios.post('/api/transactions/pos', saleData, { withCredentials: true });
        await deletePendingSale(saleId);
        synced++;
      } catch {
        // skip failed sync — will retry on next reconnect
      }
    }
    if (synced > 0) { setPendingCount(0); alert(`${synced} offline sale(s) synced successfully.`); }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const discountAmt = parseFloat(discount) || 0;
  const cartSubtotal = posCart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmt);

  // Combined product filter: search text + category
  const filteredProducts = products.filter(p => {
    const matchSearch = !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // addToCart / addToPos — shared logic (addToPos is used by barcode handler)
  const addToCart = (product) => {
    if (product.countInStock === 0 || product.status === 'out_of_stock' || product.status === 'draft') return;
    const existItem = posCart.find(x => x.product === product._id);
    if (existItem) {
      // Don't exceed available stock
      if (existItem.qty >= product.countInStock) {
        alert(`Only ${product.countInStock} units available`);
        return;
      }
      setPosCart(posCart.map(x => x.product === product._id ? { ...existItem, qty: existItem.qty + 1 } : x));
    } else {
      setPosCart([...posCart, { product: product._id, name: product.name, price: product.price, image: product.images?.[0] || product.image, qty: 1, maxStock: product.countInStock }]);
    }
  };

  const addToPos = (product) => addToCart(product);

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const { data } = await axios.get(`/api/products/sku/${encodeURIComponent(barcodeInput.trim())}`);
      addToPos(data);
      setBarcodeInput('');
    } catch {
      alert('Product not found for SKU: ' + barcodeInput);
      setBarcodeInput('');
    }
  };

  const updateQty = (id, amount) => {
    const item = posCart.find(x => x.product === id);
    if (!item) return;
    if (item.qty === 1 && amount === -1) {
      setPosCart(posCart.filter(x => x.product !== id));
    } else {
      const newQty = item.qty + amount;
      if (amount > 0 && newQty > item.maxStock) {
        alert(`Only ${item.maxStock} units available`);
        return;
      }
      setPosCart(posCart.map(x => x.product === id ? { ...x, qty: newQty } : x));
    }
  };

  const clearCart = () => {
    setPosCart([]);
    setDiscount('');
    setSelectedCustomer(null);
    setCustomerSearch('');
  };

  const handleCheckout = async () => {
    if (posCart.length === 0) return alert('Cart is empty!');
    const salePayload = {
      products: posCart.map(item => ({ product: item.product, qty: item.qty, price: item.price, name: item.name })),
      customerId: selectedCustomer?._id || null,
      totalAmount: cartTotal,
      paymentMethod,
      discount: discountAmt,
      saleType,
      deliveryAddress: saleType === 'online' ? deliveryAddress : '',
    };

    if (!isOnline) {
      const { queueSale } = await import('../../utils/posOfflineQueue.js');
      await queueSale(salePayload);
      setPendingCount(c => c + 1);
      clearCart();
      alert('Sale saved offline. Will sync when connection is restored.');
      return;
    }

    try {
      const { data } = await axios.post('/api/transactions/pos', salePayload, { withCredentials: true });
      setReceiptData({ ...data, paymentMethod, discount: discountAmt, subtotal: cartSubtotal });
      clearCart();
      // Refresh stats + stock
      const [statsRes, prodRes] = await Promise.all([
        axios.get('/api/transactions/pos/stats', { withCredentials: true }),
        axios.get('/api/products?showAll=1&pageSize=500'),
      ]);
      setStats(statsRes.data);
      const arr = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || [];
      setProducts(arr);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Unique categories from loaded products (using the categories API list)
  const categoryOptions = categories.map(c => c.name);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <style>{THERMAL_RECEIPT_CSS}</style>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-sm font-semibold px-4 py-2 text-center flex-shrink-0">
          ⚡ You are offline. Sales will be saved locally and synced when reconnected.
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </div>
      )}

      {/* Open Register modal */}
      {showOpenRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Open Register</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash (Rs)</label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 mb-4" placeholder="0" />
            <div className="flex gap-3">
              <button onClick={() => setShowOpenRegister(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  const { data } = await axios.post('/api/cashier/open', { openingCash: Number(openingCash) || 0 }, { withCredentials: true });
                  setCurrentSession(data);
                  setShowOpenRegister(false);
                  setOpeningCash('');
                } catch (err) { alert(err.response?.data?.message || 'Failed to open register'); }
              }} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Open Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register modal */}
      {showCloseRegister && currentSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Close Register</h3>
            <p className="text-sm text-gray-500 mb-4">Session opened: {new Date(currentSession.openedAt).toLocaleString()}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Cash Count (Rs)</label>
            <input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 mb-3" placeholder="0" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 mb-4 resize-none" rows={2} placeholder="End of shift notes..." />
            <div className="flex gap-3">
              <button onClick={() => setShowCloseRegister(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  const { data } = await axios.put('/api/cashier/close', { closingCash: Number(closingCash) || 0, notes: sessionNotes }, { withCredentials: true });
                  setCurrentSession(null);
                  setShowCloseRegister(false);
                  alert(`Register closed. Total sales: Rs ${data.totalRevenue?.toLocaleString()} (${data.totalSalesCount} transactions)`);
                } catch (err) { alert(err.response?.data?.message || 'Failed to close register'); }
              }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Close Register</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

      {/* LEFT: Product Grid */}
      <div className="w-2/3 p-4 overflow-y-auto flex flex-col gap-3">

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <TrendingUp className="text-green-500" size={22} />
              <div>
                <p className="text-xs text-gray-500">Today's Sales</p>
                <p className="font-bold text-gray-800">Rs {stats.todayRevenue?.toFixed(0) ?? 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <ShoppingCart className="text-blue-500" size={22} />
              <div>
                <p className="text-xs text-gray-500">Transactions Today</p>
                <p className="font-bold text-gray-800">{stats.todaySales ?? 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <Tag className="text-purple-500" size={22} />
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="font-bold text-gray-800">Rs {stats.totalRevenue?.toFixed(0) ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header + Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={22} /> Store Terminal
          </h1>
          {/* Session status */}
          <div className="flex items-center gap-2 text-xs">
            {currentSession ? (
              <button onClick={() => setShowCloseRegister(true)} className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold hover:bg-green-200 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Register Open
              </button>
            ) : (
              <button onClick={() => setShowOpenRegister(true)} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-200 transition-colors">
                Open Register
              </button>
            )}
          </div>
          <div className="ml-auto relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-400 w-56"
            />
          </div>
        </div>

        {/* Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSearch} className="flex gap-2">
          <input
            ref={barcodeRef}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode / enter SKU..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 bg-white"
            autoFocus
          />
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            Add
          </button>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FolderOpen size={13} /> All
          </button>
          {categoryOptions.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-green-600 font-bold">Loading Inventory...</p>
        ) : (
          <>
            <p className="text-xs text-gray-400">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => {
                const outOfStock = p.countInStock === 0 || p.status === 'out_of_stock' || p.status === 'draft';
                return (
                  <div
                    key={p._id}
                    onClick={() => !outOfStock && addToCart(p)}
                    className={`bg-white border rounded-xl p-3 flex flex-col items-center text-center select-none transition-all ${
                      outOfStock
                        ? 'opacity-50 cursor-not-allowed border-gray-100'
                        : 'cursor-pointer hover:border-green-500 hover:shadow-md border-gray-200'
                    }`}
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {(p.images?.[0] || p.image) ? (
                        <img
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Img</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xs text-gray-800 line-clamp-2 mb-1">{p.name}</h3>
                    <p className="text-green-600 font-bold text-sm">Rs {p.price.toFixed(0)}</p>
                    {outOfStock ? (
                      <span className="text-xs text-red-500 mt-0.5 font-semibold">Out of Stock</span>
                    ) : p.countInStock <= 5 ? (
                      <span className="text-xs text-orange-500 mt-0.5">{p.countInStock} left</span>
                    ) : null}
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-4 py-12 text-center text-gray-400 text-sm">No products found</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Register */}
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">

        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Current Sale</h2>
          <button onClick={clearCart} className="text-red-500 text-xs font-bold hover:underline">Clear All</button>
        </div>

        {/* Sale Type Toggle */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setSaleType('onsite')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${saleType === 'onsite' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Store size={13} /> Counter Sale
            </button>
            <button
              onClick={() => setSaleType('online')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${saleType === 'online' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Globe size={13} /> Delivery Order
            </button>
          </div>
          {saleType === 'online' && (
            <div className="mt-2 relative">
              <MapPin size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address..."
                rows={2}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
          )}
        </div>

        {/* Customer Search */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <User size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">{selectedCustomer.name}</span>
                {selectedCustomer.phone && <span className="text-xs text-green-600">{selectedCustomer.phone}</span>}
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-green-600 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search customer (optional)..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
              />
              {customerLoading && <span className="absolute right-3 top-2 text-xs text-gray-400">...</span>}
              {customerResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {customerResults.map(c => (
                    <button
                      key={c._id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex justify-between"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {posCart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Cart is empty</div>
          ) : (
            posCart.map(item => (
              <div key={item.product} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-semibold text-xs text-gray-800 truncate">{item.name}</h4>
                  <p className="text-green-600 font-medium text-xs">Rs {(item.price * item.qty).toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => updateQty(item.product, -1)} className="p-1 hover:bg-white rounded-md"><Minus size={12} /></button>
                  <span className="font-bold text-xs w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.product, 1)} className="p-1 hover:bg-white rounded-md"><Plus size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Discount + Payment */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-3">

          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-400" />
            <input
              type="number" min="0"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              placeholder="Discount (Rs)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-400"
            />
          </div>

          <div className="space-y-1">
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>Rs {cartSubtotal.toFixed(0)}</span>
              </div>
            )}
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span><span>- Rs {discountAmt.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-gray-900">
              <span>Total</span><span>Rs {cartTotal.toFixed(0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map(pm => {
              const PMIcon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`rounded-lg py-1.5 px-1 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-gray-900 text-white ring-2 ring-offset-1 ring-gray-900'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <PMIcon size={14} />
                  <span className="leading-tight">{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bank Account Details */}
          {paymentMethod !== 'Cash' && bankAccounts.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                <Building size={12} /> Payment Details
              </p>
              {bankAccounts.map((acc, i) => (
                <div key={i} className="bg-white rounded-lg p-2 mb-1.5 last:mb-0">
                  <p className="text-xs font-bold text-gray-800">{acc.bankName}</p>
                  <p className="text-xs text-gray-600">{acc.accountTitle}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 font-mono">{acc.accountNumber}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(acc.accountNumber); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  {acc.iban && <p className="text-xs text-gray-400 font-mono mt-0.5">IBAN: {acc.iban}</p>}
                </div>
              ))}
            </div>
          )}

          <button
            disabled={posCart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingCart size={18} /> Charge — Rs {cartTotal.toFixed(0)}
          </button>
        </div>
      </div>
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="bg-gray-100 p-4 flex justify-between items-center border-b print:hidden">
              <h3 className="font-bold text-gray-800">Transaction Complete</h3>
              <button onClick={() => setReceiptData(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-8 bg-white text-gray-900 font-mono text-sm">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest mb-1">EC-POS</h2>
                <p className="text-gray-500 text-xs">POS Terminal Receipt</p>
                <p className="text-gray-500 text-xs">#{receiptData._id?.substring(0, 10)}</p>
                <p className="text-gray-500 text-xs">{new Date(receiptData.createdAt).toLocaleString()}</p>
                {receiptData.customer && (
                  <p className="text-gray-700 text-xs mt-1 font-semibold">Customer: {receiptData.customer.name || 'Walk-in'}</p>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 py-4 mb-4 flex flex-col gap-2">
                {receiptData.products?.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="w-2/3 pr-2">{item.qty}x {item.name}</span>
                    <span className="w-1/3 text-right">Rs {(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {receiptData.discount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal</span><span>Rs {receiptData.subtotal?.toFixed(0)}</span>
                </div>
              )}
              {receiptData.discount > 0 && (
                <div className="flex justify-between text-sm text-red-500 mb-1">
                  <span>Discount</span><span>- Rs {receiptData.discount?.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black pt-2 border-t-2 border-black">
                <span>TOTAL</span><span>Rs {receiptData.totalAmount?.toFixed(0)}</span>
              </div>
              <div className="text-center mt-6 text-xs text-gray-500">
                Paid via {receiptData.paymentMethod}<br />
                Thank you for your purchase!
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-900 hover:bg-black text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2"
              >
                <Printer size={18} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPOS;
