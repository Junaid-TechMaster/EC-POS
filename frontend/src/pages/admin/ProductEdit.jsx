import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Save, Plus, Trash2, Upload, X, Image as ImageIcon,
  Eye, EyeOff, ExternalLink, Clock, Search,
  Tag, Package, Truck, Percent, Zap, ChevronDown,
} from 'lucide-react';

const PRESET_TAGS = ['organic', 'bestseller', 'new', 'sale', 'hot', 'featured', 'limited'];

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500 bg-white text-sm transition-colors"
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 bg-white text-sm resize-none transition-colors"
  />
);

const SelectField = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500 bg-white text-sm appearance-none transition-colors pr-8"
  >
    {children}
  </select>
);

const Field = ({ label, hint, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const STATUS_COLORS = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  out_of_stock: 'bg-red-100 text-red-600',
};

const ProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('general');

  // Basic
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('draft');
  const [isVisible, setIsVisible] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Pricing
  const [price, setPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);
  const [unitType, setUnitType] = useState('piece');
  const [boxPrice, setBoxPrice] = useState(0);
  const [boxContents, setBoxContents] = useState('');

  // Inventory
  const [countInStock, setCountInStock] = useState(0);

  // Images
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const primaryFileRef = useRef(null);
  const extraFileRef = useRef(null);

  // Categories
  const [allCategories, setAllCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [subSubcategory, setSubSubcategory] = useState('');

  // Tags
  const [featureTags, setFeatureTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  // Shipping
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);

  // GST
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState(0);

  // Variations
  const [variations, setVariations] = useState([]);

  // Deal
  const [dealEndsAt, setDealEndsAt] = useState('');

  // Related Products
  const [relatedSearch, setRelatedSearch] = useState('');
  const [relatedResults, setRelatedResults] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [costPrice, setCostPrice] = useState(0);
  const [productSlug, setProductSlug] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [priceWarning, setPriceWarning] = useState(null); // null | 'draft' | 'publish'

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get(`/api/products/${productId}`),
        ]);
        setAllCategories(catRes.data || []);

        const d = prodRes.data;
        setName(d.name || '');
        setDescription(d.description || '');
        setDetailedDescription(d.detailedDescription || '');
        setBrand(d.brand || '');
        setStatus(d.status || 'draft');
        setIsVisible(d.isVisible !== false);
        setDiscountPercent(d.discountPercent || 0);
        setPrice(d.price || 0);
        setOldPrice(d.oldPrice || 0);
        setUnitType(d.unitType || 'piece');
        setBoxPrice(d.boxPrice || 0);
        setBoxContents(d.boxContents || '');
        setCountInStock(d.countInStock || 0);
        setImage(d.image || '');
        setImages(d.images?.filter(Boolean) || []);
        setCategory(d.category || '');
        setSubcategory(d.subcategory || '');
        setSubSubcategory(d.subSubcategory || '');
        setFeatureTags(d.featureTags || []);
        setDeliveryCharge(d.deliveryCharge || 0);
        setFreeDeliveryThreshold(d.freeDeliveryThreshold || 0);
        setGstApplicable(d.gstApplicable || false);
        setGstRate(d.gstRate || 0);
        setVariations(d.variations || []);
        setDealEndsAt(d.dealEndsAt ? new Date(d.dealEndsAt).toISOString().slice(0, 16) : '');
        setRelatedProducts(d.relatedProducts || []);
        setCostPrice(d.costPrice || 0);
        setProductSlug(d.slug || '');
        setLastSaved(d.updatedAt ? new Date(d.updatedAt) : null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [productId]);

  // Derived category options
  const selectedCatObj = allCategories.find(c => c.name === category);
  const subcategoryOptions = selectedCatObj?.subcategories || [];
  const selectedSubObj = subcategoryOptions.find(s => s.name === subcategory);
  const subSubOptions = selectedSubObj?.subSubcategories || [];

  const handleCategoryChange = (val) => { setCategory(val); setSubcategory(''); setSubSubcategory(''); };
  const handleSubcategoryChange = (val) => { setSubcategory(val); setSubSubcategory(''); };

  // Upload helpers
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await axios.post('/api/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePrimaryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      setImage(url);
      setImages(prev => prev.includes(url) ? prev : [url, ...prev]);
    }
  };

  const handleExtraUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setImages(prev => [...prev, url]);
    e.target.value = '';
  };

  // Related product search
  const searchRelated = useCallback(async (q) => {
    if (!q || q.length < 2) { setRelatedResults([]); return; }
    try {
      const { data } = await axios.get(
        `/api/products?search=${encodeURIComponent(q)}&pageSize=5&showAll=1`,
        { withCredentials: true }
      );
      setRelatedResults((data.products || []).filter(p => p._id !== productId));
    } catch {
      setRelatedResults([]);
    }
  }, [productId]);

  useEffect(() => {
    const t = setTimeout(() => searchRelated(relatedSearch), 400);
    return () => clearTimeout(t);
  }, [relatedSearch, searchRelated]);

  // Auto-calculate discount % when sale price and old price change
  useEffect(() => {
    if (Number(oldPrice) > 0 && Number(price) > 0 && Number(price) < Number(oldPrice)) {
      setDiscountPercent(Math.round((1 - Number(price) / Number(oldPrice)) * 100));
    } else if (Number(oldPrice) === 0 || Number(price) >= Number(oldPrice)) {
      setDiscountPercent(0);
    }
  }, [price, oldPrice]);

  const addRelated = (p) => {
    setRelatedProducts(prev =>
      prev.find(r => (r._id || r) === p._id) ? prev : [...prev, { _id: p._id, name: p.name, image: p.image }]
    );
    setRelatedSearch('');
    setRelatedResults([]);
  };
  const removeRelated = (id) => setRelatedProducts(prev => prev.filter(r => (r._id || r) !== id));

  // Tag helpers
  const togglePresetTag = (tag) =>
    setFeatureTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !featureTags.includes(t)) setFeatureTags(prev => [...prev, t]);
    setCustomTag('');
  };

  // Variation helpers
  const updateVariation = (idx, field, val) =>
    setVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  const addVariation = () => setVariations(prev => [...prev, { name: '', price: 0, stock: 0 }]);
  const removeVariation = (idx) => setVariations(prev => prev.filter((_, i) => i !== idx));

  const buildPayload = (overrideStatus) => ({
    name, description, detailedDescription, brand,
    status: overrideStatus ?? status,
    isVisible, discountPercent,
    price, oldPrice, unitType, boxPrice, boxContents,
    countInStock, costPrice,
    image: image || images[0] || '',
    images,
    category, subcategory, subSubcategory,
    featureTags,
    deliveryCharge, freeDeliveryThreshold,
    gstApplicable, gstRate,
    variations,
    dealEndsAt: dealEndsAt || null,
    relatedProducts: relatedProducts.map(r => r._id || r),
  });

  const doSave = async (overrideStatus) => {
    setSaving(true);
    try {
      const { data } = await axios.put(
        `/api/products/${productId}`,
        buildPayload(overrideStatus),
        { withCredentials: true }
      );
      if (overrideStatus === 'published') {
        navigate('/admin/productlist');
      } else {
        // Use status returned from server (handles undefined overrideStatus correctly)
        setStatus(data.status || status);
        setLastSaved(new Date());
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerSave = (actionStatus) => {
    if (costPrice > 0 && Number(price) > 0 && Number(price) < costPrice) {
      setPriceWarning(actionStatus);
      return;
    }
    doSave(actionStatus);
  };

  const saveAsDraft = () => doSave(undefined); // save with current status, no price-warning block
  const publish = () => triggerSave('published');

  const formatTime = (d) =>
    d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="h-screen flex flex-col bg-[#f5f6fa] overflow-hidden">

      {/* Top header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/admin/productlist" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
            <ArrowLeft size={16} /> Products
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-800">Add New Product</span>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock size={12} /> Last saved {formatTime(lastSaved)}
            </span>
          )}
          <button
            onClick={saveAsDraft}
            disabled={saving || loading}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={publish}
            disabled={saving || loading}
            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Save size={14} /> Publish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-green-600">
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
            <span className="text-sm font-semibold">Loading product…</span>
          </div>
        </div>
      ) : error ? (
        <div className="m-6 bg-red-100 text-red-700 p-4 rounded-xl text-sm">{error}</div>
      ) : (
        <div className="flex-1 overflow-hidden flex gap-5 p-5">

          {/* ── LEFT PANEL ── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">

            {/* Images card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Product Images</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">

                {/* Cover image */}
                <div
                  className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer group"
                  style={{ aspectRatio: '1' }}
                  onClick={() => primaryFileRef.current?.click()}
                >
                  {image ? (
                    <>
                      <img src={image} alt="cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <Upload size={22} className="text-white" />
                        <span className="text-white text-xs font-medium">Change Cover</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-500 transition-colors">
                      <ImageIcon size={36} />
                      <span className="text-xs font-medium text-center px-4">Click to upload cover image</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input ref={primaryFileRef} type="file" accept="image/*" className="hidden" onChange={handlePrimaryUpload} />

                {/* Thumbnail grid */}
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 5).map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200 group bg-gray-50" style={{ aspectRatio: '1' }}>
                      <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => prev.filter((_, j) => j !== i));
                          if (image === img) setImage(images.find((_, j) => j !== i) || '');
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow"
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => extraFileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl border-2 border-dashed border-green-300 flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
                    style={{ aspectRatio: '1' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <input ref={extraFileRef} type="file" accept="image/*" className="hidden" onChange={handleExtraUpload} />

                {/* URL paste fallback */}
                <input
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="Or paste image URL…"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-green-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Visibility</h3>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  {isVisible
                    ? <Eye size={15} className="text-green-600" />
                    : <EyeOff size={15} className="text-gray-400" />}
                  {isVisible ? 'Visible in store' : 'Hidden from store'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsVisible(v => !v)}
                  className={`relative rounded-full transition-colors flex-shrink-0 ${isVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                  style={{ width: '40px', height: '22px' }}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isVisible ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Preview</h3>
              <a
                href={`/product/${productSlug || productId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-green-600 hover:underline"
              >
                <ExternalLink size={13} /> View on store
              </a>
            </div>

            {/* Related Products */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Related Products</h3>
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={relatedSearch}
                  onChange={e => setRelatedSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-green-500 bg-gray-50"
                />
                {relatedResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    {relatedResults.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => addRelated(p)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 text-left"
                      >
                        <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-800 truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {relatedProducts.map(r => {
                  const id = r._id || r;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-1.5">
                      {r.image && <img src={r.image} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />}
                      <span className="text-xs text-gray-700 flex-1 truncate">{r.name || id}</span>
                      <button type="button" onClick={() => removeRelated(id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                {relatedProducts.length === 0 && (
                  <p className="text-xs text-gray-400">No related products added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-full">

              {/* Card header + tabs */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-gray-900 text-base">Product Details</h2>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
                    {status === 'out_of_stock' ? 'Out of Stock' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['general', 'advanced'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                        activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable tab body */}
              <div className="flex-1 overflow-y-auto p-6">

                {activeTab === 'general' ? (
                  <div className="flex flex-col gap-5">

                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Product Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Organic Green Apples" />
                      </Field>
                      <Field label="Status">
                        <div className="relative">
                          <SelectField value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </SelectField>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Brand" required>
                        <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. OrganicFarm" />
                      </Field>
                      <Field label="Current Stock" hint="Updated via Purchase Ledger">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                          <span className={`text-sm font-bold ${countInStock === 0 ? 'text-red-500' : countInStock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                            {countInStock} units
                          </span>
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Category" required>
                        <div className="relative">
                          <SelectField value={category} onChange={e => handleCategoryChange(e.target.value)}>
                            <option value="">— Select category —</option>
                            {allCategories.map(c => (
                              <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                          </SelectField>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        {allCategories.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">No categories found. <a href="/admin/categories" className="underline">Add categories first.</a></p>
                        )}
                      </Field>
                      {subcategoryOptions.length > 0 && (
                        <Field label="Subcategory">
                          <div className="relative">
                            <SelectField value={subcategory} onChange={e => handleSubcategoryChange(e.target.value)}>
                              <option value="">— Select subcategory —</option>
                              {subcategoryOptions.map((s, i) => (
                                <option key={i} value={s.name}>{s.name}</option>
                              ))}
                            </SelectField>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </Field>
                      )}
                    </div>

                    {subSubOptions.length > 0 && (
                      <Field label="Sub-Subcategory">
                        <div className="relative">
                          <SelectField value={subSubcategory} onChange={e => setSubSubcategory(e.target.value)}>
                            <option value="">— Select —</option>
                            {subSubOptions.map((ss, i) => (
                              <option key={i} value={ss.name}>{ss.name}</option>
                            ))}
                          </SelectField>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </Field>
                    )}

                    <div className="grid grid-cols-3 gap-5">
                      <Field label="Cost Price (Rs)" hint="Purchase cost — sets margin">
                        <Input type="number" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} min="0" step="0.01" />
                      </Field>
                      <Field label="Sale Price (Rs)" required>
                        <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min="0" step="0.01" />
                      </Field>
                      <Field label="Discount %" hint="Auto-calculated from old price">
                        <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} min="0" max="100" step="0.1" />
                      </Field>
                    </div>

                    <Field label="Short Description" required hint="Shown on product cards and search results">
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief product summary…" />
                    </Field>

                    <Field label="Detailed Description" hint="Full description shown on the product detail page">
                      <Textarea value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} rows={6} placeholder="Full product information, ingredients, certifications…" />
                    </Field>
                  </div>

                ) : (
                  /* ADVANCED TAB */
                  <div className="flex flex-col gap-7">

                    {/* Pricing advanced */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pricing</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Original / Old Price (Rs)" hint="Crossed-out above sale price">
                          <Input type="number" value={oldPrice} onChange={e => setOldPrice(Number(e.target.value))} min="0" step="0.01" />
                        </Field>
                        <Field label="Unit Type">
                          <div className="relative">
                            <SelectField value={unitType} onChange={e => setUnitType(e.target.value)}>
                              <option value="piece">Piece / Unit</option>
                              <option value="box">Box only</option>
                              <option value="both">Both (Piece + Box)</option>
                            </SelectField>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </Field>
                      </div>
                      {(unitType === 'box' || unitType === 'both') && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <Field label="Box Price (Rs)">
                            <Input type="number" value={boxPrice} onChange={e => setBoxPrice(Number(e.target.value))} min="0" step="0.01" />
                          </Field>
                          <Field label="Box Contents" hint="e.g. 12 pieces per box">
                            <Input value={boxContents} onChange={e => setBoxContents(e.target.value)} placeholder="e.g. 12 pieces" />
                          </Field>
                        </div>
                      )}
                    </div>

                    {/* Shipping */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Truck size={12} /> Shipping
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Delivery Charge (Rs)" hint="0 = free delivery">
                          <Input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(Number(e.target.value))} min="0" step="0.01" />
                        </Field>
                        <Field label="Free Delivery Above (Rs)">
                          <Input type="number" value={freeDeliveryThreshold} onChange={e => setFreeDeliveryThreshold(Number(e.target.value))} min="0" step="0.01" />
                        </Field>
                      </div>
                    </div>

                    {/* GST */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Percent size={12} /> Tax (GST)
                      </h3>
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <button
                          type="button"
                          onClick={() => setGstApplicable(v => !v)}
                          className={`relative rounded-full transition-colors flex-shrink-0 ${gstApplicable ? 'bg-green-500' : 'bg-gray-300'}`}
                          style={{ width: '40px', height: '22px' }}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${gstApplicable ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-sm text-gray-700 font-medium">GST Applicable</span>
                      </label>
                      {gstApplicable && (
                        <Field label="GST Rate (%)">
                          <Input type="number" value={gstRate} onChange={e => setGstRate(Number(e.target.value))} min="0" max="100" step="0.1" />
                        </Field>
                      )}
                    </div>

                    {/* Variations */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Package size={12} /> Variations
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {variations.map((v, i) => (
                          <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <Field label="Name">
                              <Input value={v.name} onChange={e => updateVariation(i, 'name', e.target.value)} placeholder="e.g. 500g" />
                            </Field>
                            <Field label="Price (Rs)">
                              <Input type="number" value={v.price} onChange={e => updateVariation(i, 'price', Number(e.target.value))} min="0" />
                            </Field>
                            <div className="flex items-end gap-2">
                              <Field label="Stock">
                                <Input type="number" value={v.stock} onChange={e => updateVariation(i, 'stock', Number(e.target.value))} min="0" />
                              </Field>
                              <button type="button" onClick={() => removeVariation(i)} className="mb-0.5 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addVariation} className="flex items-center gap-1.5 text-green-600 text-sm font-medium hover:underline w-fit">
                          <Plus size={14} /> Add variation
                        </button>
                      </div>
                    </div>

                    {/* Feature Tags */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Tag size={12} /> Feature Tags
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {PRESET_TAGS.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => togglePresetTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-colors ${
                              featureTags.includes(tag)
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {featureTags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {featureTags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                              {tag}
                              <button type="button" onClick={() => setFeatureTags(prev => prev.filter(t => t !== tag))}>
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={customTag}
                          onChange={e => setCustomTag(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                          placeholder="Add custom tag…"
                          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-green-500"
                        />
                        <button type="button" onClick={addCustomTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors">
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Flash Sale */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap size={12} /> Flash Sale Timer
                      </h3>
                      <Field label="Deal Ends At" hint="Leave blank to disable the countdown timer">
                        <Input type="datetime-local" value={dealEndsAt} onChange={e => setDealEndsAt(e.target.value)} />
                      </Field>
                      {dealEndsAt && (
                        <button type="button" onClick={() => setDealEndsAt('')} className="mt-2 text-xs text-red-500 hover:underline">
                          Remove timer
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Price Warning Modal */}
      {priceWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Sale Price Below Cost Price</h3>
                <p className="text-sm text-gray-600">
                  Sale price <span className="font-semibold text-red-600">Rs {Number(price).toFixed(0)}</span> is lower than
                  the last purchase cost <span className="font-semibold text-gray-800">Rs {costPrice.toFixed(0)}</span>.
                  Selling at this price will result in a <span className="font-semibold text-red-600">loss of Rs {(costPrice - Number(price)).toFixed(0)}</span> per unit.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPriceWarning(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
              >
                Fix Price
              </button>
              <button
                onClick={() => { const a = priceWarning; setPriceWarning(null); doSave(a); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
              >
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEdit;
