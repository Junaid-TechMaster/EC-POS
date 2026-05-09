import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/api';
import { ArrowLeft, Folder, ChevronRight, Package } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/categories')
      .then(res => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-green-600">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading categories…</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
          <ArrowLeft size={15} /> Home
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">All Categories</h1>
        <p className="text-gray-500 mt-1">Browse our full range of organic and fresh products</p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Folder size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No categories yet</p>
          <p className="text-sm mt-1">Categories will appear here once added by the admin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {categories.map((cat) => (
            <div key={cat._id}>
              {/* Category header card */}
              <Link
                to={`/category/${cat.slug}`}
                className="group flex items-center gap-4 mb-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-green-400 hover:shadow-md transition-all"
              >
                {/* Icon / Image */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ backgroundColor: cat.color ? `${cat.color}20` : '#f0fdf4' }}
                >
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : cat.icon ? (
                    <span>{cat.icon}</span>
                  ) : (
                    <Package size={24} className="text-green-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors flex items-center gap-2">
                    {cat.name}
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600" />
                  </h2>
                  {cat.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {cat.subcategories?.length || 0} subcategories
                  </p>
                </div>

                <span className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 rounded-full flex-shrink-0">
                  Browse →
                </span>
              </Link>

              {/* Subcategories grid */}
              {cat.subcategories?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pl-2">
                  {cat.subcategories.map((sub, si) => (
                    <div key={si}>
                      <Link
                        to={`/category/${cat.slug}?sub=${encodeURIComponent(sub.name)}`}
                        className="group flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-green-300 hover:shadow-sm transition-all text-center"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          {sub.image ? (
                            <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Folder size={18} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-green-700 transition-colors leading-tight line-clamp-2">
                          {sub.name}
                        </span>
                        {sub.subSubcategories?.length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {sub.subSubcategories.length} sub
                          </span>
                        )}
                      </Link>

                      {/* Sub-subcategories */}
                      {sub.subSubcategories?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 px-1">
                          {sub.subSubcategories.slice(0, 3).map((ss, ssi) => (
                            <Link
                              key={ssi}
                              to={`/category/${cat.slug}?sub=${encodeURIComponent(sub.name)}&subsub=${encodeURIComponent(ss.name)}`}
                              className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-700 rounded-full transition-colors"
                            >
                              {ss.name}
                            </Link>
                          ))}
                          {sub.subSubcategories.length > 3 && (
                            <span className="text-[10px] text-gray-400 px-1">+{sub.subSubcategories.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
