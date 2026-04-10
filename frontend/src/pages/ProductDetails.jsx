// frontend/src/pages/ProductDetails.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ProductDetails = () => {
  const { slug } = useParams(); // This is now our MongoDB _id
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // --- NEW: Real State for Database Product ---
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useContext(CartContext);

  // --- NEW: Fetch Single Product from Backend ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:5000/api/products/${slug}`);
        setProduct(data);
        // Reset quantity if they view a new product
        setQuantity(1); 
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    // Format the product object to match our cart's needs
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      countInStock: product.countInStock
    };
    addToCart(cartItem, quantity);
  };

  if (loading) return <div className="text-center py-20 text-green-600 font-bold text-xl">Loading product details...</div>;
  if (error) return <div className="text-center py-20 text-red-600 font-bold">{error}</div>;

  return (
    <div className="w-full pb-16">
      <div className="text-sm text-gray-500 mb-8 mt-4">
        <Link to="/" className="hover:text-green-600">Home</Link> <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-green-600">{product.category}</Link> <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col gap-4">
          <div className="w-full h-96 md:h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
            <span className="text-gray-400 font-bold text-xl">[{product.image}]</span>
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={`fill-yellow-400 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300 fill-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.numReviews} Reviews)</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-4xl font-bold text-green-600">${product.price?.toFixed(2)}</span>
            {product.oldPrice > product.price && (
               <span className="text-xl text-gray-400 line-through mb-1">${product.oldPrice?.toFixed(2)}</span>
            )}
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

          <div className="mb-8 flex items-center gap-4">
            <span className="font-semibold text-gray-900">Stock:</span>
            {product.countInStock > 0 ? (
               <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-bold">In Stock ({product.countInStock} available)</span>
            ) : (
               <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-bold">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart Actions */}
          {product.countInStock > 0 && (
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center border border-gray-300 rounded-full bg-white h-12">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer"><Minus size={18} /></button>
                <input type="number" value={quantity} readOnly className="w-12 text-center font-bold text-gray-900 outline-none bg-transparent" />
                <button onClick={() => setQuantity(Math.min(product.countInStock, quantity + 1))} className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer"><Plus size={18} /></button>
              </div>
              <button onClick={handleAddToCart} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98]">
                <ShoppingCart size={20} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;