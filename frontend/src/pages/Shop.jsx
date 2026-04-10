// frontend/src/pages/Shop.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const categories = ['All', 'Fruits & Vegetables', 'Breads & Sweets', 'Beverages', 'Meat Products', 'Dairy'];
  const brands = ['Farm Fresh', 'OrganicCo', 'GreenLeaf', 'Nature Valley', 'Healthy Eats'];
  
  // --- NEW: Real State for Database Products ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(100);
  const [selectedBrands, setSelectedBrands] = useState(['Farm Fresh']);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // --- NEW: Fetch Products from Backend ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // This calls our Node.js API!
        const { data } = await axios.get('http://localhost:5000/api/products');
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleBrand = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="w-full pb-16">
      
      {/* Banner & Breadcrumbs */}
      <div className="bg-[#fdf9f0] rounded-3xl p-8 md:p-12 mb-8 text-center relative overflow-hidden mt-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 relative z-10">Shop Organic</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 relative z-10">
          <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Shop</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="lg:hidden flex items-center justify-center gap-2 bg-gray-900 text-white p-3 rounded-xl font-medium">
          <Filter size={18} /> Filters
        </button>

        {/* Sidebar Filters (Omitted full code for brevity, it remains the same as before!) */}
        <aside className={`lg:w-1/4 flex-col gap-8 ${isMobileFilterOpen ? 'flex' : 'hidden lg:flex'}`}>
           <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Categories</h3>
            <ul className="flex flex-col gap-3">
              {categories.map((cat, i) => (
                <li key={i}>
                  <button onClick={() => setActiveCategory(cat)} className={`text-sm flex items-center justify-between w-full transition-colors ${activeCategory === cat ? 'text-green-600 font-bold' : 'text-gray-600 hover:text-green-600'}`}>
                    {cat}
                    {activeCategory === cat && <ChevronRight size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Content (Product Grid) */}
        <div className="lg:w-3/4 flex flex-col">
          
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900 font-bold">1–{products.length}</span> results
            </p>
          </div>

          {/* --- NEW: Loading, Error, and Dynamic Grid --- */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-green-600 font-bold text-xl">Loading organic goodness...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              {products.map((product) => (
                // Notice we are passing the MongoDB _id to the ProductCard now!
                <Link to={`/product/${product._id}`} key={product._id} className="block group">
                  <ProductCard 
                    title={product.name} 
                    oldPrice={product.oldPrice?.toFixed(2)} 
                    price={product.price?.toFixed(2)} 
                    discount={`${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`} 
                    reviews={product.numReviews} 
                  />
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Shop;