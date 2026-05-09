import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { Helmet } from 'react-helmet-async';
import {
  Heart, Plus, Star, ShoppingBag, ChevronRight, ChevronLeft, Package,
  Zap, Clock, ShieldCheck, Truck, RotateCcw, BadgePercent, Gift,
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import FeatureBox from '../components/FeatureBox';

// ─── Mini Product Card (Snoonu style) ────────────────────────────────────────
const HomeProductCard = ({ product, className = '' }) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [fav, setFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const discPct =
    product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : product.discountPercent || 0;

  const img = product.images?.[0] || product.image;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(
      {
        id: product._id,
        name: product.name,
        price: product.price,
        image: img,
        category: product.category,
      },
      1
    );
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      const { data } = await axios.put(
        `/api/products/${product._id}/favorite`,
        {},
        { withCredentials: true }
      );
      setFav(data.isFavorite);
    } catch { /* silent */ }
    finally { setFavLoading(false); }
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug || product._id}`)}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group ${className}`}
    >
      {/* Image */}
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
            <ShoppingBag size={32} className="text-gray-200" />
          </div>
        )}

        {/* Discount badge */}
        {discPct > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            -{discPct}%
          </span>
        )}

        {/* Heart */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className={`absolute top-2 right-2 rounded-full w-7 h-7 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 ${fav ? 'bg-red-500' : 'bg-white/80 backdrop-blur-sm'}`}
          title={user ? (fav ? 'Remove from wishlist' : 'Save to wishlist') : 'Login to save'}
        >
          <Heart size={12} className={fav ? 'fill-white text-white' : 'text-gray-400'} />
        </button>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          className="absolute bottom-2 right-2 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors z-10"
          title="Add to cart"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className={`font-bold text-sm leading-tight ${discPct > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {format(product.price)}
        </p>
        {product.oldPrice > product.price && (
          <p className="text-gray-400 line-through text-xs mt-0.5">
            {format(product.oldPrice)}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">{product.name}</p>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-gray-400">
              {product.rating?.toFixed(1)} ({product.numReviews})
            </span>
          </div>
        )}
        {product.countInStock !== undefined && (
          <div className="mt-1">
            {product.countInStock === 0 ? (
              <span className="text-[10px] text-red-500 font-medium">Out of Stock</span>
            ) : product.countInStock <= 5 ? (
              <span className="text-[10px] text-red-500 font-semibold">Only {product.countInStock} left!</span>
            ) : product.countInStock <= 20 ? (
              <span className="text-[10px] text-orange-500">{product.countInStock} left</span>
            ) : (
              <span className="text-[10px] text-green-600">In Stock</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Compact Category Pill (small horizontal card) ──────────────────────────
const CategoryPill = ({ cat, active }) => (
  <Link
    to={`/category/${cat.slug}`}
    className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl border transition-all w-[88px] ${
      active
        ? 'bg-amber-50 border-amber-200'
        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
    }`}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: `${cat.color || '#6b7280'}14` }}
    >
      {cat.image ? (
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <span className="text-lg">{cat.icon || '📦'}</span>
      )}
    </div>
    <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight line-clamp-1">
      {cat.name}
    </span>
  </Link>
);

