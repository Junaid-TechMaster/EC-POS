import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, ShoppingBag, Heart, Plus, Star, SlidersHorizontal } from 'lucide-react';
import axios from '../utils/api';
import { CartContext } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { Helmet } from 'react-helmet-async';

const SORTS = [
  { id: '',         label: 'Relevance' },
  { id: 'popular',  label: 'Most Popular' },
  { id: 'newest',   label: 'Newest First' },
  { id: 'price_asc',  label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating',   label: 'Top Rated' },
];

// ─── Product card (category page style) ──────────────────────────────────────
const CatProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { format } = useCurrency();
  const navigate = useNavigate();

  const discPct =
    product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : product.discountPercent || 0;

  const img = product.images?.[0] || product.image;

  const isUnavailable = product.countInStock === 0 || product.status === 'out_of_stock';

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isUnavailable) return;
    addToCart(
      { id: product._id, name: product.name, price: product.price, image: img, category: product.category },
      1
    );
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug || product._id}`)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={36} className="text-gray-200" />
          </div>
        )}

        {discPct > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            -{discPct}%
          </span>
        )}
        {isUnavailable && (
          <span className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs font-bold text-gray-500">
            Out of Stock
          </span>
        )}

        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Heart size={13} className="text-gray-400" />
        </button>

        <button
          onClick={handleAdd}
          disabled={isUnavailable}
          className="absolute bottom-2 right-2 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors z-10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="p-3">
        <p className={`font-bold text-sm ${discPct > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {format(product.price)}
        </p>
        {product.oldPrice > product.price && (
          <p className="text-gray-400 line-through text-xs mt-0.5">{format(product.oldPrice)}</p>
        )}
        <p className="text-sm text-gray-700 mt-1 line-clamp-2 leading-tight font-medium">{product.name}</p>
        {product.brand && <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-500">{product.rating?.toFixed(1)}</span>
            <span className="text-xs text-gray-300">({product.numReviews})</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Category Page ────────────────────────────────────────────────────────────
const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubcat, setActiveSubcat] = useState('');
  const [sort, setSort] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setActiveSubcat('');
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get(`/api/categories/slug/${slug}`),
          axios.get(`/api/products?category=${encodeURIComponent(slug)}&pageSize=50`),
        ]);
        setCategory(catRes.data);
        const data = prodRes.data;
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Client-side filter + sort
  const filtered = activeSubcat
    ? products.filter((p) => p.subcategory?.toLowerCase() === activeSubcat.toLowerCase())
    : products;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'popular') return (b.unitsSold || 0) - (a.unitsSold || 0);
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const currentSort = SORTS.find((s) => s.id === sort)?.label || 'Sort by';

  if (loading) {
    return (
      <div className="w-full pb-16">
        {/* Skeleton header */}
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-6 mt-4" />
        <div className="bg-gray-100 rounded-2xl h-32 animate-pulse mb-6" />
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-24">
        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-semibold">Category not found</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      <Helmet>
        <title>{category ? `${category.name} — OrganicPOS` : 'Category — OrganicPOS'}</title>
        <meta name="description" content={`Shop ${category?.name || 'products'} at OrganicPOS`} />
      </Helmet>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-5 flex-wrap">
        <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/categories" className="hover:text-green-600 transition-colors">Categories</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-semibold">{category.name}</span>
      </nav>

      {/* Category header card */}
      <div
        className="rounded-2xl p-6 md:p-8 mb-6 flex items-center gap-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${category.color || '#16a34a'}, ${category.color || '#16a34a'}cc)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          {category.image ? (
            <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
          ) : (
            <span className="text-4xl">{category.icon || '📦'}</span>
          )}
        </div>
        <div className="relative z-10 text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{category.name}</h1>
          {category.description && (
            <p className="text-sm opacity-80 mt-1 max-w-lg">{category.description}</p>
          )}
          <p className="text-xs mt-2 opacity-70">{products.length} products available</p>
        </div>
      </div>

      {/* Subcategory filter tabs */}
      {category.subcategories?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          <button
            onClick={() => setActiveSubcat('')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              !activeSubcat
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            All
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub._id}
              onClick={() => setActiveSubcat(activeSubcat === sub.name ? '' : sub.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeSubcat === sub.name
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats + Sort bar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{sorted.length}</span> products
          {activeSubcat && (
            <> in <span className="text-green-600 font-semibold">{activeSubcat}</span></>
          )}
        </p>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-4 py-2 bg-white hover:border-gray-300 transition-colors"
          >
            <SlidersHorizontal size={14} className="text-gray-400" />
            {currentSort}
            <ChevronRight size={13} className={`text-gray-400 transition-transform ${sortOpen ? 'rotate-90' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-2xl shadow-xl w-52 py-2 z-30">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSort(s.id); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    sort === s.id ? 'text-green-600 font-bold' : 'text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close sort dropdown on outside click */}
      {sortOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
      )}

      {/* Product grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-lg text-gray-500">No products found</p>
          <p className="text-sm mt-1">
            {activeSubcat ? `Try selecting a different subcategory` : `Check back soon for new arrivals`}
          </p>
          {activeSubcat && (
            <button
              onClick={() => setActiveSubcat('')}
              className="mt-4 text-green-600 font-semibold text-sm hover:underline"
            >
              Show all products
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((p) => (
            <CatProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {/* View all in Shop link */}
      {sorted.length > 0 && (
        <div className="text-center mt-10">
          <Link
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            View all in Shop <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
