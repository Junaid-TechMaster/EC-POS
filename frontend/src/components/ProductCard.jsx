// frontend/src/components/ProductCard.jsx
import { Heart, ShoppingCart, Star } from 'lucide-react';

const ProductCard = ({ title, oldPrice, price, discount, reviews }) => {
  return (
    <div className="relative group bg-white p-4 rounded-2xl border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Product Image Placeholder */}
      <div className="w-full h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center">
        <span className="text-gray-400 text-sm">[ Image ]</span>
      </div>
      
      {/* Info */}
      <h3 className="font-medium text-gray-800 text-center mb-1">{title}</h3>
      
      {/* Stars */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-xs text-gray-400 ml-1">({reviews})</span>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-400 line-through">${oldPrice}</span>
        <span className="font-bold text-gray-900">${price}</span>
        <span className="text-[10px] font-bold text-gray-500 border border-gray-200 px-1 rounded">{discount} OFF</span>
      </div>

      {/* Hover Action Buttons (Hidden by default, show on hover) */}
      <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
        <input type="number" defaultValue="1" className="w-16 border border-gray-200 rounded-md text-center text-sm outline-none" min="1" />
        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center gap-2 text-sm font-semibold py-2 transition-colors">
          <ShoppingCart size={16} /> Add to Cart
        </button>
        <button className="border border-gray-200 hover:border-green-500 hover:text-green-500 rounded-md p-2 transition-colors text-gray-600">
          <Heart size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;