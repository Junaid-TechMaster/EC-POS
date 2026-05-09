import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  Plus, Trash2, BookOpen, ChevronDown, ArrowLeft,
  Package, TrendingUp, ShoppingCart, AlertCircle, Search, Edit2, Check, X, Building2, Clock,
} from 'lucide-react';

const PurchaseLedger = () => {
  const { user } = useContext(AuthContext);

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stock search + inline edit
  const [stockSearch, setStockSearch] = useState('');
  const [editingStock, setEditingStock] = useState(null); // product _id being edited
  const [editStockVal, setEditStockVal] = useState('');
  const [manualAdjustments, setManualAdjustments] = useState([]);

  // Add vendor modal
  const [vendorModal, setVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCompany, setNewVendorCompany] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [vendorSaving, setVendorSaving] = useState(false);

  // Form state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [items, setItems] = useState([{ product: '', qty: 1, costPrice: 0 }]);

  const fetchAll = useCallback(async () => {
    try {
      const [vendorsRes, productsRes, purchasesRes] = await Promise.all([
        axios.get('/api/people/vendors', { withCredentials: true }),
        axios.get('/api/products?pageSize=500&showAll=1', { withCredentials: true }),
        axios.get('/api/transactions/purchases', { withCredentials: true }),
      ]);
      setVendors(vendorsRes.data || []);
      const prods = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products || [];
      setProducts(prods);
      setPurchases(purchasesRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addItem = () => setItems(prev => [...prev, { product: '', qty: 1, costPrice: 0 }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  // When product is selected, auto-fill its last costPrice
  const handleProductSelect = (idx, productId) => {
    updateItem(idx, 'product', productId);
    if (productId) {
      const prod = products.find(p => p._id === productId);
      if (prod && prod.costPrice > 0) {
        updateItem(idx, 'costPrice', prod.costPrice);
      }
    }
  };

  const totalCost = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.costPrice), 0);
  const totalUnits = items.reduce((sum, i) => sum + Number(i.qty), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedVendor) { setError('Please select a vendor'); return; }
    const validItems = items.filter(i => i.product && Number(i.qty) > 0 && Number(i.costPrice) >= 0);
    if (validItems.length === 0) { setError('Add at least one item with a product and quantity'); return; }

    setSaving(true);
    try {
      await axios.post(
        '/api/transactions/purchases',
        {
          vendor: selectedVendor,
          items: validItems.map(i => ({ product: i.product, qty: Number(i.qty), costPrice: Number(i.costPrice) })),
          totalCost,
        },
        { withCredentials: true }
      );

      // Refresh all data so stock counts update in the product list
      setSelectedVendor('');
      setInvoiceRef('');
      setItems([{ product: '', qty: 1, costPrice: 0 }]);
      setSuccess(`Purchase recorded! Stock updated for ${validItems.length} product(s).`);
      setTimeout(() => setSuccess(''), 5000);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveStockEdit = async (productId) => {
    const val = Number(editStockVal);
    if (isNaN(val) || val < 0) return;
    const product = products.find(p => p._id === productId);
    const oldStock = product?.countInStock ?? 0;
    try {
      await axios.put(`/api/products/${productId}`, { countInStock: val }, { withCredentials: true });
      setEditingStock(null);
      setManualAdjustments(prev => [{
        _id: `adj-${Date.now()}`,
        productName: product?.name || 'Unknown Product',
        oldStock,
        newStock: val,
        diff: val - oldStock,
        adjustedAt: new Date(),
      }, ...prev]);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const addVendor = async (e) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorCompany.trim()) return;
    setVendorSaving(true);
    try {
      const { data } = await axios.post(
        '/api/people/vendors',
        { name: newVendorName.trim(), company: newVendorCompany.trim(), phone: newVendorPhone.trim(), email: newVendorEmail.trim() },
        { withCredentials: true }
      );
      setVendors(prev => [data, ...prev]);
      setSelectedVendor(data._id);
      setVendorModal(false);
      setNewVendorName(''); setNewVendorCompany(''); setNewVendorPhone(''); setNewVendorEmail('');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setVendorSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const getProduct = (id) => products.find(p => p._id === id);
  const filteredStockProducts = stockSearch.trim()
    ? products.filter(p => p.name.toLowerCase().includes(stockSearch.toLowerCase()))
    : products;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

      {/* Page header */}
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-3 transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <BookOpen className="text-green-600" size={24} /> Purchase Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Record vendor purchases to update product inventory</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Package size={15} className="text-green-600" />
              <span><strong className="text-gray-800">{products.length}</strong> products</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <TrendingUp size={15} className="text-green-600" />
              <span><strong className="text-gray-800">{purchases.length}</strong> purchases</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-green-600">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading…</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── LEFT: New Purchase Form ── */}
          <div className="xl:w-[560px] flex-shrink-0">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-green-600" /> Record New Purchase
                </h2>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl text-sm font-semibold">
                    ✓ {success}
                  </div>
                )}

                {/* Vendor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor <span className="text-red-400">*</span></label>
                    <button type="button" onClick={() => setVendorModal(true)} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700">
                      <Plus size={12} /> Add Vendor
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedVendor}
                      onChange={e => setSelectedVendor(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-800 appearance-none focus:outline-none focus:border-green-500 bg-white"
                    >
                      <option value="">— Select Vendor —</option>
                      {vendors.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.name}{v.company ? ` (${v.company})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Invoice / Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Invoice / Reference No. <span className="text-gray-400">(optional)</span></label>
                  <input
                    value={invoiceRef}
                    onChange={e => setInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-2024-001"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items <span className="text-red-400">*</span></label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
                    >
                      <Plus size={13} /> Add Row
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 mb-1.5 px-1">
                    <div className="col-span-5 text-xs text-gray-400 font-medium">Product</div>
                    <div className="col-span-2 text-xs text-gray-400 font-medium text-center">Qty</div>
                    <div className="col-span-4 text-xs text-gray-400 font-medium">Cost Price (Rs)</div>
                    <div className="col-span-1" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {items.map((item, idx) => {
                      const prod = getProduct(item.product);
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                          {/* Product dropdown */}
                          <div className="col-span-5">
                            <div className="relative">
                              <select
                                value={item.product}
                                onChange={e => handleProductSelect(idx, e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-xs appearance-none focus:outline-none focus:border-green-500 bg-white"
                              >
                                <option value="">— Product —</option>
                                {products.map(p => (
                                  <option key={p._id} value={p._id}>
                                    {p.name} {p.countInStock !== undefined ? `[${p.countInStock}]` : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {prod && (
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 px-1">
                                <span className={`font-medium ${prod.countInStock === 0 ? 'text-red-500' : prod.countInStock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                                  Stock: {prod.countInStock}
                                </span>
                                {prod.costPrice > 0 && (
                                  <span>· Last cost: Rs {prod.costPrice}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Qty */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => updateItem(idx, 'qty', e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-2.5 py-2.5 text-sm text-center focus:outline-none focus:border-green-500"
                            />
                          </div>

                          {/* Cost Price */}
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice}
                              onChange={e => updateItem(idx, 'costPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                            />
                            {item.product && Number(item.costPrice) > 0 && (
                              <p className="text-xs text-gray-400 mt-1 px-1">
                                Subtotal: Rs {(Number(item.qty) * Number(item.costPrice)).toFixed(0)}
                              </p>
                            )}
                          </div>

                          {/* Remove */}
                          <div className="col-span-1 flex justify-center pt-2.5">
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {totalUnits} unit(s) across {items.filter(i => i.product).length} product(s)
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Purchase Cost</p>
                    <p className="text-xl font-bold text-gray-900">Rs {totalCost.toFixed(0)}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recording…</>
                  ) : (
                    <><ShoppingCart size={16} /> Record Purchase & Update Stock</>
                  )}
                </button>
              </div>
            </form>

            {/* Stock Overview */}
            <div className="mt-5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 flex-shrink-0">
                  <Package size={15} className="text-green-600" /> Current Stock Levels
                </h3>
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {filteredStockProducts.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center">No products found</p>
                ) : filteredStockProducts.map(p => (
                  <div key={p._id} className="flex items-center gap-3 px-5 py-2.5">
                    {p.image && <img src={p.images?.[0] || p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                      {p.costPrice > 0 && (
                        <p className="text-xs text-gray-400">Cost: Rs {p.costPrice}</p>
                      )}
                    </div>
                    {editingStock === p._id ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={editStockVal}
                          onChange={e => setEditStockVal(e.target.value)}
                          className="w-16 border border-green-400 rounded-lg px-2 py-1 text-xs text-center focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => saveStockEdit(p._id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                        <button onClick={() => setEditingStock(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.countInStock === 0
                            ? 'bg-red-100 text-red-600'
                            : p.countInStock <= 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {p.countInStock} units
                        </span>
                        <button
                          onClick={() => { setEditingStock(p._id); setEditStockVal(String(p.countInStock)); }}
                          className="text-gray-300 hover:text-blue-500 transition-colors"
                          title="Edit stock"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Purchase History ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <TrendingUp size={15} className="text-green-600" /> Purchase History
                </h2>
                <span className="text-xs text-gray-400">{purchases.length} records</span>
              </div>

              {purchases.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No purchases recorded yet</p>
                  <p className="text-xs mt-1">Record your first purchase using the form.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Vendor</th>
                        <th className="px-5 py-3 font-semibold">Products</th>
                        <th className="px-5 py-3 font-semibold text-right">Units</th>
                        <th className="px-5 py-3 font-semibold text-right">Total Cost</th>
                        <th className="px-5 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {purchases.map(purchase => {
                        const totalUnitsInPurchase = purchase.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0;
                        return (
                          <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(purchase.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                              {purchase.vendor ? `${purchase.vendor.name}${purchase.vendor.company ? ` · ${purchase.vendor.company}` : ''}` : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col gap-0.5">
                                {purchase.items?.map((item, i) => (
                                  <span key={i} className="text-xs text-gray-600">
                                    {item.product?.name || 'Deleted product'} <span className="text-gray-400">×{item.qty}</span>
                                    {item.costPrice > 0 && <span className="text-gray-400"> @ Rs {item.costPrice}</span>}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">
                              {totalUnitsInPurchase}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                              Rs {(purchase.totalCost || 0).toFixed(0)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Delete this purchase? Stock will be reversed.')) return;
                                  try {
                                    await axios.delete(`/api/transactions/purchases/${purchase._id}`, { withCredentials: true });
                                    await fetchAll();
                                  } catch (err) { alert(err.response?.data?.message || err.message); }
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete purchase (reverses stock)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">All Purchases Total</td>
                        <td className="px-5 py-3 text-sm font-bold text-gray-800 text-right">
                          {purchases.reduce((s, p) => s + (p.items?.reduce((ss, i) => ss + (i.qty || 0), 0) || 0), 0)}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-green-700 text-right whitespace-nowrap">
                          Rs {purchases.reduce((s, p) => s + (p.totalCost || 0), 0).toFixed(0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Manual Stock Adjustments */}
            {manualAdjustments.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden mt-0">
                <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
                  <h2 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                    <Edit2 size={15} className="text-amber-600" /> Manual Stock Adjustments (this session)
                  </h2>
                  <span className="text-xs text-amber-600">{manualAdjustments.length} adjustment(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-100 text-xs uppercase tracking-wider text-amber-600">
                        <th className="px-5 py-3 font-semibold">Time</th>
                        <th className="px-5 py-3 font-semibold">Product</th>
                        <th className="px-5 py-3 font-semibold text-right">Old Stock</th>
                        <th className="px-5 py-3 font-semibold text-right">New Stock</th>
                        <th className="px-5 py-3 font-semibold text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {manualAdjustments.map(adj => (
                        <tr key={adj._id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {adj.adjustedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-700">{adj.productName}</td>
                          <td className="px-5 py-3 text-sm text-gray-500 text-right">{adj.oldStock}</td>
                          <td className="px-5 py-3 text-sm font-bold text-gray-900 text-right">{adj.newStock}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adj.diff > 0 ? 'bg-green-100 text-green-700' : adj.diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                              {adj.diff > 0 ? `+${adj.diff}` : adj.diff}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Vendor Modal ── */}
      {vendorModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-green-600" /> Add New Vendor
              </h3>
              <button onClick={() => setVendorModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={addVendor} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vendor Name <span className="text-red-400">*</span></label>
                <input value={newVendorName} onChange={e => setNewVendorName(e.target.value)} required placeholder="e.g. Ahmad Traders" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company <span className="text-red-400">*</span></label>
                <input value={newVendorCompany} onChange={e => setNewVendorCompany(e.target.value)} required placeholder="e.g. Ahmad & Co." className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                  <input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)} placeholder="03xx-xxxxxxx" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)} placeholder="vendor@email.com" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setVendorModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={vendorSaving} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {vendorSaving ? 'Saving…' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseLedger;