// ─── Generic Carousel (one-item-at-a-time sliding window) ────────────────────
const GenericCarousel = ({ items, renderItem, perPage = 6 }) => {
  const total = items.length;
  const canScroll = total > perPage;
  const [startIdx, setStartIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef(null);

  useEffect(() => {
    if (!canScroll) return;
    const t = setInterval(() => setStartIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total, canScroll]);

  const goTo = (raw) => {
    const target = ((raw % total) + total) % total;
    clearTimeout(fadeTimer.current);
    setFading(true);
    fadeTimer.current = setTimeout(() => { setStartIdx(target); setFading(false); }, 180);
  };

  // sliding window — wraps around
  const slice = Array.from({ length: Math.min(perPage, total) }, (_, i) =>
    items[(startIdx + i) % total]
  );

  const cols =
    perPage <= 2 ? 'grid-cols-2' :
    perPage === 3 ? 'grid-cols-3' :
    perPage === 4 ? 'grid-cols-2 sm:grid-cols-4' :
    perPage === 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' :
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  if (total === 0) return null;

  return (
    <div className="relative px-6">
      <div className={`grid ${cols} gap-3 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {slice.map((item, i) => renderItem(item, i))}
      </div>
      {canScroll && (
        <>
          <button
            onClick={() => goTo(startIdx - 1)}
            className="absolute -left-1 top-1/2 -translate-y-1/2 bg-white shadow-lg border border-gray-100 rounded-full w-9 h-9 flex items-center justify-center z-10 hover:bg-gray-50 hover:shadow-xl transition-all"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => goTo(startIdx + 1)}
            className="absolute -right-1 top-1/2 -translate-y-1/2 bg-white shadow-lg border border-gray-100 rounded-full w-9 h-9 flex items-center justify-center z-10 hover:bg-gray-50 hover:shadow-xl transition-all"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
};

// ─── Offer Card (matches product card proportions) ────────────────────────────
const OfferCard = ({ to, gradient, icon, title, sub }) => (
  <Link
    to={to}
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
  >
    <div className={`relative aspect-square bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
      <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300">{icon}</span>
    </div>
    <div className="p-3">
      <p className="font-bold text-sm leading-tight text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  </Link>
);

// ─── Category Grid Card (Browse Categories — full-bleed image like product card) ─
const CategoryGridCard = ({ cat }) => (
  <Link
    to={`/category/${cat.slug}`}
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
  >
    <div
      className="relative aspect-square overflow-hidden"
      style={{ backgroundColor: `${cat.color || '#16a34a'}18` }}
    >
      {cat.image ? (
        <img
          src={cat.image}
          alt={cat.name}
          className="absolute inset-0 w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
            {cat.icon || '📦'}
          </span>
        </div>
      )}
    </div>
    <div className="p-3">
      <p className="text-xs font-semibold text-gray-700 group-hover:text-green-600 text-center leading-tight line-clamp-2 transition-colors">
        {cat.name}
      </p>
    </div>
  </Link>
);

// ─── Offers data ──────────────────────────────────────────────────────────────
const OFFERS = [
  { to: '/tag/sale',       gradient: 'from-red-500 to-orange-400',    icon: '🔖', title: "Today's Deals",   sub: 'Up to 50% off' },
  { to: '/tag/hot',        gradient: 'from-orange-500 to-amber-400',  icon: '🔥', title: 'Hot Products',    sub: 'Trending now' },
  { to: '/tag/new',        gradient: 'from-blue-600 to-cyan-400',     icon: '✨', title: 'New Arrivals',    sub: 'Just dropped' },
  { to: '/tag/featured',   gradient: 'from-purple-600 to-pink-400',   icon: '⭐', title: 'Featured Picks',  sub: "Editor's choice" },
  { to: '/tag/bestseller', gradient: 'from-green-600 to-emerald-400', icon: '🏆', title: 'Best Sellers',    sub: 'Customer favourites' },
  { to: '/shop',           gradient: 'from-gray-700 to-gray-500',     icon: '🛒', title: 'Shop All',        sub: 'Browse everything' },
];

// ─── Product Carousel ────────────────────────────────────────────────────────
const ProductCarousel = ({ products }) => {
  if (products.length === 0) return null;
  return (
    <GenericCarousel
      items={products}
      renderItem={(p) => <HomeProductCard key={p._id} product={p} />}
    />
  );
};

// ─── TABS config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'popular',  label: 'Popular',      icon: '🔥', query: 'sort=popular&pageSize=12' },
  { id: 'new',      label: 'New Arrivals', icon: '✨', query: 'sort=newest&pageSize=12' },
  { id: 'featured', label: 'Featured',     icon: '⭐', query: 'tag=featured&pageSize=12' },
  { id: 'deals',    label: 'Deals',        icon: '⚡', query: 'tag=sale&pageSize=12' },
];

// ─── HOME ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const [categories, setCategories] = useState([]);
  const [tabProducts, setTabProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [combos, setCombos] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [recentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); } catch { return []; }
  });

  // Initial data: categories + deal products + brands + combos + hot products
  useEffect(() => {
    const get = (url, opts) => axios.get(url, opts).catch(() => ({ data: [] }));
    Promise.all([
      get('/api/categories'),
      get('/api/products?tag=sale&pageSize=8'),
      get('/api/products/brands'),
      get('/api/combos'),
      get('/api/products?tag=hot&pageSize=6'),
    ]).then(([catRes, dealRes, brandRes, comboRes, hotRes]) => {
      setCategories(catRes.data || []);
      const dl = Array.isArray(dealRes.data) ? dealRes.data : dealRes.data?.products || [];
      setDealProducts(dl);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      setCombos(Array.isArray(comboRes.data) ? comboRes.data : []);
      const hp = Array.isArray(hotRes.data) ? hotRes.data : hotRes.data?.products || [];
      setHotProducts(hp);
      setLoading(false);
    });
  }, []);

  // Tab products — refetch when tab changes
  useEffect(() => {
    const found = TABS.find((t) => t.id === activeTab);
    if (!found) return;
    let cancelled = false;
    axios
      .get(`/api/products?${found.query}`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        setTabProducts(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <div className="w-full pb-12">
      <Helmet>
        <title>OrganicPOS — Fresh Organic Products</title>
        <meta name="description" content="Shop fresh organic groceries, earn rewards and enjoy fast delivery." />
        <meta property="og:title" content="OrganicPOS — Fresh Organic Products" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── 1. SMALL CATEGORY PILLS — centered, wraps on small screens ────────── */}
      <section className="mb-5">
        <div className="flex flex-wrap justify-center gap-2.5">
          {loading
            ? [...Array(10)].map((_, i) => (
                <div key={i} className="w-[88px] h-[90px] rounded-2xl bg-gray-100 animate-pulse" />
              ))
            : categories.slice(0, 12).map((cat, i) => (
                <CategoryPill key={cat._id} cat={cat} active={i === 0} />
              ))
          }
        </div>
      </section>

      {/* ── 2. BIG HERO BANNER — featured combo deal (or hot product fallback) ── */}
      {(() => {
        const heroCombo = combos[0];
        const heroHot   = hotProducts[0];
        const heroImg = heroCombo?.image
          || heroCombo?.products?.[0]?.product?.images?.[0]
          || heroCombo?.products?.[0]?.product?.image
          || heroHot?.images?.[0]
          || heroHot?.image;
        const heroTitle    = heroCombo?.name        || heroHot?.name        || 'Whooping 60% Off';
        const heroSubtitle = heroCombo?.description || heroHot?.description || 'on everyday items';
        const heroPrice    = heroCombo?.combinedPrice ?? heroHot?.price;
        const heroLink     = heroCombo ? '/combos' : (heroHot ? `/product/${heroHot.slug || heroHot._id}` : '/tag/sale');
        const heroBadge    = heroCombo ? 'Combo Deal' : 'Hot Pick';

        return (
          <section className="mb-4">
            <Link
              to={heroLink}
              className="block relative overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #a855f7 35%, #7c3aed 65%, #ec4899 100%)',
                minHeight: 320,
              }}
            >
              <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-pink-500/40 blur-2xl" />
              <div className="absolute -top-16 right-1/3 w-72 h-72 rounded-full bg-purple-700/40 blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-6 h-full">
                <div className="max-w-md text-center md:text-left">
                  <span className="inline-block bg-yellow-300 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                    {heroBadge}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.1] text-white drop-shadow">
                    {heroTitle}
                  </h1>
                  <p className="text-white/90 mt-2 text-sm md:text-base line-clamp-2">{heroSubtitle}</p>
                  {heroPrice ? (
                    <p className="text-yellow-300 font-extrabold text-2xl mt-3">Rs {Number(heroPrice).toLocaleString()}</p>
                  ) : null}
                  <span className="inline-flex items-center gap-1 mt-6 bg-blue-500 hover:bg-blue-600 text-white px-7 py-3 rounded-full font-bold text-sm transition-colors shadow-lg">
                    Shop Now
                  </span>
                </div>
                <div className="hidden md:flex items-center justify-center flex-1 max-w-sm">
                  {heroImg ? (
                    <img src={heroImg} alt={heroTitle}
                      className="max-h-64 w-auto object-contain drop-shadow-2xl"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="text-[180px] leading-none drop-shadow-2xl select-none">🛍️</div>
                  )}
                </div>
              </div>
            </Link>
          </section>
        );
      })()}

      {/* ── 3. TWO PROMO BANNERS — second combo + top hot product ─────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Left — second combo (or first if hero used hot product), fallback hot[1] */}
        {(() => {
          const combo = combos[combos[0] && hotProducts[0] && !combos[1] ? 0 : 1];
          const fallback = hotProducts[1];
          const item = combo || fallback;
          const img  = combo?.image
            || combo?.products?.[0]?.product?.images?.[0]
            || combo?.products?.[0]?.product?.image
            || fallback?.images?.[0]
            || fallback?.image;
          const title = item?.name || 'Get 10% Off on gift items';
          const price = combo?.combinedPrice ?? fallback?.price;
          const link  = combo ? '/combos' : (fallback ? `/product/${fallback.slug || fallback._id}` : '/tag/sale');
          const badge = combo ? 'Combo Deal' : 'Hot';

          return (
            <Link to={link} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-7 md:p-9 min-h-[200px] flex items-center justify-between gap-4">
              <div className="relative z-10 flex-1 min-w-0">
                <span className="inline-block bg-teal-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                  {badge}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight line-clamp-2">{title}</h2>
                {price ? (
                  <p className="text-teal-400 font-bold text-lg mt-1">Rs {Number(price).toLocaleString()}</p>
                ) : null}
                <span className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-md">
                  Buy Now
                </span>
              </div>
              <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                {img ? (
                  <img src={img} alt={title} className="w-full h-full object-contain drop-shadow-xl"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="text-7xl opacity-50 select-none">🎁</div>
                )}
              </div>
            </Link>
          );
        })()}

        {/* Right — top hot product (or product from sale tag fallback) */}
        {(() => {
          const hot = hotProducts[0] && !combos[0] ? hotProducts[1] : hotProducts[0];
          const fallback = dealProducts[0];
          const item = hot || fallback;
          const img  = item?.images?.[0] || item?.image;
          const title = item?.name || 'Top Trending Product';
          const price = item?.price;
          const link  = item ? `/product/${item.slug || item._id}` : '/tag/hot';

          return (
            <Link to={link} className="relative overflow-hidden rounded-3xl p-7 md:p-9 min-h-[200px] flex items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #06b6d4 100%)' }}>
              <div className="relative z-10 flex-1 min-w-0">
                <span className="inline-block bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                  🔥 Hot
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight line-clamp-2">{title}</h2>
                {price ? (
                  <p className="text-yellow-300 font-bold text-lg mt-1">Rs {Number(price).toLocaleString()}</p>
                ) : (
                  <p className="text-white/90 mt-1">Best in the market</p>
                )}
                <span className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-md">
                  Buy Now
                </span>
              </div>
              <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                {img ? (
                  <img src={img} alt={title} className="w-full h-full object-contain drop-shadow-xl"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="text-7xl opacity-50 select-none">📱</div>
                )}
              </div>
            </Link>
          );
        })()}
      </section>

      {/* ── 2. MARQUEE STRIP ──────────────────────────────────────────────────── */}
      <div className="w-full bg-gray-900 rounded-2xl mb-8 overflow-hidden py-3 flex items-center">
        <div className="flex gap-10 animate-marquee whitespace-nowrap">
          {[
            '🚀 Free Delivery over Rs 5,000',
            '🔒 100% Secure Payments',
            '⭐ Top Rated Products',
            '🎁 Bundle Deals Available',
            '↩️ Easy 7-Day Returns',
            '💳 Pay via JazzCash, Easypaisa & Cards',
            '🚀 Free Delivery over Rs 5,000',
            '🔒 100% Secure Payments',
            '⭐ Top Rated Products',
            '🎁 Bundle Deals Available',
            '↩️ Easy 7-Day Returns',
            '💳 Pay via JazzCash, Easypaisa & Cards',
          ].map((item, i) => (
            <span key={i} className="text-white/80 font-medium text-sm">
              {item} <span className="text-white/30 ml-6">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. PRODUCT TABS ───────────────────────────────────────────────────── */}
      <section className="mb-10">
        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeTab === t.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
          <Link
            to="/shop"
            className="flex-shrink-0 flex items-center gap-1 text-sm text-green-600 font-semibold ml-auto hover:text-green-700"
          >
            View all <ChevronRight size={15} />
          </Link>
        </div>

        {/* Product carousel */}
        {tabProducts.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        ) : (
          <ProductCarousel products={tabProducts} />
        )}
      </section>

      {/* ── 4. TODAY'S DEALS (horizontal scroll) ──────────────────────────────── */}
      {dealProducts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Today's Deals</h2>
            </div>
            <Link to="/tag/sale" className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <ProductCarousel products={dealProducts} />
        </section>
      )}

      {/* ── 5. OFFERS & EVENTS ────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Offers & Events</h2>
        </div>
        <GenericCarousel
          items={OFFERS}
          renderItem={(b) => <OfferCard key={b.to} {...b} />}
        />
      </section>

      {/* ── 6. BROWSE CATEGORIES ──────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
            <Link to="/categories" className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
              All categories <ChevronRight size={14} />
            </Link>
          </div>
          <GenericCarousel
            items={categories}
            renderItem={(cat) => <CategoryGridCard key={cat._id} cat={cat} />}
          />
        </section>
      )}

      {/* ── 7. RECENTLY VIEWED ────────────────────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {recentlyViewed.map((p) => (
              <HomeProductCard
                key={p._id}
                product={p}
                className="flex-shrink-0 w-40 sm:w-44"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 8. POPULAR BRANDS ────────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Brands</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand}
                to={`/shop?search=${encodeURIComponent(brand)}`}
                className="bg-gray-100 hover:bg-green-600 hover:text-white text-gray-600 text-sm px-4 py-2 rounded-full transition-colors font-medium"
              >
                {brand}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 9. APP DOWNLOAD STRIP ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-10 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-white">
          <h2 className="text-2xl font-extrabold mb-1">Download Our App</h2>
          <p className="text-gray-400 text-sm">Shop faster, track orders and get exclusive app-only deals.</p>
          <div className="flex gap-3 mt-4 flex-wrap">
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors text-sm font-semibold">
              <span className="text-lg">🍏</span> App Store
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors text-sm font-semibold">
              <span className="text-lg">▶️</span> Google Play
            </button>
          </div>
        </div>
        <div className="flex gap-6 text-center flex-wrap justify-center">
          {[
            { num: '20+', label: 'Products' },
            { num: '10+', label: 'Categories' },
            { num: '100%', label: 'Secure' },
          ].map((s) => (
            <div key={s.label} className="text-white">
              <p className="text-2xl font-extrabold">{s.num}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. FEATURE BOXES ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <FeatureBox
          to="/shop?minPrice=5000"
          icon={<Truck size={22} />}
          iconBg="bg-blue-200"
          iconColor="text-blue-700"
          cardBg="bg-blue-50"
          cardBorder="border-blue-100"
          title="Free Delivery"
          description="On all orders over Rs 5,000"
        />
        <FeatureBox
          to="/payment-info"
          icon={<ShieldCheck size={22} />}
          iconBg="bg-green-200"
          iconColor="text-green-700"
          cardBg="bg-green-50"
          cardBorder="border-green-100"
          title="Secure Payments"
          description="JazzCash, Easypaisa & Cards"
        />
        <FeatureBox
          to="/returns-policy"
          icon={<RotateCcw size={22} />}
          iconBg="bg-orange-200"
          iconColor="text-orange-600"
          cardBg="bg-orange-50"
          cardBorder="border-orange-100"
          title="Easy Returns"
          description="7-day hassle-free returns"
        />
        <FeatureBox
          to="/tag/sale"
          icon={<BadgePercent size={22} />}
          iconBg="bg-purple-200"
          iconColor="text-purple-700"
          cardBg="bg-purple-50"
          cardBorder="border-purple-100"
          title="Best Prices"
          description="Guaranteed lowest prices"
        />
        <FeatureBox
          to="/tag/hot"
          icon={<Gift size={22} />}
          iconBg="bg-red-200"
          iconColor="text-red-600"
          cardBg="bg-red-50"
          cardBorder="border-red-100"
          title="Daily Offers"
          description="New deals added every day"
        />
      </div>

    </div>
  );
};

export default Home;
