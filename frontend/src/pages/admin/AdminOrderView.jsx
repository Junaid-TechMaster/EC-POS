import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Printer, Package, User, Mail, MapPin,
  CreditCard, Truck, ShoppingBag, Calendar, CheckCircle,
  XCircle, AlertCircle, ImageOff, ChevronRight, Clock,
} from 'lucide-react';

const API = '/api';

const badge = (label, color) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
);

/* ── ORDER STATUS PIPELINE ── */
const STATUS_STEPS = [
  { key: 'pending',    label: 'Pending',    icon: ShoppingBag, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
  { key: 'processing', label: 'Processing', icon: Clock,       color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200'     },
  { key: 'shipped',    label: 'Shipped',    icon: Truck,       color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
  { key: 'delivered',  label: 'Delivered',  icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50 border-green-200'   },
];
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const OrderTimeline = ({ orderStatus, isCancelled }) => {
  const activeIdx = isCancelled ? -1 : STATUS_ORDER.indexOf(orderStatus || 'pending');
  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
        <XCircle size={20} className="text-red-500 flex-shrink-0" />
        <p className="text-sm font-bold text-red-600">Order Cancelled</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const done     = idx <= activeIdx;
        const current  = idx === activeIdx;
        const last     = idx === STATUS_STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                done ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300'
              } ${current ? 'ring-2 ring-green-100' : ''}`}>
                <StepIcon size={14} />
              </div>
              {!last && <div className={`w-0.5 flex-1 my-1 ${done && idx < activeIdx ? 'bg-green-400' : 'bg-gray-200'}`} style={{ minHeight: '24px' }} />}
            </div>
            <div className="pb-4 flex-1">
              <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              {current && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Current</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminOrderView = () => {
  const { id } = useParams();
  const { user: adminUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') navigate('/login');
  }, [adminUser, navigate]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/orders/${id}`, { withCredentials: true });
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const markPaid = async () => {
    if (!confirm('Mark this order as paid?')) return;
    setSaving('paid');
    try {
      const { data } = await axios.put(`${API}/orders/${id}/pay-admin`, {}, { withCredentials: true });
      setOrder(data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(''); }
  };

  const markDelivered = async () => {
    if (!confirm('Mark this order as delivered?')) return;
    setSaving('delivered');
    try {
      const { data } = await axios.put(`${API}/orders/${id}/deliver`, {}, { withCredentials: true });
      setOrder(data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(''); }
  };

  const cancelOrder = async () => {
    if (!confirm('Cancel this order and restock items?')) return;
    setSaving('cancel');
    try {
      const { data } = await axios.put(`${API}/orders/${id}/cancel`, {}, { withCredentials: true });
      setOrder(data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(''); }
  };

  const updateStatus = async (status) => {
    setSaving('status');
    try {
      const { data } = await axios.put(`${API}/orders/${id}/status`, { status }, { withCredentials: true });
      setOrder(data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(''); }
  };

  const fmt = (v) => `Rs ${Number(v || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  const paymentStatus = () => {
    if (order.isCancelled) return badge('Cancelled', 'bg-red-100 text-red-600');
    if (order.isPaid) return badge('Paid', 'bg-green-100 text-green-700');
    return badge('Pending', 'bg-amber-100 text-amber-700');
  };

  const fulfillmentStatus = () => {
    if (order.isCancelled) return badge('Cancelled', 'bg-red-100 text-red-600');
    if (order.isDelivered) return badge('Delivered', 'bg-green-100 text-green-700');
    return badge('Unfulfilled', 'bg-gray-100 text-gray-600');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-semibold">Order not found</p>
        <Link to="/admin/orderlist" className="mt-4 inline-flex items-center gap-1 text-green-600 text-sm font-semibold hover:underline">
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>
    );
  }

  const itemsSubtotal = order.orderItems.reduce((s, item) => s + item.price * item.qty, 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Link to="/admin" className="hover:text-green-600 transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <Link to="/admin/orderlist" className="hover:text-green-600 transition-colors">Orders</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 font-semibold">#{order._id.slice(-6).toUpperCase()}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Order #{order._id.slice(-6).toUpperCase()}
          </h1>
          {order.user && (
            <p className="text-sm text-gray-400 mt-0.5">
              Customer ID: <span className="text-blue-600 font-medium">{order.user._id?.toString().slice(-7) || order.user}</span>
            </p>
          )}
          {order.guestEmail && (
            <p className="text-sm text-gray-400 mt-0.5">Guest: <span className="text-gray-600">{order.guestEmail}</span></p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 px-3 py-2 rounded-xl font-semibold transition-colors"
          >
            <Printer size={14} /> Print
          </button>
          {!order.isPaid && !order.isCancelled && (
            <button
              onClick={markPaid}
              disabled={saving === 'paid'}
              className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60"
            >
              <CheckCircle size={14} /> {saving === 'paid' ? 'Saving…' : 'Mark as Paid'}
            </button>
          )}
          {order.isPaid && !order.isDelivered && !order.isCancelled && (
            <button
              onClick={markDelivered}
              disabled={saving === 'delivered'}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60"
            >
              <Truck size={14} /> {saving === 'delivered' ? 'Saving…' : 'Mark Delivered'}
            </button>
          )}
          {!order.isCancelled && !order.isPaid && (
            <button
              onClick={cancelOrder}
              disabled={saving === 'cancel'}
              className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60"
            >
              <XCircle size={14} /> {saving === 'cancel' ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Order Tracking Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={16} className="text-green-500" /> Order Progress
            </h2>
            <OrderTimeline orderStatus={order.orderStatus} isCancelled={!!order.isCancelled} />
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={16} className="text-green-500" /> Products
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide" colSpan={2}>Product</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Qty</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.orderItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-4 w-16">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <ImageOff size={16} className="text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          to={`/product/${item.product}`}
                          className="font-semibold text-gray-800 hover:text-green-600 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.product?.toString().slice(-8)}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-700">{fmt(item.price)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-bold ${item.qty > 3 ? 'text-orange-500' : 'text-gray-900'}`}>{item.qty}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">{fmt(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Items Subtotal</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{fmt(itemsSubtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Info cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Billing details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={15} className="text-gray-400" /> Billing Details
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                {order.user?.name && (
                  <div className="flex items-start gap-3">
                    <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Customer</p>
                      <p className="text-gray-700 font-medium">{order.user.name}</p>
                    </div>
                  </div>
                )}
                {(order.user?.email || order.guestEmail) && (
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Email</p>
                      <a href={`mailto:${order.user?.email || order.guestEmail}`} className="text-blue-600 hover:underline break-all">
                        {order.user?.email || order.guestEmail}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CreditCard size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Payment Method</p>
                    <p className="text-gray-700 font-medium">{order.paymentMethod}</p>
                  </div>
                </div>
                {order.paymentIntentId && (
                  <div className="flex items-start gap-3">
                    <CreditCard size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Transaction ID</p>
                      <p className="text-gray-500 font-mono text-xs break-all">{order.paymentIntentId}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Order Date</p>
                    <p className="text-gray-700">{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck size={15} className="text-gray-400" /> Shipping Details
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Address</p>
                    <p className="text-gray-700">
                      {order.shippingAddress.address}, {order.shippingAddress.city}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </p>
                  </div>
                </div>
                {order.isPaid && (
                  <div className="flex items-start gap-3">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Paid At</p>
                      <p className="text-gray-700">{fmtDate(order.paidAt)} · {fmtTime(order.paidAt)}</p>
                    </div>
                  </div>
                )}
                {order.isDelivered && (
                  <div className="flex items-start gap-3">
                    <Package size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Delivered At</p>
                      <p className="text-gray-700">{fmtDate(order.deliveredAt)} · {fmtTime(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
                {order.isCancelled && (
                  <div className="flex items-start gap-3">
                    <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Cancelled At</p>
                      <p className="text-gray-700">{fmtDate(order.cancelledAt)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Truck size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Shipping Cost</p>
                    <p className="text-gray-700">{fmt(order.shippingPrice)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="xl:w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Summary</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items subtotal</span>
                <span className="font-medium text-gray-800">{fmt(order.itemsPrice)}</span>
              </div>
              {order.shippingPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Cost</span>
                  <span className="font-medium text-gray-800">{fmt(order.shippingPrice)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-green-600 text-lg">{fmt(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Status</h2>

            {/* Status Progress Buttons */}
            {!order.isCancelled && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Advance Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_STEPS.map(step => {
                    const StepIcon   = step.icon;
                    const isCurrent  = (order.orderStatus || 'pending') === step.key;
                    const currentIdx = STATUS_ORDER.indexOf(order.orderStatus || 'pending');
                    const stepIdx    = STATUS_ORDER.indexOf(step.key);
                    const isPast     = stepIdx < currentIdx;
                    return (
                      <button
                        key={step.key}
                        onClick={() => !isCurrent && !isPast && updateStatus(step.key)}
                        disabled={isCurrent || isPast || saving === 'status'}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isCurrent
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : isPast
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-default'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer'
                        }`}
                      >
                        <StepIcon size={12} />
                        {step.label}
                        {isCurrent && <CheckCircle size={10} className="ml-auto text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {order.isCancelled ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <XCircle size={18} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-600">Cancelled</p>
                  <p className="text-xs text-red-400 mt-0.5">{fmtDate(order.cancelledAt)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Payment status */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment Status</p>
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${order.isPaid ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                    {order.isPaid
                      ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      : <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${order.isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                        {order.isPaid ? 'Paid' : 'Pending'}
                      </p>
                      {order.isPaid && order.paidAt && (
                        <p className="text-xs text-green-500 mt-0.5">{fmtDate(order.paidAt)}</p>
                      )}
                    </div>
                    {!order.isPaid && (
                      <button
                        onClick={markPaid}
                        disabled={saving === 'paid'}
                        className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </div>

                {/* Fulfillment status */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fulfillment Status</p>
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${order.isDelivered ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                    {order.isDelivered
                      ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      : <Package size={18} className="text-gray-400 flex-shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${order.isDelivered ? 'text-green-700' : 'text-gray-600'}`}>
                        {order.isDelivered ? 'Delivered' : 'Unfulfilled'}
                      </p>
                      {order.isDelivered && order.deliveredAt && (
                        <p className="text-xs text-green-500 mt-0.5">{fmtDate(order.deliveredAt)}</p>
                      )}
                    </div>
                    {!order.isDelivered && order.isPaid && (
                      <button
                        onClick={markDelivered}
                        disabled={saving === 'delivered'}
                        className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                </div>

                {/* Cancel button */}
                {!order.isPaid && (
                  <button
                    onClick={cancelOrder}
                    disabled={saving === 'cancel'}
                    className="w-full text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {saving === 'cancel' ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Info</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                {paymentStatus()}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fulfillment</span>
                {fulfillmentStatus()}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-semibold text-gray-700">
                  {order.orderItems.reduce((s, i) => s + i.qty, 0)} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-700 text-xs">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderView;
