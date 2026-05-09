import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/api';
import { ArrowLeft, Plus, Trash2, Package, Search, X, Edit2, Zap, Check } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

// ─── Product search picker ─────────────────────────────────────────────────
const ProductSearch = ({ onAdd, excluded }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `/api/products?search=${encodeURIComponent(q)}&pageSize=6&showAll=1`,
          { withCredentials: true }
        );
        const list = Array.isArray(data) ? data : data.products || [];
        setResults(list.filter(p => !excluded.includes(p._id)));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, excluded]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-500 transition-colors">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search and add product…"
          className="flex-1 outline-none text-sm bg-transparent"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setResults([]); }} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>
      {(results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
          {loading && <p className="text-xs text-gray-400 px-4 py-2">Searching…</p>}
          {results.map(p => (
            <button
              key={p._id}
              type="button"
              onClick={() => { onAdd(p); setQ(''); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 text-left transition-colors"
            >
              <img
                src={p.images?.[0] || p.image || '/placeholder.jpg'}
                alt={p.name}
                className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-green-600 font-bold">Rs {p.price}</p>
              </div>
              <Plus size={14} className="text-green-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────
const ComboManage = () => {
  const [combos, setCombos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState('');

  const blankForm = { name: '', description: '', image: '', products: [], combinedPrice: '', isActive: true };
  const [form, setForm] = useState(blankForm);

  const fetchCombos = async () => {
    try {
      const { data } = await axios.get('/api/combos?all=1', { withCredentials: true });
      setCombos(data);
    } catch { setCombos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCombos(); }, []);

  // ── Form helpers ────────────────────────────────────────────────────────
  const addProduct = (p) => {
    if (form.products.find(item => item.product._id === p._id)) return;
    setForm(f => ({ ...f, products: [...f.products, { product: p, qty: 1 }] }));
  };

  const removeProduct = (id) =>
    setForm(f => ({ ...f, products: f.products.filter(i => i.product._id !== id) }));

  const updateQty = (id, qty) =>
    setForm(f => ({
      ...f,
      products: f.products.map(i => i.product._id === id ? { ...i, qty: Math.max(1, Number(qty)) } : i),
    }));

  const originalTotal = form.products.reduce(
    (sum, i) => sum + (i.product.price || 0) * (i.qty || 1), 0
  );

  const openCreate = () => {
    setForm(blankForm);
    setEditId(null);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (combo) => {
    setForm({
      name: combo.name,
      description: combo.description || '',
      image: combo.image || '',
      combinedPrice: combo.combinedPrice,
      isActive: combo.isActive,
      products: combo.products.map(i => ({ product: i.product, qty: i.qty || 1 })),
    });
    setEditId(combo._id);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.products.length < 2 || !form.combinedPrice) {
      setError('Name, at least 2 products, and a combined price are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      image: form.image,
      combinedPrice: Number(form.combinedPrice),
      isActive: form.isActive,
      products: form.products.map(i => ({ product: i.product._id, qty: i.qty })),
    };
    try {
      if (editId) {
        const { data } = await axios.put(`/api/combos/${editId}`, payload, { withCredentials: true });
        setCombos(cs => cs.map(c => c._id === editId ? data : c));
      } else {
        const { data } = await axios.post('/api/combos', payload, { withCredentials: true });
        setCombos(cs => [data, ...cs]);
      }
      setForm(blankForm);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save combo');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this combo deal?')) return;
    try {
      await axios.delete(`/api/combos/${id}`, { withCredentials: true });
      setCombos(cs => cs.filter(c => c._id !== id));
    } catch { alert('Delete failed'); }
  };

  // ── Toggle active ───────────────────────────────────────────────────────
  const toggleActive = async (combo) => {
    try {
      const payload = {
        name: combo.name,
        description: combo.description,
        image: combo.image,
        combinedPrice: combo.combinedPrice,
        isActive: !combo.isActive,
        products: combo.products.map(i => ({ product: i.product._id || i.product, qty: i.qty })),
      };
      const { data } = await axios.put(`/api/combos/${combo._id}`, payload, { withCredentials: true });
      setCombos(cs => cs.map(c => c._id === combo._id ? data : c));
    } catch { alert('Update failed'); }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Zap size={22} className="text-amber-500" /> Combo Deals
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Bundle 2–4 products with a special combined price</p>
        </div>
        <button
          onClick={showForm && !editId ? () => setShowForm(false) : openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {showForm && !editId ? <X size={16} /> : <Plus size={16} />}
          {showForm && !editId ? 'Cancel' : 'New Combo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-5">{editId ? 'Edit Combo' : 'Create New Combo'}</h2>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Combo Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Morning Fresh Bundle"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bundle Price (Rs) *</label>
              <input
                type="number"
                value={form.combinedPrice}
                onChange={e => setForm(f => ({ ...f, combinedPrice: e.target.value }))}
                placeholder="Combined selling price"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                required
                min="0"
                step="0.01"
              />
              {originalTotal > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Original total: <span className="font-semibold">Rs {originalTotal.toFixed(0)}</span>
                  {Number(form.combinedPrice) > 0 && Number(form.combinedPrice) < originalTotal && (
                    <span className="text-green-600 font-semibold"> · Save Rs {(originalTotal - Number(form.combinedPrice)).toFixed(0)}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the bundle"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Cover Image (optional)</label>
              <ImageUpload value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} />
            </div>
          </div>

          {/* Product picker */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Products in Bundle * <span className="text-gray-400 font-normal">(minimum 2, maximum 4)</span>
            </label>
            <ProductSearch
              onAdd={addProduct}
              excluded={form.products.map(i => i.product._id)}
            />
            {form.products.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {form.products.map(item => (
                  <div key={item.product._id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <img
                      src={item.product.images?.[0] || item.product.image || '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-green-600">Rs {item.product.price} each · subtotal Rs {(item.product.price * item.qty).toFixed(0)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="text-xs text-gray-500">Qty</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => updateQty(item.product._id, e.target.value)}
                        min="1"
                        max="10"
                        className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.product._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer mb-5 w-max">
            <div
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Active — show on website</span>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              {saving ? 'Saving…' : <><Check size={16} /> {editId ? 'Update Combo' : 'Create Combo'}</>}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); setForm(blankForm); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Combo list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading combos…</div>
      ) : combos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Zap size={44} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-lg">No combo deals yet</p>
          <p className="text-sm mt-1">Click "New Combo" to create your first bundle</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {combos.map(combo => {
            const total = combo.products.reduce((s, i) => s + (i.product?.price || 0) * (i.qty || 1), 0);
            const savings = total - combo.combinedPrice;
            return (
              <div key={combo._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{combo.name}</h3>
                    {combo.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{combo.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${combo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {combo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Products preview */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {combo.products.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                      <img
                        src={item.product?.images?.[0] || item.product?.image || '/placeholder.jpg'}
                        alt=""
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span className="text-[11px] text-gray-600 font-medium">
                        {item.product?.name?.split(' ').slice(0, 2).join(' ') || '—'}
                      </span>
                      {item.qty > 1 && <span className="text-[10px] text-gray-400">×{item.qty}</span>}
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-extrabold text-green-600">Rs {combo.combinedPrice}</span>
                  {total > combo.combinedPrice && (
                    <>
                      <span className="text-sm text-gray-400 line-through">Rs {total.toFixed(0)}</span>
                      <span className="text-xs font-bold text-red-500">Save Rs {savings.toFixed(0)}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(combo)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-green-400 hover:text-green-700 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(combo)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                      combo.isActive
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {combo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(combo._id)}
                    className="w-10 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComboManage;
