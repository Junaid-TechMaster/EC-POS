import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight, ArrowLeft, Search, X, ImageOff } from 'lucide-react';

const PAGE_SIZE = 12;

const ProductList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [categories, setCategories] = useState([]);

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const allSelected = products.length > 0 && products.every(p => selected.has(p._id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map(p => p._id)));
  const clearSelection = () => setSelected(new Set());

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    axios.get('/api/categories')
      .then(r => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page, pageSize: PAGE_SIZE, showAll: 1 });
        if (search)         params.set('search', search);
        if (filterCategory) params.set('category', filterCategory);
        if (filterBrand)    params.set('brand', filterBrand);
        if (filterStatus)   params.set('status', filterStatus);

        const { data } = await axios.get(
          `/api/products?${params}`,
          { withCredentials: true }
        );
        if (!cancelled) {
          const arr = Array.isArray(data) ? data : data.products || [];
          setProducts(arr);
          setPages(data.pages || 1);
          setTotal(data.total || arr.length);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, search, filterCategory, filterBrand, filterStatus]);

  // Reset to page 1 and clear selection when any filter changes
  const setFilter = (setter) => (val) => { setter(val); setPage(1); clearSelection(); };

  const deleteHandler = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      setLoading(true);
      await axios.delete(`/api/products/${id}`, { withCredentials: true });
      setPage(1);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const createProductHandler = async () => {
    if (!window.confirm('Create a new blank product?')) return;
    try {
      const { data } = await axios.post('/api/products', {}, { withCredentials: true });
      navigate(`/admin/product/${data._id}/edit`);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const hasFilters = search || filterCategory || filterBrand || filterStatus;
  const clearFilters = () => { setSearch(''); setFilterCategory(''); setFilterBrand(''); setFilterStatus(''); setPage(1); clearSelection(); };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="text-green-600" size={30} /> Products
          {total > 0 && <span className="text-lg font-normal text-gray-400">({total})</span>}
        </h1>
        <div className="flex items-center gap-3">
          {someSelected && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">{selected.size} selected</span>
              <button
                onClick={async () => {
                  if (!window.confirm(`Delete ${selected.size} selected product(s)?`)) return;
                  setLoading(true);
                  for (const id of selected) {
                    try { await axios.delete(`/api/products/${id}`, { withCredentials: true }); } catch (e) { console.error(e); }
                  }
                  clearSelection();
                  setPage(1);
                }}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          )}
          <button
            onClick={createProductHandler}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Create Product
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Name search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setFilter(setSearch)(e.target.value)}
              placeholder="Search by name, brand…"
              className="pl-8 pr-4 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={e => setFilter(setFilterCategory)(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Brand text filter */}
          <input
            value={filterBrand}
            onChange={e => setFilter(setFilterBrand)(e.target.value)}
            placeholder="Brand"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 w-32"
          />

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilter(setFilterStatus)(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-green-600 font-bold">Loading Products...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer accent-green-600"
                      />
                    </th>
                    <th className="p-4 font-bold w-16">Image</th>
                    <th className="p-4 font-bold">Name / ID</th>
                    <th className="p-4 font-bold">Cost</th>
                    <th className="p-4 font-bold">Price</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Brand</th>
                    <th className="p-4 font-bold">Stock</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${selected.has(product._id) ? 'bg-green-50' : ''}`}>
                      <td className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={selected.has(product._id)}
                          onChange={() => toggleSelect(product._id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-600"
                        />
                      </td>
                      <td className="p-3 w-16">
                        {product.images?.[0] || product.image ? (
                          <img
                            src={product.images?.[0] || product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 items-center justify-center" style={{ display: product.images?.[0] || product.image ? 'none' : 'flex' }}>
                          <ImageOff size={16} className="text-gray-300" />
                        </div>
                      </td>
                      <td className="p-4 max-w-[200px]">
                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{product._id.substring(0, 8)}…</p>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{product.costPrice > 0 ? `Rs ${product.costPrice.toFixed(0)}` : '—'}</td>
                      <td className="p-4 text-sm text-gray-600">Rs {product.price.toFixed(0)}</td>
                      <td className="p-4 text-sm text-gray-600">{product.category || '—'}</td>
                      <td className="p-4 text-sm text-gray-600">{product.brand || '—'}</td>
                      <td className="p-4 text-sm">
                        <span className={`font-semibold ${product.countInStock === 0 ? 'text-red-500' : product.countInStock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                          {product.countInStock}
                        </span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const s = product.status || 'published';
                          const cls = s === 'published' ? 'bg-green-100 text-green-700' : s === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
                          const label = s === 'out_of_stock' ? 'Out of Stock' : s.charAt(0).toUpperCase() + s.slice(1);
                          return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
                        })()}
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <Link
                          to={`/admin/product/${product._id}/edit`}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => deleteHandler(product._id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="10" className="p-8 text-center text-gray-400">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold ${p === page ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
