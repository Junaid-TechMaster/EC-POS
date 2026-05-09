import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Star, Package, Truck, ShieldCheck, BarChart2, ShoppingCart } from 'lucide-react';
import axios from '../utils/api';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const MAX = 3;

const ATTRS = [
  { key: 'price',             label: 'Price',           render: (v, fmt) => fmt(v) },
  { key: 'oldPrice',          label: 'Old Price',       render: (v, fmt) => v ? <span className="line-through text-gray-400">{fmt(v)}</span> : '—' },
  { key: 'rating',            label: 'Rating',          render: v => v ? <span className="flex items-center gap-1"><Star size={13} className="text-yellow-400 fill-yellow-400" />{Number(v).toFixed(1)}</span> : '—' },
  { key: 'numReviews',        label: 'Reviews',         render: v => v ?? '—' },
  { key: 'countInStock',      label: 'In Stock',        render: v => v > 0 ? <span className="text-green-600 font-semibold">{v} units</span> : <span className="text-red-500 font-semibold">Out of stock</span> },
  { key: 'unitsSold',         label: 'Units Sold',      render: v => v ?? 0 },
  { key: 'brand',             label: 'Brand',           render: v => v || '—' },
  { key: 'category',          label: 'Category',        render: v => v || '—' },
  { key: 'unitType',          label: 'Sold As',         render: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—' },
  { key: 'gstApplicable',     label: 'GST',             render: (v, _, p) => v ? `${p.gstRate ?? 0}%` : 'None' },
  { key: 'deliveryCharge',    label: 'Delivery',        render: (v, fmt, p) => v === 0 ? <span className="text-green-600 font-semibold">Free</span> : fmt(v) },
];

const ProductPicker = ({ onAdd, excluded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/products?search=${encodeURIComponent(query)}&pageSize=6`);
        const list = Array.isArray(data) ? data : data.products || [];
        setResults(list.filter(p => !excluded.includes(p._id)));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, excluded]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search product to add…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm"
      />
      {loading && <p className="absolute top-full left-0 mt-1 text-xs text-gray-400 px-2">Searching…</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {results.map(p => (
            <button
              key={p._id}
              onClick={() => { onAdd(p); setQuery(''); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
            >
              <img src={p.image || p.images?.[0] || '/placeholder.jpg'} alt={p.name}
                className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-green-600 font-bold">Rs {p.price}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Compare = () => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);
  const { format } = useCurrency();
  const [searchParams] = useSearchParams();

  // Pre-load from ?ids=a,b,c
  const loadById = useCallback(async (id) => {
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      return data;
    } catch { return null; }
  }, []);

  useEffect(() => {
    const ids = (searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, MAX);
    if (ids.length === 0) return;
    Promise.all(ids.map(loadById)).then(results => {
      setProducts(results.filter(Boolean));
    });
  }, [searchParams, loadById]);

  const addProduct = (p) => {
    if (products.length >= MAX) return;
    if (products.find(x => x._id === p._id)) return;
    setProducts(prev => [...prev, p]);
  };

  const removeProduct = (id) => setProducts(prev => prev.filter(p => p._id !== id));

  const best = (key) => {
    const vals = products.map(p => Number(p[key])).filter(v => !isNaN(v));
    if (vals.length === 0) return null;
    return key === 'price' || key === 'deliveryCharge' ? Math.min(...vals) : Math.max(...vals);
  };

  return (
    <div className="w-full pb-16">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
        <ArrowLeft size={15} /> Back to Shop
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={28} className="text-green-600" />
        <h1 className="text-3xl font-extrabold text-gray-900">Compare Products</h1>
        <span className="text-sm text-gray-400 ml-1">({products.length}/{MAX})</span>
      </div>

      {/* Add product picker */}
      {products.length < MAX && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-8 max-w-md">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus size={15} className="text-green-600" /> Add a product to compare
          </p>
          <ProductPicker onAdd={addProduct} excluded={products.map(p => p._id)} />
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-lg">No products selected</p>
          <p className="text-sm mt-1">Search above to start comparing</p>
          <Link to="/shop" className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
            Browse Shop
          </Link>
        </div>
      )}

      {products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-sm text-gray-400 font-semibold p-4 w-36 align-bottom">Attribute</th>
                {products.map(p => (
                  <th key={p._id} className="p-4 text-center align-top min-w-[200px]">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
                      <button
                        onClick={() => removeProduct(p._id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <img
                        src={p.image || p.images?.[0] || '/placeholder.jpg'}
                        alt={p.name}
                        className="w-28 h-28 object-cover rounded-xl mx-auto mb-3 border border-gray-100"
                      />
                      <p className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">{p.name}</p>
                      <p className="text-green-600 font-extrabold text-lg mb-3">{format(p.price)}</p>
                      <button
                        onClick={() => addToCart({ ...p, qty: 1 })}
                        disabled={p.countInStock === 0}
                        className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      >
                        <ShoppingCart size={13} /> Add to Cart
                      </button>
                      <Link to={`/product/${p.slug || p._id}`} className="block text-center text-xs text-green-600 hover:underline mt-2">
                        View Details
                      </Link>
                    </div>
                  </th>
                ))}
                {products.length < MAX && (
                  <th className="p-4 text-center min-w-[200px] align-top opacity-40">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-2">
                      <Plus size={28} className="text-gray-300" />
                      <p className="text-xs text-gray-400">Add product</p>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {ATTRS.map(({ key, label, render }) => {
                const bestVal = best(key);
                return (
                  <tr key={key} className="border-t border-gray-50 hover:bg-green-50/30 transition-colors">
                    <td className="p-4 text-sm text-gray-500 font-semibold whitespace-nowrap">{label}</td>
                    {products.map(p => {
                      const val = p[key];
                      const numVal = Number(val);
                      const isBest = bestVal !== null && !isNaN(numVal) && numVal === bestVal && products.length > 1;
                      return (
                        <td key={p._id} className={`p-4 text-center text-sm ${isBest ? 'bg-green-50 font-bold text-green-700' : 'text-gray-700'}`}>
                          {render(val, format, p)}
                          {isBest && <span className="block text-[10px] text-green-500 mt-0.5">✓ Best</span>}
                        </td>
                      );
                    })}
                    {products.length < MAX && <td />}
                  </tr>
                );
              })}
              {/* Description row */}
              <tr className="border-t border-gray-50">
                <td className="p-4 text-sm text-gray-500 font-semibold align-top">Description</td>
                {products.map(p => (
                  <td key={p._id} className="p-4 text-xs text-gray-500 text-left align-top">
                    {p.description ? p.description.slice(0, 120) + (p.description.length > 120 ? '…' : '') : '—'}
                  </td>
                ))}
                {products.length < MAX && <td />}
              </tr>
              {/* Features row */}
              <tr className="border-t border-gray-50">
                <td className="p-4 text-sm text-gray-500 font-semibold align-top">Features</td>
                {products.map(p => (
                  <td key={p._id} className="p-4 align-top">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {(p.featureTags || []).length > 0
                        ? p.featureTags.map(t => (
                          <span key={t} className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">{t}</span>
                        ))
                        : <span className="text-gray-400 text-xs">—</span>
                      }
                    </div>
                  </td>
                ))}
                {products.length < MAX && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Badges */}
      <div className="mt-10 flex flex-wrap gap-4 text-sm text-gray-500 border-t pt-6">
        <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-green-500" /> Secure checkout</span>
        <span className="flex items-center gap-1.5"><Truck size={15} className="text-green-500" /> Fast delivery</span>
        <span className="flex items-center gap-1.5"><Package size={15} className="text-green-500" /> Quality guaranteed</span>
      </div>
    </div>
  );
};

export default Compare;
