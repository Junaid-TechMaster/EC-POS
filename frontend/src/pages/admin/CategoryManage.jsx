import { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { FolderOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

const API = '/api/categories';

const slugify = (str) => str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const CategoryManage = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [catSearch, setCatSearch] = useState('');

  // Top-level category modal
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');

  // Subcategory add modal
  const [subModal, setSubModal] = useState(false);
  const [subParentId, setSubParentId] = useState(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');

  // Sub-subcategory add modal
  const [subSubModal, setSubSubModal] = useState(false);
  const [subSubParentId, setSubSubParentId] = useState(null);
  const [subSubCatId, setSubSubCatId] = useState(null);
  const [subSubName, setSubSubName] = useState('');
  const [subSubSlug, setSubSubSlug] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API);
      setCategories(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // ─── Top-level category ───
  const openNewCat = () => { setEditingCat(null); setCatName(''); setCatSlug(''); setCatImage(''); setCatModal(true); };
  const openEditCat = (cat) => { setEditingCat(cat); setCatName(cat.name); setCatSlug(cat.slug); setCatImage(cat.image || ''); setCatModal(true); };

  const saveCat = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await axios.put(`${API}/${editingCat._id}`, { name: catName, slug: catSlug || slugify(catName), image: catImage }, { withCredentials: true });
      } else {
        await axios.post(API, { name: catName, slug: catSlug || slugify(catName), image: catImage }, { withCredentials: true });
      }
      setCatModal(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const deleteCat = async (id) => {
    if (!confirm('Delete this category and all its subcategories?')) return;
    try {
      await axios.delete(`${API}/${id}`, { withCredentials: true });
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  // ─── Subcategory ───
  const openAddSub = (catId) => { setSubParentId(catId); setSubName(''); setSubSlug(''); setSubModal(true); };

  const saveSub = async (e) => {
    e.preventDefault();
    try {
      const cat = categories.find(c => c._id === subParentId);
      const updatedSubs = [...(cat.subcategories || []), { name: subName, slug: subSlug || slugify(subName), image: '' }];
      await axios.put(`${API}/${subParentId}`, { subcategories: updatedSubs }, { withCredentials: true });
      setSubModal(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const deleteSub = async (catId, subIdx) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      const cat = categories.find(c => c._id === catId);
      const updatedSubs = cat.subcategories.filter((_, i) => i !== subIdx);
      await axios.put(`${API}/${catId}`, { subcategories: updatedSubs }, { withCredentials: true });
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  // ─── Sub-subcategory ───
  const openAddSubSub = (catId, subIdx) => { setSubSubParentId(catId); setSubSubCatId(subIdx); setSubSubName(''); setSubSubSlug(''); setSubSubModal(true); };

  const saveSubSub = async (e) => {
    e.preventDefault();
    try {
      const cat = categories.find(c => c._id === subSubParentId);
      const updatedSubs = cat.subcategories.map((sub, i) => {
        if (i !== subSubCatId) return sub;
        return {
          ...sub,
          subSubcategories: [...(sub.subSubcategories || []), { name: subSubName, slug: subSubSlug || slugify(subSubName), image: '' }],
        };
      });
      await axios.put(`${API}/${subSubParentId}`, { subcategories: updatedSubs }, { withCredentials: true });
      setSubSubModal(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FolderOpen className="text-green-600" /> Category Management
          <span className="text-base font-normal text-gray-400">({categories.length})</span>
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={catSearch}
              onChange={e => setCatSearch(e.target.value)}
              placeholder="Search categories…"
              className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 w-52"
            />
          </div>
          <button onClick={openNewCat} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> New Category
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.filter(cat =>
            !catSearch.trim() || cat.name.toLowerCase().includes(catSearch.toLowerCase())
          ).map(cat => (
            <div key={cat._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Category row */}
              <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                <button onClick={() => toggleExpand(cat._id)} className="text-gray-400 hover:text-gray-600">
                  {expanded[cat._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {cat.image && <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />}
                <div className="flex-1">
                  <span className="font-bold text-gray-800">{cat.name}</span>
                  <span className="text-xs text-gray-400 ml-2">/{cat.slug}</span>
                  <span className="text-xs text-gray-400 ml-2">({cat.subcategories?.length || 0} subs)</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openAddSub(cat._id)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Plus size={12} /> Sub
                  </button>
                  <button onClick={() => openEditCat(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={13} /></button>
                  <button onClick={() => deleteCat(cat._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Subcategories */}
              {expanded[cat._id] && cat.subcategories?.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {cat.subcategories.map((sub, si) => (
                    <div key={si}>
                      <div className="flex items-center gap-3 px-8 py-3 hover:bg-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-gray-700">{sub.name}</span>
                          <span className="text-xs text-gray-400 ml-2">/{sub.slug}</span>
                          <span className="text-xs text-gray-400 ml-1">({sub.subSubcategories?.length || 0})</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openAddSubSub(cat._id, si)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Plus size={11} /> Sub
                          </button>
                          <button onClick={() => deleteSub(cat._id, si)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      </div>

                      {/* Sub-subcategories */}
                      {sub.subSubcategories?.map((ssub, ssi) => (
                        <div key={ssi} className="flex items-center gap-3 px-14 py-2 hover:bg-gray-100">
                          <div className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className="text-xs text-gray-600">{ssub.name}</span>
                          <span className="text-xs text-gray-400">/{ssub.slug}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center text-gray-400 py-16">No categories yet. Create one to get started.</div>
          )}
          {categories.length > 0 && catSearch && categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
            <div className="text-center text-gray-400 py-16">No categories match &ldquo;{catSearch}&rdquo;</div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">{editingCat ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setCatModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={saveCat} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</label>
                <input value={catName} onChange={e => { setCatName(e.target.value); if (!editingCat) setCatSlug(slugify(e.target.value)); }} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug</label>
                <input value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="auto-generated" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category Image</label>
                <ImageUpload value={catImage} onChange={setCatImage} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCatModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> {editingCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub Modal */}
      {subModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">Add Subcategory</h3>
              <button onClick={() => setSubModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={saveSub} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</label>
                <input value={subName} onChange={e => { setSubName(e.target.value); setSubSlug(slugify(e.target.value)); }} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug</label>
                <input value={subSlug} onChange={e => setSubSlug(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSubModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Sub Modal */}
      {subSubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">Add Sub-subcategory</h3>
              <button onClick={() => setSubSubModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={saveSubSub} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</label>
                <input value={subSubName} onChange={e => { setSubSubName(e.target.value); setSubSubSlug(slugify(e.target.value)); }} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug</label>
                <input value={subSubSlug} onChange={e => setSubSubSlug(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSubSubModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={15} /> Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManage;
