import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Filter, X, ChevronDown, SlidersHorizontal, Grid2X2, List, ArrowLeft } from 'lucide-react';
import axios from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Helmet } from 'react-helmet-async';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcats, setExpandedSubcats] = useState({});

  // Active filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [activeSubSub, setActiveSubSub] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const searchQuery = searchParams.get('search') || '';

  const fetchCategories = useCallback(async () => {
    // Fetch independently so one failure never wipes the other
    const safe = (p) => p.catch(() => ({ data: null }));
    const [catRes, brandRes] = await Promise.all([
      safe(axios.get('/api/categories')),
      safe(axios.get('/api/products/brands')),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (brandRes.data) setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeCategory) params.append('category', activeCategory);
      if (activeSubcategory) params.append('subcategory', activeSubcategory);
      if (activeSubSub) params.append('subSubcategory', activeSubSub);
      if (selectedBrands.length === 1) params.append('brand', selectedBrands[0]);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (activeTag) params.append('tag', activeTag);
      if (sortBy !== 'newest') params.append('sort', sortBy);
      params.append('page', page);

      const { data } = await axios.get(`/api/products?${params}`);
      if (Array.isArray(data)) {
        setProducts(data);
        setPages(1);
      } else {
        setProducts(data.products || []);
        setPages(data.pages || 1);
        if (data.priceRange) {
          setPriceRange(data.priceRange);
          if (maxPrice === null) setMaxPrice(data.priceRange.max);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, activeSubcategory, activeSubSub, selectedBrands, maxPrice, activeTag, sortBy, page]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Sync URL search param → filter
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setActiveCategory('');
    setActiveSubcategory('');
    setActiveSubSub('');
    setSelectedBrands([]);
    setMaxPrice(priceRange.max);
    setActiveTag('');
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  const activeFiltersCount = [
    activeCategory, activeSubcategory, activeSubSub, activeTag,
    ...selectedBrands,
    maxPrice && maxPrice < priceRange.max ? 'price' : '',
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">

      {activeFiltersCount > 0 && (
        <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium">
          <X size={14} /> Clear all filters ({activeFiltersCount})
        </button>
      )}

      {/* Categories (from DB) */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 text-sm uppercase tracking-wide">Categories</h3>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                onClick={() => { setActiveCategory(''); setActiveSubcategory(''); setActiveSubSub(''); }}
                className={`text-sm w-full text-left py-1.5 px-2 rounded-lg transition-colors ${!activeCategory ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'}`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat._id}>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setActiveSubcategory('');
                      setActiveSubSub('');
                      setExpandedCategories((prev) => ({ ...prev, [cat._id]: !prev[cat._id] }));
                    }}
                    className={`flex-1 text-sm text-left py-1.5 px-2 rounded-lg transition-colors flex items-center gap-2 ${activeCategory === cat.name ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'}`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: `${cat.color || '#16a34a'}20` }}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span className="text-xs leading-none">{cat.icon || '📦'}</span>
                      )}
                    </div>
                    {cat.name}
                  </button>
                  {cat.subcategories?.length > 0 && (
                    <button onClick={() => setExpandedCategories((p) => ({ ...p, [cat._id]: !p[cat._id] }))} className="p-1 text-gray-400">
                      <ChevronDown size={14} className={`transition-transform ${expandedCategories[cat._id] ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {expandedCategories[cat._id] && cat.subcategories?.map((sub) => (
                  <div key={sub._id} className="ml-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => { setActiveCategory(cat.name); setActiveSubcategory(sub.name); setActiveSubSub(''); setExpandedSubcats((p) => ({ ...p, [sub._id]: !p[sub._id] })); }}
                        className={`flex-1 text-sm text-left py-1 px-2 rounded-lg transition-colors ${activeSubcategory === sub.name ? 'text-green-700 font-semibold' : 'text-gray-500 hover:text-green-600 hover:bg-gray-50'}`}
                      >
                        {sub.name}
                      </button>
                      {sub.subSubcategories?.length > 0 && (
                        <button onClick={() => setExpandedSubcats((p) => ({ ...p, [sub._id]: !p[sub._id] }))} className="p-1 text-gray-400">
                          <ChevronDown size={12} className={`transition-transform ${expandedSubcats[sub._id] ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    {expandedSubcats[sub._id] && sub.subSubcategories?.map((ss) => (
                      <button
                        key={ss._id}
                        onClick={() => { setActiveCategory(cat.name); setActiveSubcategory(sub.name); setActiveSubSub(ss.name); }}
                        className={`block w-full text-left text-xs py-1 px-3 ml-3 rounded-lg transition-colors ${activeSubSub === ss.name ? 'text-green-700 font-semibold' : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'}`}
                      >
                        {ss.name}
                      </button>
                    ))}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 text-sm uppercase tracking-wide">Brand</h3>
          <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <li key={brand}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-gray-300 accent-green-600"
                  />
                  <span className={`text-sm transition-colors ${selectedBrands.includes(brand) ? 'text-green-700 font-semibold' : 'text-gray-600 group-hover:text-green-600'}`}>
                    {brand}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 text-sm uppercase tracking-wide">Price Range</h3>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Rs {priceRange.min.toLocaleString()}</span>
          <span className="font-semibold text-gray-700">Rs {(maxPrice || priceRange.max).toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={priceRange.min}
          max={priceRange.max}
          value={maxPrice ?? priceRange.max}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-green-600"
        />
      </div>

      {/* Tags */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 text-sm uppercase tracking-wide">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {['organic', 'bestseller', 'new', 'sale', 'hot', 'featured'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${
                activeTag === tag ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full pb-16">
      <Helmet>
        <title>Shop — OrganicPOS</title>
        <meta name="description" content="Browse our full range of organic products. Filter by category, brand, and price." />
      </Helmet>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
        <ArrowLeft size={15} /> Back to Home
      </Link>

      {/* Banner */}
      <div className="bg-[#fdf9f0] rounded-3xl p-8 md:p-12 mb-8 text-center relative overflow-hidden">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 relative z-10">
          {searchQuery ? `Results for "${searchQuery}"` : activeCategory || 'Shop Organic'}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 relative z-10">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Shop</span>
          {activeCategory && <><ChevronRight size={14} /><span className="text-gray-900 font-medium">{activeCategory}</span></>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden flex items-center justify-center gap-2 bg-gray-900 text-white p-3 rounded-xl font-medium"
        >
          <SlidersHorizontal size={18} /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>

        {/* Sidebar */}
        <aside className={`lg:w-64 flex-shrink-0 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
            <FilterPanel />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 flex flex-col">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{products.length}</span> products found
            </p>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Grid2X2 size={16} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-green-600 font-semibold text-lg">
              Loading organic goodness...
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">{error}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Filter size={40} className="mb-3 opacity-40" />
              <p className="font-semibold text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
              <button onClick={clearFilters} className="mt-4 text-green-600 font-medium text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'flex flex-col gap-4'
            }>
              {products.map((product) => (
                <Link to={`/product/${product.slug || product._id}`} key={product._id} className="block group">
                  <ProductCard
                    id={product._id}
                    slug={product.slug}
                    title={product.name}
                    price={product.price}
                    oldPrice={product.oldPrice}
                    rating={product.rating}
                    reviews={product.numReviews}
                    image={product.image}
                    images={product.images}
                    countInStock={product.countInStock}
                    unitsSold={product.unitsSold}
                    savedByCount={product.savedByCount}
                    featureTags={product.featureTags}
                    status={product.status}
                  />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold ${p === page ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
