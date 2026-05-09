import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/api';
import {
  CheckCircle, XCircle, ArrowLeft, Building,
  Copy, Check, Banknote, Smartphone, Wallet, Clock,
  MessageCircle, X, Truck, MapPin, ShoppingBag, Send, Loader2,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
const BANK_METHODS = ['JazzCash', 'Easypaisa', 'NayaPay', 'SadaPay', 'Bank Transfer'];

/* ── ORDER STATUS TRACKING ── */
const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: ShoppingBag, desc: 'We received your order' },
  { key: 'processing', label: 'Processing',    icon: Clock,       desc: 'Preparing your items' },
  { key: 'shipped',    label: 'Shipped',       icon: Truck,       desc: 'On the way to you' },
  { key: 'delivered',  label: 'Delivered',     icon: CheckCircle, desc: 'Order completed' },
];
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const TrackingTimeline = ({ orderStatus, isCancelled }) => {
  const activeIdx = isCancelled ? -1 : STATUS_ORDER.indexOf(orderStatus || 'pending');

  if (isCancelled) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <XCircle size={22} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-600">Order Cancelled</p>
            <p className="text-xs text-red-400">This order has been cancelled and stock has been restored</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const done    = idx <= activeIdx;
        const current = idx === activeIdx;
        const last    = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                done
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-200 text-gray-300'
              } ${current ? 'ring-4 ring-green-100' : ''}`}>
                <StepIcon size={16} />
              </div>
              {!last && (
                <div className={`w-0.5 flex-1 my-1 ${done && idx < activeIdx ? 'bg-green-400' : 'bg-gray-200'}`}
                  style={{ minHeight: '32px' }} />
              )}
            </div>
            {/* Content */}
            <div className="pb-6 flex-1 min-w-0">
              <p className={`font-semibold text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              <p className={`text-xs mt-0.5 ${done ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
              {current && (
                <span className="inline-block mt-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── MESSAGE SUPPORT DRAWER ── */
const MessageDrawer = ({ onClose, user }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [sending, setSending]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const containerRef  = useRef(null);
  const convIdRef     = useRef(null);
  const sendingRef    = useRef(false);
  const pollRef       = useRef(null);

  const API = '/api';

  const scrollBottom = () => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  const fetchMsgs = useCallback(async (convId) => {
    try {
      const { data } = await axios.get(`${API}/messages/conversations/${convId}`, { withCredentials: true });
      if (Array.isArray(data)) { setMessages(data); scrollBottom(); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: conv } = await axios.post(`${API}/messages/conversations`, {}, { withCredentials: true });
        setConversation(conv);
        convIdRef.current = conv._id;
        await fetchMsgs(conv._id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [fetchMsgs]);

  useEffect(() => {
    if (!convIdRef.current) return;
    pollRef.current = setInterval(() => {
      if (!sendingRef.current) fetchMsgs(convIdRef.current);
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [conversation, fetchMsgs]);

  useEffect(() => { scrollBottom(); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    sendingRef.current = true;
    const optimistic = { _id: `opt-${Date.now()}`, sender: { _id: user._id }, text: msgText, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const { data } = await axios.post(`${API}/messages/conversations/${convIdRef.current}`, { text: msgText }, { withCredentials: true });
      setMessages(prev => {
        const replaced = prev.map(m => m._id === optimistic._id ? data : m);
        return replaced.some(m => m._id === data._id) ? replaced : [...prev, data];
      });
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setText(msgText);
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-80 flex flex-col bg-white shadow-2xl border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">S</div>
            <div>
              <p className="font-bold text-sm leading-none">Support Team</p>
              <p className="text-xs text-blue-100 mt-0.5">We'll respond shortly</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100 transition-colors"><X size={18} /></button>
        </div>

        {/* Messages */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-2">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-10">
              <MessageCircle size={32} className="text-gray-200" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Describe your issue and we'll help!</p>
            </div>
          ) : messages.map(msg => {
            const isMe = msg.sender?._id === user._id || msg.sender?._id?.toString() === user._id?.toString();
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                  {msg.isDeleted ? <em className="opacity-60 text-xs">Message deleted</em> : msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-3 flex gap-2 bg-white">
          <input
            type="text" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Type your message…"
            disabled={sending}
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-400 transition-colors"
          />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors flex items-center justify-center">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};


/* ── BANK TRANSFER PANEL ── */
const BankTransferPanel = ({ paymentMethod, bankAccounts, isAdmin, onMarkPaid }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const matching = bankAccounts.filter(acc => acc.bankName?.toLowerCase().includes(paymentMethod.toLowerCase()));
  const display  = matching.length > 0 ? matching : bankAccounts;
  const Icon     = paymentMethod === 'Bank Transfer' ? Building : ['JazzCash', 'Easypaisa'].includes(paymentMethod) ? Smartphone : Wallet;

  return (
    <div className="flex flex-col gap-4">
      {display.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          No payment accounts configured. Contact the store for {paymentMethod} details.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Icon size={16} className="text-blue-600" />
            Send the exact amount to the account below, then share your transaction reference with us.
          </p>
          <div className="flex flex-col gap-3">
            {display.map((acc, i) => (
              <div key={i} className="bg-white border border-blue-100 rounded-xl p-4">
                <p className="font-bold text-gray-900 flex items-center gap-2">
                  {acc.bankName}
                  {acc.isDefault && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{acc.accountTitle}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-mono text-sm font-semibold text-gray-800">{acc.accountNumber}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(acc.accountNumber); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                    {copiedIdx === i ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
                {acc.iban && <p className="font-mono text-xs text-gray-400 mt-1">IBAN: {acc.iban}</p>}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <Clock size={16} className="flex-shrink-0" />
        Your order is confirmed. Once we receive your payment, it will be marked as paid.
      </div>
      {isAdmin && (
        <button onClick={onMarkPaid}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
          <CheckCircle size={18} /> Mark as Paid (Admin)
        </button>
      )}
    </div>
  );
};

/* ── MAIN ORDER PAGE ── */
const Order = () => {
  const { id: orderId }  = useParams();
  const { user }         = useContext(AuthContext);
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showChat, setShowChat]         = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, banksRes] = await Promise.all([
          axios.get(`/api/orders/${orderId}`, { withCredentials: true }),
          axios.get('/api/users/merchant/banks', { withCredentials: true }).catch(() => ({ data: [] })),
        ]);
        setOrder(orderRes.data);
        setBankAccounts(Array.isArray(banksRes.data) ? banksRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const deliverHandler = async () => {
    try {
      await axios.put(`/api/orders/${orderId}/deliver`, {}, { withCredentials: true });
      window.location.reload();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const cancelHandler = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await axios.put(`/api/orders/${orderId}/cancel`, {}, { withCredentials: true });
      window.location.reload();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const markPaidHandler = async () => {
    if (!window.confirm('Mark this order as paid?')) return;
    try {
      await axios.put(`/api/orders/${orderId}/pay`, {}, { withCredentials: true });
      window.location.reload();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  if (loading) return <div className="text-center py-20 text-green-600 font-bold text-xl">Loading Order…</div>;
  if (!order)  return <div className="text-center py-20 text-red-600 font-bold text-xl">Order Not Found</div>;

  const isAdmin      = user?.role === 'admin';
  const isBankMethod = BANK_METHODS.includes(order.paymentMethod);
  const isCash       = order.paymentMethod === 'Cash';
  const isWallet     = order.paymentMethod === 'Wallet';
  const backTo     = isAdmin ? '/admin/orderlist' : '/profile?tab=orders';
  const backLabel  = isAdmin ? 'Order Management' : 'My Orders';

  const statusColor = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped:    'bg-purple-100 text-purple-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-600',
  };

  return (
    <>
      {showChat && <MessageDrawer onClose={() => setShowChat(false)} user={user} />}

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors">
            <ArrowLeft size={15} /> {backLabel}
          </Link>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <MessageCircle size={14} /> Message Support
          </button>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order._id.substring(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {order.orderStatus && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
              order.isCancelled ? statusColor.cancelled : (statusColor[order.orderStatus] || statusColor.pending)
            }`}>
              {order.isCancelled ? 'Cancelled' : order.orderStatus}
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: main content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Tracking Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Truck size={17} className="text-green-600" /> Order Tracking
              </h2>
              <TrackingTimeline orderStatus={order.orderStatus} isCancelled={!!order.isCancelled} />
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-4 pb-3 border-b">Items Ordered</h2>
              <div className="flex flex-col gap-3">
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.qty}× {item.name}</span>
                    <span className="font-semibold text-gray-900">Rs {(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>Rs {order.itemsPrice?.toFixed(0)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>Rs {order.shippingPrice?.toFixed(0)}</span></div>
                <div className="flex justify-between text-lg font-bold text-green-600 pt-1 border-t mt-1">
                  <span>Total</span><span>Rs {order.totalPrice.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-gray-400" /> Shipping Address
              </h2>
              <p className="text-sm text-gray-700">
                {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
              </p>
              {order.isDelivered ? (
                <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-xl flex items-center gap-2 text-sm font-bold">
                  <CheckCircle size={16} /> Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400">Not yet delivered</p>
              )}
            </div>
          </div>

          {/* ── RIGHT: payment + actions ── */}
          <div className="lg:w-80 flex-shrink-0 w-full flex flex-col gap-4">

            {/* Payment section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-2">Payment</h2>
              <p className="text-sm text-gray-500 mb-4">Method: <span className="font-semibold text-gray-800">{order.paymentMethod}</span></p>

              {order.isPaid ? (
                <div className="p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-2 font-bold text-sm">
                  <CheckCircle size={18} /> Paid on {new Date(order.paidAt).toLocaleDateString()}
                </div>
              ) : order.isCancelled ? null : (
                <>
                  {isCash && (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <Banknote size={20} className="text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-yellow-800 text-sm">Pay at Delivery</p>
                        <p className="text-xs text-yellow-700">Have Rs {order.totalPrice.toFixed(0)} ready when your order arrives.</p>
                      </div>
                    </div>
                  )}
                  {isWallet && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <Wallet size={20} className="text-purple-600 flex-shrink-0" />
                      <p className="text-sm text-purple-800 font-semibold">Wallet payment — awaiting confirmation.</p>
                    </div>
                  )}
                  {isBankMethod && (
                    <BankTransferPanel
                      paymentMethod={order.paymentMethod}
                      bankAccounts={bankAccounts}
                      isAdmin={isAdmin}
                      onMarkPaid={markPaidHandler}
                    />
                  )}
                </>
              )}

              {/* Cancel button — only when status is still pending and not already cancelled */}
              {!order.isCancelled && order.refundStatus !== 'pending' && (order.orderStatus === 'pending' || !order.orderStatus) && (
                <button onClick={cancelHandler}
                  className="mt-4 w-full border border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors text-sm">
                  <XCircle size={16} /> Cancel Order
                </button>
              )}

              {/* Cannot cancel notice */}
              {!order.isCancelled && !isAdmin && ['processing', 'shipped', 'delivered'].includes(order.orderStatus) && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                  This order is in <span className="font-semibold capitalize">{order.orderStatus}</span> status and can no longer be cancelled. Contact support for assistance.
                </div>
              )}

              {/* Refund pending notice (card-paid orders awaiting admin refund approval) */}
              {order.refundStatus === 'pending' && !order.isCancelled && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                  <p className="font-bold flex items-center gap-2"><XCircle size={16} /> Refund pending</p>
                  <p className="text-xs mt-1">A refund of Rs {Number(order.refundAmount || order.totalPrice).toLocaleString()} is awaiting admin approval. Once approved, the amount will be credited to your wallet.</p>
                </div>
              )}

              {order.refundStatus === 'rejected' && !order.isCancelled && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  <p className="font-bold flex items-center gap-2"><XCircle size={16} /> Refund rejected</p>
                  <p className="text-xs mt-1">Your refund request was rejected. Please contact support for more details.</p>
                </div>
              )}

              {order.isCancelled && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-bold text-sm">
                  <XCircle size={18} /> Cancelled on {new Date(order.cancelledAt).toLocaleDateString()}
                  {order.refundStatus === 'approved' && <span className="text-xs font-normal">· Refunded to wallet</span>}
                </div>
              )}
            </div>

            {/* Admin actions */}
            {isAdmin && order.isPaid && !order.isDelivered && !order.isCancelled && (
              <button onClick={deliverHandler}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors text-sm">
                Mark as Delivered
              </button>
            )}

            {/* Message Support card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <MessageCircle size={15} className="text-blue-600" /> Need Help?
              </h3>
              <p className="text-xs text-gray-500 mb-3">Chat with our support team about this order</p>
              <button onClick={() => setShowChat(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={14} /> Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Order;
