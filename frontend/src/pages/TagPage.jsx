import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from '../utils/api';
import { ArrowLeft, Package, Star, Flame, Sparkles, TrendingUp, Tag, ShoppingCart, Heart } from 'lucide-react';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const TAG_META = {
  featured:   { label: 'Featured Products', icon: Sparkles,   color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  hot:        { label: 'Hot Products',      icon: Flame,       color: 'text-red-600',    bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700' },
  bestseller: { label: 'Best Sellers',      icon: TrendingUp,  color: 'text-amber-600',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700' },
  new:        { label: 'New Arrivals',      icon: Sparkles,    color: 'text-blue-600',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
  sale:       { label: 'On Sale',           icon: Tag,         color: 'text-green-600',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700' },
  organic:    { label: 'Organic Products',  icon: Package,     color: 'text-teal-600',   bg: 'bg-teal-50',   badge: 'bg-teal-100 text-teal-700' },
};

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { format } = useCurrency();
  const [saved, setSaved] = useState(false);

  const image = product.images?.[0] || product.image || '/placeholder.jpg';
  const discount = product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : product.discountPercent || 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-green-200 transition-all group flex flex-col">
      <Link to={`/product/${product.slug || product._id}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.countInStock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <button
          onClick={e => { e.preventDefault(); setSaved(s => !s); }}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={14} className={saved ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.slug || product._id}`}>
          <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 mb-1 hover:text-green-700 transition-colors">
            {product.name}
          </p>
        </Link>

        {product.brand && (
          <p className="text-[11px] text-gray-400 mb-1">{product.brand}</p>
        )}

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] text-gray-500">{product.rating.toFixed(1)}</span>
            {product.numReviews > 0 && <span className="text-[11px] text-gray-400">({product.numReviews})</span>}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-auto mb-2">
          <span className="text-base font-extrabold text-green-600">{format(product.price)}</span>
          {product.oldPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{format(product.oldPrice)}</span>
          )}
        </div>

        <button
          onClick={() => addToCart({ ...product, qty: 1 })}
          disabled={product.countInStock === 0}
          className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl transition-colors"
        >
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </div>
  );
};

const TagPage = () => {
  const { tag } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('newest');

  const meta = TAG_META[tag] || { label: tag, icon: Package, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' };
  const Icon = meta.icon;

  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [tag]);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products?tag=${encodeURIComponent(tag)}&sort=${sort}&page=${page}&pageSize=20`)
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : data.products || [];
        setProducts(list);
        setTotalPages(data.pages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tag, sort, page]);

  return (
    <div className="w-full pb-16">
      {/* Header */}
      <div className={`${meta.bg} rounded-3xl px-6 sm:px-10 py-8 mb-8 flex items-center gap-4`}>
        <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon size={28} className={meta.color} />
        </div>
        <div>
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-1 transition-colors">
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <h1 className={`text-2xl sm:text-3xl font-extrabold text-gray-900`}>{meta.label}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products found</p>
          )}
        </div>
      </div>

      {/* Sort bar */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-sm text-gray-500">Showing all <span className="font-semibold text-gray-700">{meta.label}</span></p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-green-500 bg-white"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-green-600">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading {meta.label.toLowerCase()}…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Icon size={48} className={`mx-auto mb-4 opacity-30 ${meta.color}`} />
          <p className="text-lg font-semibold">No {meta.label.toLowerCase()} yet</p>
          <p className="text-sm mt-1">Products with the <span className="font-semibold">"{tag}"</span> tag will appear here.</p>
          <Link to="/shop" className="mt-5 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
            Browse All Products
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map(p => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === n ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-green-400'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagPage;
