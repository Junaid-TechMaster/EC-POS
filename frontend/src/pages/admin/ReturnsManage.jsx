import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Trash2, RotateCcw, ChevronDown, ArrowLeft } from 'lucide-react';

const ReturnsManage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [posSales, setPosSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [returnType, setReturnType] = useState('sale_return');
  const [referenceId, setReferenceId] = useState('');
  const [items, setItems] = useState([{ product: '', qty: 1, reason: '' }]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    const fetchData = async () => {
      try {
        const [productsRes, salesRes] = await Promise.all([
          axios.get('/api/products?pageSize=200'),
          axios.get('/api/transactions/pos?limit=50', { withCredentials: true }),
        ]);
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products || []);
        setPosSales(salesRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  // When a POS sale is selected, auto-populate items from it
  const handleSaleSelect = (saleId) => {
    setReferenceId(saleId);
    if (!saleId) { setItems([{ product: '', qty: 1, reason: '' }]); return; }
    const sale = posSales.find(s => s._id === saleId);
    if (sale) {
      setItems(sale.products.map(p => ({
        product: p.product?._id || p.product,
        qty: p.qty,
        reason: '',
      })));
    }
  };

  const addItem = () => setItems(prev => [...prev, { product: '', qty: 1, reason: '' }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!referenceId.trim()) { setError('Reference ID is required'); return; }
    const validItems = items.filter(i => i.product && Number(i.qty) > 0);
    if (validItems.length === 0) { setError('Add at least one item'); return; }

    setSaving(true);
    try {
      await axios.post(
        '/api/transactions/return',
        {
          type: returnType,
          referenceId: referenceId.trim(),
          items: validItems.map(i => ({ product: i.product, qty: Number(i.qty), reason: i.reason })),
        },
        { withCredentials: true }
      );
      setReferenceId('');
      setItems([{ product: '', qty: 1, reason: '' }]);
      setSuccess(`${returnType === 'sale_return' ? 'Sale return' : 'Purchase return'} recorded!${returnType === 'sale_return' ? ' Stock has been restocked.' : ''}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-green-600 font-bold text-xl">Loading...</div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-3 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <RotateCcw className="text-orange-500" size={28} /> Returns Management
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Create Return</h2>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-semibold">{success}</div>}

        {/* Return Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Return Type</label>
          <div className="flex gap-4">
            {[
              { value: 'sale_return', label: 'Sale Return', desc: 'Customer returning item (restocks inventory)' },
              { value: 'purchase_return', label: 'Purchase Return', desc: 'Returning item to vendor' },
            ].map(opt => (
              <label key={opt.value} className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${returnType === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="returnType"
                  value={opt.value}
                  checked={returnType === opt.value}
                  onChange={e => { setReturnType(e.target.value); setReferenceId(''); setItems([{ product: '', qty: 1, reason: '' }]); }}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <p className="font-bold text-gray-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reference — POS Sale selector for sale_return, manual ID for purchase_return */}
        {returnType === 'sale_return' ? (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Select POS Sale to Return</label>
            <div className="relative">
              <select
                value={referenceId}
                onChange={e => handleSaleSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 pr-10 text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select POS Sale --</option>
                {posSales.map(sale => (
                  <option key={sale._id} value={sale._id}>
                    #{sale._id.substring(0, 8)} — Rs {sale.totalAmount} — {new Date(sale.createdAt).toLocaleDateString()} — {sale.paymentMethod}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Purchase Reference ID</label>
            <input
              type="text"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder="Paste the purchase _id here"
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-gray-700">Return Items</label>
            <button type="button" onClick={addItem} className="text-green-600 hover:text-green-700 text-sm font-bold flex items-center gap-1">
              <Plus size={14} /> Add Row
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select
                    value={item.product}
                    onChange={e => updateItem(idx, 'product', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Product --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="1"
                    value={item.qty}
                    onChange={e => updateItem(idx, 'qty', e.target.value)}
                    placeholder="Qty"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.reason}
                    onChange={e => updateItem(idx, 'reason', e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw size={16} /> {saving ? 'Processing...' : 'Submit Return'}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
        <p className="font-bold mb-1">How Returns Work</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li><strong>Sale Return:</strong> Customer returns a product — inventory is automatically restocked.</li>
          <li><strong>Purchase Return:</strong> You return items to a vendor — inventory is NOT automatically adjusted (manual recount needed).</li>
          <li>For sale returns, selecting the POS sale auto-fills the items list.</li>
        </ul>
      </div>
    </div>
  );
};

export default ReturnsManage;
