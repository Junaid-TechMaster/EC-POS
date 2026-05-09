import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Package, TrendingUp, Zap } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from '../utils/api';

const TAG_COLORS = {
  organic:    'bg-green-100 text-green-700',
  bestseller: 'bg-orange-100 text-orange-700',
  new:        'bg-blue-100 text-blue-700',
  sale:       'bg-red-100 text-red-700',
  hot:        'bg-rose-100 text-rose-700',
  featured:   'bg-purple-100 text-purple-700',
};

const ProductCard = ({
  _id, id, slug,
  title, name,
  price, oldPrice, reviews, rating = 0,
  image, images = [], countInStock = 0, unitsSold = 0,
  savedByCount = 0, featureTags = [], isFavorite = false,
  status,
  onFavoriteToggle,
}) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { format } = useCurrency();

  const productId = id || _id;
  const productName = title || name || '';
  const href = `/product/${slug || productId}`;

  const [fav, setFav] = useState(isFavorite);
  const [favLoading, setFavLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayImage = (images && images.length > 0) ? images[0] : image;
  const discountPct = oldPrice && price && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : null;

  const isUnavailable = countInStock <= 0 || status === 'out_of_stock';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable) return;
    addToCart({ id: productId, name: productName, price, image: displayImage, countInStock }, 1);
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setFavLoading(true);
    try {
      const { data } = await axios.put(
        `/api/products/${productId}/favorite`,
        {},
        { withCredentials: true }
      );
      setFav(data.isFavorite);
      if (onFavoriteToggle) onFavoriteToggle(productId, data.isFavorite);
    } catch {
      // silent
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="relative group bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-[box-shadow,border-color] duration-300 flex flex-col overflow-hidden">

      {/* Discount badge */}
      {discountPct && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          -{discountPct}%
        </div>
      )}

      {/* Feature tags */}
      {featureTags.length > 0 && (
        <div className="absolute top-2 right-8 z-10 flex flex-col gap-1">
          {featureTags.slice(0, 2).map((tag) => (
            <span key={tag} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${TAG_COLORS[tag.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={handleFavorite}
        disabled={favLoading || !user}
        className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${fav ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500 shadow-sm'} ${!user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        title={user ? (fav ? 'Remove from wishlist' : 'Save to wishlist') : 'Login to save'}
      >
        <Heart size={14} className={fav ? 'fill-current' : ''} />
      </button>

      {/* Product Image — wrapped in Link */}
      <Link to={href} className="block w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
        {displayImage && !imgError ? (
          <img
            src={displayImage}
            alt={productName}
            className="w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <Package size={40} className="text-gray-300" />
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={href} className="block">
          <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 leading-snug hover:text-green-700 transition-colors">
            {productName}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
              />
            ))}
          </div>
          <span className="text-[11px] text-gray-400">({reviews})</span>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3 mb-2">
          {unitsSold > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <TrendingUp size={10} /> {unitsSold} sold
            </span>
          )}
          {savedByCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Heart size={10} /> {savedByCount}
            </span>
          )}
          {countInStock <= 5 && countInStock > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold">
              <Zap size={10} /> {countInStock} left!
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-gray-900">{format(price)}</span>
          {oldPrice > price && (
            <span className="text-xs text-gray-400 line-through">{format(oldPrice)}</span>
          )}
        </div>

        {/* Stock badge */}
        <div className="mb-2">
          {isUnavailable ? (
            <span className="text-[11px] text-red-500 font-medium">Out of Stock</span>
          ) : countInStock <= 5 ? (
            <span className="text-[11px] text-red-500 font-semibold">Only {countInStock} left!</span>
          ) : countInStock <= 20 ? (
            <span className="text-[11px] text-orange-500 font-medium">{countInStock} items left</span>
          ) : (
            <span className="text-[11px] text-green-600 font-medium">In Stock ({countInStock})</span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isUnavailable}
          className={`mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
            isUnavailable
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-[0.98]'
          }`}
        >
          <ShoppingCart size={15} />
          {isUnavailable ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
