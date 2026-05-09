import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, Minus, Plus, ShoppingCart, Heart, Truck, RotateCcw,
  ShieldCheck, ZoomIn, Package, TrendingUp, Clock, ChevronRight,
  MessageSquare, ThumbsUp, Zap, ArrowLeft, BarChart2, Camera, X, Loader2
} from 'lucide-react';
import axios from '../utils/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCard from '../components/ProductCard';
import { Helmet } from 'react-helmet-async';

// Countdown timer hook
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setTimeLeft(null);
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
};

const TAG_COLORS = {
  organic: 'bg-green-100 text-green-700 border-green-200',
  bestseller: 'bg-orange-100 text-orange-700 border-orange-200',
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  sale: 'bg-red-100 text-red-700 border-red-200',
  hot: 'bg-rose-100 text-rose-700 border-rose-200',
  featured: 'bg-purple-100 text-purple-700 border-purple-200',
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { format } = useCurrency();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('piece');
  const [selectedVariation, setSelectedVariation] = useState(null);

  const [activeTab, setActiveTab] = useState('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImgUploading, setReviewImgUploading] = useState(false);
  const reviewImgInputRef = useRef(null);

  const [isFav, setIsFav] = useState(false);

  const timeLeft = useCountdown(product?.dealEndsAt);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      try {
        // Try slug-based fetch first
        const res = await axios.get(`/api/products/slug/${slug}`);
        data = res.data;
      } catch {
        // Fall back to ID-based fetch (backward compatibility for old links)
        const res = await axios.get(`/api/products/${slug}`);
        data = res.data;
      }
      setProduct(data);
      setSelectedUnit(data.unitType === 'box' ? 'box' : 'piece');
      setQuantity(1);
      setActiveImage(0);
      // Fetch related using real _id (not slug)
      try {
        const relRes = await axios.get(`/api/products/${data._id}/related`);
        setRelated(relRes.data);
      } catch { /* silent */ }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!product) return;
    const key = 'recentlyViewed';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = {
      _id: product._id,
      name: product.name,
      image: product.image || product.images?.[0] || '',
      price: product.price,
      rating: product.rating,
      numReviews: product.numReviews,
      slug: product._id,
    };
    const filtered = prev.filter(p => p._id !== product._id);
    localStorage.setItem(key, JSON.stringify([entry, ...filtered].slice(0, 8)));
  }, [product]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-green-600 font-semibold text-lg">
      Loading product...
    </div>
  );
  if (error) return (
    <div className="text-center py-20 text-red-600 font-bold">{error}</div>
  );
  if (!product) return null;

  const allImages = product.images?.length > 0
    ? product.images
    : product.image ? [product.image] : [];

  const activePrice = selectedVariation
    ? selectedVariation.price
    : selectedUnit === 'box' ? product.boxPrice : product.price;

  const gstAmount = product.gstApplicable
    ? (activePrice * product.gstRate) / 100
    : 0;

  const discountPct = product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const isOutOfStock = product.countInStock === 0 || product.status === 'out_of_stock';

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleAddToCart = () => {
    addToCart({
      id: product._id,
      name: product.name + (selectedVariation ? ` (${selectedVariation.name})` : selectedUnit === 'box' ? ' (Box)' : ''),
      price: activePrice,
      image: allImages[0] || product.image,
      countInStock: product.countInStock,
    }, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleFav = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await axios.put(
        `/api/products/${product._id}/favorite`,
        {},
        { withCredentials: true }
      );
      setIsFav(data.isFavorite);
    } catch {
      // silent
    }
  };

  const handleReviewImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setReviewImgUploading(true);
    try {
      const uploaded = await Promise.all(files.slice(0, 4 - reviewImages.length).map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await axios.post('/api/upload/review', fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url;
      }));
      setReviewImages((prev) => [...prev, ...uploaded].slice(0, 4));
    } catch {
      setReviewMsg('Image upload failed. Please try again.');
    } finally {
      setReviewImgUploading(false);
      e.target.value = '';
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setReviewLoading(true);
    setReviewMsg('');
    try {
      await axios.post(
        `/api/products/${product._id}/reviews`,
        { rating: reviewRating, comment: reviewComment, images: reviewImages },
        { withCredentials: true }
      );
      setReviewMsg('Review submitted successfully!');
      setReviewComment('');
      setReviewRating(5);
      setReviewImages([]);
      fetchProduct();
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="w-full pb-16">
      <Helmet>
        <title>{product ? `${product.name} — OrganicPOS` : 'Product — OrganicPOS'}</title>
        <meta name="description" content={product?.description?.slice(0, 155) || 'View product details'} />
        <meta property="og:title" content={product?.name} />
        <meta property="og:image" content={product?.images?.[0] || product?.image} />
        <meta property="og:type" content="product" />
      </Helmet>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-green-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-green-600">Shop</Link>
        <ChevronRight size={14} />
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-green-600">{product.category}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Deal countdown banner */}
      {product.dealEndsAt && timeLeft && (
        <div className="bg-red-500 text-white rounded-xl p-3 mb-6 flex items-center gap-4 flex-wrap">
          <Clock size={18} className="flex-shrink-0" />
          <span className="font-semibold">Flash Deal ends in:</span>
          <div className="flex gap-2">
            {[
              { label: 'Hrs', val: String(timeLeft.hours).padStart(2, '0') },
              { label: 'Min', val: String(timeLeft.minutes).padStart(2, '0') },
              { label: 'Sec', val: String(timeLeft.seconds).padStart(2, '0') },
            ].map(({ label, val }) => (
              <div key={label} className="bg-red-700 rounded-md px-2 py-1 text-center min-w-[44px]">
                <div className="text-xl font-bold leading-none">{val}</div>
                <div className="text-[10px] opacity-80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">

        {/* ===== LEFT: Image Gallery ===== */}
        <div className="flex flex-col gap-4">

          {/* Main Image with zoom */}
          <div
            className="relative w-full h-96 md:h-[480px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-crosshair"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-200"
                style={zoomed ? {
                  transform: 'scale(2)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                } : {}}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={60} className="text-gray-300" />
              </div>
            )}
            {allImages.length > 0 && (
              <div className="absolute bottom-3 right-3 bg-white/80 rounded-full p-1.5 shadow">
                <ZoomIn size={16} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                    activeImage === i ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`view-${i}`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== RIGHT: Product Info ===== */}
        <div className="flex flex-col">

          {/* Feature tags */}
          {product.featureTags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {product.featureTags.map((tag) => (
                <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TAG_COLORS[tag.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>

          {/* Brand + Category */}
          <p className="text-sm text-gray-500 mb-4">
            by <span className="font-medium text-gray-700">{product.brand}</span>
            {product.category && <> &nbsp;·&nbsp; <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="text-green-600 hover:underline">{product.category}</Link></>}
          </p>

          {/* Rating row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
            {product.unitsSold > 0 && (
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <TrendingUp size={14} /> {product.unitsSold} sold
              </span>
            )}
          </div>

          {/* Price block */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex items-end gap-3 mb-1">
              <span className="text-4xl font-extrabold text-green-600">{format(activePrice)}</span>
              {product.oldPrice > product.price && !selectedVariation && (
                <span className="text-xl text-gray-400 line-through mb-1">{format(product.oldPrice)}</span>
              )}
              {discountPct && !selectedVariation && (
                <span className="bg-red-500 text-white text-sm font-bold px-2 py-0.5 rounded-full mb-1">{discountPct}% OFF</span>
              )}
            </div>

            {product.gstApplicable && (
              <p className="text-xs text-gray-500">
                + {format(gstAmount)} GST ({product.gstRate}%) &nbsp;·&nbsp;
                <span className="font-semibold text-gray-700">Total: {format(activePrice + gstAmount)}</span>
              </p>
            )}

            {/* Delivery info */}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Truck size={13} className="text-green-600" />
              {product.deliveryCharge > 0 ? (
                <span>Delivery: <strong className="text-gray-700">{format(product.deliveryCharge)}</strong>
                  {product.freeDeliveryThreshold > 0 && ` · Free over ${format(product.freeDeliveryThreshold)}`}
                </span>
              ) : (
                <span className="text-green-600 font-medium">Free Delivery</span>
              )}
            </div>
          </div>

          {/* Unit Type Selector */}
          {product.unitType === 'both' && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Sold as</p>
              <div className="flex gap-3">
                {['piece', 'box'].map((u) => (
                  <button
                    key={u}
                    onClick={() => { setSelectedUnit(u); setSelectedVariation(null); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                      selectedUnit === u ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {u === 'box' ? `Box (${product.boxContents || 'Pack'})` : 'Piece'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variations */}
          {product.variations?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Variations</p>
              <div className="flex flex-wrap gap-2">
                {product.variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariation(selectedVariation?.name === v.name ? null : v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      selectedVariation?.name === v.name
                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {v.name} — {format(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="mb-5">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-sm font-semibold">
                Out of Stock
              </span>
            ) : product.countInStock <= 10 ? (
              <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-sm font-semibold">
                <Zap size={14} /> Only {product.countInStock} left!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-semibold">
                In Stock ({product.countInStock} available)
              </span>
            )}
          </div>

          {/* Quantity + Actions */}
          {!isOutOfStock && (
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-full bg-white overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer">
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer">
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-400">Max {product.countInStock}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleToggleFav}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isFav ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-400'
                  }`}
                  title="Save to wishlist"
                >
                  <Heart size={18} className={isFav ? 'fill-current' : ''} />
                </button>
              </div>
              <Link
                to={`/compare?ids=${product._id}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors mt-1"
              >
                <BarChart2 size={13} /> Compare this product
              </Link>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500 border-t border-gray-100 pt-5">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={20} className="text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck size={20} className="text-green-600" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw size={20} className="text-green-600" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS: Description / Detailed / Reviews ===== */}
      <div className="mb-16">
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {['description', 'details', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'reviews' ? `Reviews (${product.numReviews})` : tab}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
            {product.detailedDescription || product.description}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-8">
            {/* Review list */}
            {product.reviews?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {product.reviews.map((r) => (
                  <div key={r._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                        <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                    {r.images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {r.images.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                    <button className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600">
                      <ThumbsUp size={12} /> Helpful
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit review form */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-green-600" /> Write a Review
                </h3>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)}>
                        <Star size={24} className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500 resize-none mb-3"
                  required
                />

                {/* Review image upload */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Add Photos (up to 4)</p>
                  <div className="flex flex-wrap gap-2">
                    {reviewImages.map((url, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setReviewImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 4 && (
                      <button
                        type="button"
                        onClick={() => reviewImgInputRef.current?.click()}
                        disabled={reviewImgUploading}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors disabled:opacity-50"
                      >
                        {reviewImgUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        <span className="text-[9px] mt-0.5">{reviewImgUploading ? 'Uploading' : 'Add'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={reviewImgInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleReviewImageSelect}
                  />
                </div>

                {reviewMsg && (
                  <p className={`text-sm mb-3 ${reviewMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{reviewMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={reviewLoading || reviewImgUploading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                <Link to="/login" className="text-green-600 font-semibold hover:underline">Login</Link> to write a review
              </p>
            )}
          </div>
        )}
      </div>

      {/* ===== Related Products ===== */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((p) => (
              <Link to={`/product/${p.slug || p._id}`} key={p._id} className="block group">
                <ProductCard
                  id={p._id}
                  slug={p.slug}
                  title={p.name}
                  price={p.price}
                  oldPrice={p.oldPrice}
                  rating={p.rating}
                  reviews={p.numReviews}
                  image={p.image}
                  images={p.images}
                  countInStock={p.countInStock}
                  unitsSold={p.unitsSold}
                  savedByCount={p.savedByCount}
                  featureTags={p.featureTags}
                  status={p.status}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
