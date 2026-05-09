import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import {
  CreditCard, Smartphone, Wallet, Banknote, Building,
  ArrowLeft, Copy, Check, User, MapPin, Phone as PhoneIcon,
  CheckCircle, Tag, ShoppingCart, Edit2, ImageOff, Truck,
  Mail,
} from 'lucide-react';
import axios from '../utils/api';

const BANK_METHODS = ['JazzCash', 'Easypaisa', 'NayaPay', 'SadaPay', 'Bank Transfer'];

const PAYMENT_METHODS = [
  { id: 'Credit Card',   label: 'Credit Card',      icon: CreditCard,  desc: 'Visa / Mastercard / Amex' },
  { id: 'JazzCash',      label: 'JazzCash',          icon: Smartphone,  desc: 'Mobile wallet' },
  { id: 'Easypaisa',     label: 'Easypaisa',         icon: Smartphone,  desc: 'Mobile wallet' },
  { id: 'NayaPay',       label: 'NayaPay',           icon: Wallet,      desc: 'Digital wallet' },
  { id: 'SadaPay',       label: 'SadaPay',           icon: Wallet,      desc: 'Digital wallet' },
  { id: 'Bank Transfer', label: 'Bank Transfer',     icon: Building,    desc: 'IBFT / RTGS' },
  { id: 'Cash',          label: 'Cash on Delivery',  icon: Banknote,    desc: 'Pay at delivery' },
  { id: 'Wallet',        label: 'Wallet Balance',    icon: Wallet,      desc: 'Use EC-POS wallet' },
];

// Early-delivery upsell options (shown alongside the default)
const EARLY_OPTIONS = [
  { id: 'express',   label: 'Two Day Shipping',   price: 500, est: 'Est. 2 business days',   note: 'Get your order in 2 business days.',     tag: null },
  { id: 'overnight', label: 'One Day Shipping',   price: 800, est: 'Next business day',      note: 'Highest priority shipping.',              tag: 'POPULAR' },
];

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 text-sm">
    <span className="flex-shrink-0 mt-0.5 text-gray-400">{icon}</span>
    <span className="text-gray-500 w-16 flex-shrink-0">{label}</span>
    <span className="text-gray-400 flex-shrink-0">:</span>
    <span className="text-gray-700 font-medium">{value}</span>
  </div>
);

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Shipping form fields
  const [shipName, setShipName]         = useState(user?.name || '');
  const [address, setAddress]           = useState('');
  const [city, setCity]                 = useState('');
  const [postalCode, setPostalCode]     = useState('');
  const [phone, setPhone]               = useState('');
  const [editingShipping, setEditingShipping] = useState(true);

  // Billing
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Delivery type — default option is dynamic (free OR admin-set product charge)
  const [shippingOption, setShippingOption] = useState('default');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [bankAccounts, setBankAccounts]   = useState([]);
  const [copiedIdx, setCopiedIdx]         = useState(null);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]     = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV]       = useState('');

  // Dynamic shipping from product data
  const [productShipping, setProductShipping] = useState({ charge: 0, threshold: null });

  // Guest
  const [guestEmail, setGuestEmail] = useState('');

  // Voucher
  const [voucherCode, setVoucherCode]     = useState('');
  const [voucherData, setVoucherData]     = useState(null);
  const [voucherError, setVoucherError]   = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Fetch product shipping settings to compute dynamic shipping
  useEffect(() => {
    if (cartItems.length === 0) return;
    const ids = [...new Set(cartItems.map(i => i.id))];
    Promise.all(ids.map(id => axios.get(`/api/products/${id}`).catch(() => null)))
      .then(results => {
        const prods = results.filter(r => r?.data).map(r => r.data);
        if (prods.length === 0) return;
        const maxCharge = Math.max(0, ...prods.map(p => p.deliveryCharge || 0));
        const validThresholds = prods.filter(p => p.freeDeliveryThreshold > 0).map(p => p.freeDeliveryThreshold);
        const minThreshold = validThresholds.length > 0 ? Math.min(...validThresholds) : null;
        setProductShipping({ charge: maxCharge, threshold: minThreshold });
      })
      .catch(() => {});
  }, [cartItems]);

  useEffect(() => {
    axios.get('/api/users/merchant/banks', { withCredentials: true })
      .then(({ data }) => setBankAccounts(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Auto-fill from saved address if user is logged in
    if (user) {
      axios.get('/api/users/address', { withCredentials: true })
        .then(({ data }) => {
          if (data?.addressLine1) {
            setShipName(data.fullName || user.name || '');
            setAddress((data.addressLine1 + (data.addressLine2 ? ', ' + data.addressLine2 : '')).trim());
            setCity(data.city || '');
            setPostalCode(data.postalCode || '');
            setPhone(data.phone || '');
            setEditingShipping(false);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Default shipping: free unless an admin set a deliveryCharge on the product;
  // qualifying free-shipping threshold also waives the charge.
  const qualifiesForFree = productShipping.threshold !== null && cartTotal >= productShipping.threshold;
  const defaultShippingPrice = qualifiesForFree ? 0 : (productShipping.charge || 0);
  const defaultShippingLabel = defaultShippingPrice === 0 ? 'Free Shipping' : 'Standard Delivery';
  const defaultShippingNote  = defaultShippingPrice === 0
    ? 'No charge — standard handling time.'
    : 'Shipping rate set by the store for this order.';
  const SHIPPING_OPTIONS = [
    { id: 'default', label: defaultShippingLabel, price: defaultShippingPrice, est: 'Est. 5–7 business days', note: defaultShippingNote, tag: defaultShippingPrice === 0 ? 'FREE' : null },
    ...EARLY_OPTIONS,
  ];
  const shippingPrice = SHIPPING_OPTIONS.find(o => o.id === shippingOption)?.price ?? defaultShippingPrice;

  const voucherDiscount = voucherData ? parseFloat(voucherData.discount) : 0;
  const subtotal        = Math.max(0, cartTotal - voucherDiscount);
  const finalTotal      = Math.max(0, subtotal + shippingPrice);

  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setVoucherData(null);
    try {
      const { data } = await axios.post(
        '/api/vouchers/validate',
        { code: voucherCode.trim(), orderTotal: cartTotal },
        { withCredentials: true }
      );
      setVoucherData(data);
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Invalid voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => { setVoucherData(null); setVoucherCode(''); setVoucherError(''); };

  const confirmShipping = () => {
    if (!shipName.trim() || !address.trim() || !city.trim()) {
      alert('Please fill in Name, Address and City');
      return;
    }
    setEditingShipping(false);
  };

  const placeOrderHandler = async (e) => {
    e.preventDefault();
    if (!user && !guestEmail.trim()) {
      alert('Please enter your email to continue as guest.');
      return;
    }
    if (!address.trim() || !city.trim()) {
      alert('Please fill in shipping address.');
      setEditingShipping(true);
      return;
    }
    try {
      const orderData = {
        orderItems: cartItems,
        shippingAddress: {
          address: address + (phone ? ` | Ph: ${phone}` : ''),
          city,
          postalCode: postalCode || '00000',
          country: 'Pakistan',
        },
        paymentMethod,
        itemsPrice: cartTotal,
        shippingPrice,
        totalPrice: finalTotal,
        voucherCode: voucherData?.code || null,
        discount: voucherDiscount,
        ...(!user && { guestEmail: guestEmail.trim() }),
      };

      const { data } = await axios.post('/api/orders', orderData, { withCredentials: true });

      if (voucherData?.code) {
        await axios.post('/api/vouchers/apply', { code: voucherData.code }, { withCredentials: true }).catch(() => {});
      }

      clearCart();
      navigate(`/order/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong during checkout');
    }
  };

  const fmt = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-8 px-4">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Cart
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Check out</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ════════════════════════════════
            LEFT — FORM
        ════════════════════════════════ */}
        <form onSubmit={placeOrderHandler} className="flex-1 min-w-0 flex flex-col gap-7">

          {/* Guest email */}
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-blue-900 mb-2">Checking out as guest</p>
              <input
                type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
              />
              <p className="text-xs text-blue-600 mt-2">
                <Link to="/login" className="font-semibold hover:underline">Sign in</Link> for faster checkout and order tracking.
              </p>
            </div>
          )}

          {/* ── SHIPPING DETAILS ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Shipping Details</h2>
              {!editingShipping && (
                <button type="button" onClick={() => setEditingShipping(true)}
                  className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            {!editingShipping ? (
              /* ── read-only view ── */
              <div className="px-6 py-5 flex flex-col gap-3">
                <InfoRow icon={<User size={15} />} label="Name" value={shipName} />
                <InfoRow icon={<MapPin size={15} />} label="Address"
                  value={`${address}, ${city}${postalCode ? ', ' + postalCode : ''}, Pakistan`} />
                {phone && <InfoRow icon={<PhoneIcon size={15} />} label="Phone" value={phone} />}
              </div>
            ) : (
              /* ── editable form ── */
              <div className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name *</label>
                  <input value={shipName} onChange={e => setShipName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Street Address *</label>
                  <input value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="House no., Street, Area"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">City *</label>
                    <input value={city} onChange={e => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Postal Code</label>
                    <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                      placeholder="e.g. 54000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                </div>
                <button type="button" onClick={confirmShipping}
                  className="self-end px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors">
                  Confirm Address
                </button>
              </div>
            )}
          </div>

          {/* ── BILLING DETAILS ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Billing Details</h2>
            </div>
            <div className="px-6 py-5">
              <label className="flex items-center gap-2.5 cursor-pointer mb-4">
                <input type="checkbox" checked={sameAsBilling} onChange={e => setSameAsBilling(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Same as shipping address</span>
              </label>
              {sameAsBilling ? (
                <div className="flex flex-col gap-3">
                  {(shipName || address) ? (
                    <>
                      {shipName && <InfoRow icon={<User size={15} />} label="Name" value={shipName} />}
                      {address && <InfoRow icon={<MapPin size={15} />} label="Address" value={`${address}${city ? ', ' + city : ''}`} />}
                      {phone && <InfoRow icon={<PhoneIcon size={15} />} label="Phone" value={phone} />}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Fill in shipping details above</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input placeholder="Billing Name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                  <input placeholder="Billing Address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                  <input placeholder="Billing Phone"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm" />
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* ── DELIVERY TYPE ── */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delivery Type</h2>
            {productShipping.threshold !== null && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-1.5">
                <Truck size={13} className="text-green-600 flex-shrink-0" />
                {cartTotal >= productShipping.threshold
                  ? `Your order qualifies for Free Shipping!`
                  : `Free Shipping on orders over Rs ${productShipping.threshold.toLocaleString()}`}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-3">
              {defaultShippingPrice === 0
                ? 'Standard delivery is free. Choose a faster option below if you need early delivery.'
                : 'The store has set a shipping fee for items in your cart. Choose a faster option below for early delivery.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHIPPING_OPTIONS.map(opt => {
                const isSelected = shippingOption === opt.id;
                return (
                  <label key={opt.id}
                    className={`relative flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="shipping" value={opt.id} checked={isSelected}
                      onChange={() => setShippingOption(opt.id)}
                      className="mt-1 accent-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{opt.label}</span>
                        <span className={`font-bold text-sm ${opt.price === 0 ? 'text-green-600' : isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {opt.price === 0 ? '$0.00' : fmt(opt.price)}
                        </span>
                        {opt.tag && (
                          <span className="text-[10px] font-extrabold bg-orange-100 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded tracking-wide">
                            {opt.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.est}</p>
                      <p className="text-xs text-blue-500 mt-0.5 font-medium">{opt.note}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* ── PAYMENT METHOD ── */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map(pm => {
                const PMIcon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <label key={pm.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="payment" value={pm.id} checked={isSelected}
                      onChange={() => setPaymentMethod(pm.id)} className="accent-blue-500 flex-shrink-0" />
                    <PMIcon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>{pm.label}</p>
                      <p className="text-xs text-gray-400">{pm.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Credit Card extra fields */}
            {paymentMethod === 'Credit Card' && (
              <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Accepted Cards:</span>
                  {['VISA', 'MC', 'AMEX', 'DISC'].map(c => (
                    <span key={c} className="text-[10px] font-extrabold border border-gray-300 text-gray-500 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Card Number</label>
                    <input
                      value={cardNumber}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      inputMode="numeric"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-sm font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                    <input
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Expiry (MM/YY)</label>
                    <input
                      value={cardExpiry}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      inputMode="numeric"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">CVV</label>
                    <input
                      value={cardCVV}
                      onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      inputMode="numeric"
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500" />
                  Your payment is processed securely via Stripe after placing the order.
                </p>
              </div>
            )}

            {/* Bank / Mobile Transfer Details */}
            {BANK_METHODS.includes(paymentMethod) && (() => {
              const matching = bankAccounts.filter(acc => acc.bankName?.toLowerCase().includes(paymentMethod.toLowerCase()));
              const display  = matching.length > 0 ? matching : bankAccounts;
              const Icon     = paymentMethod === 'Bank Transfer' ? Building : Smartphone;
              return (
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-800">
                    <Icon size={15} className="text-blue-600" /> {paymentMethod} Details
                  </h3>
                  {display.length === 0 ? (
                    <p className="text-sm text-gray-500">Contact the store for {paymentMethod} details.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {display.map((acc, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-blue-100">
                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            {acc.bankName}
                            {acc.isDefault && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">{acc.accountTitle}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-mono text-sm text-gray-700">{acc.accountNumber}</p>
                            <button type="button"
                              onClick={() => { navigator.clipboard.writeText(acc.accountNumber); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                              {copiedIdx === i ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                            </button>
                          </div>
                          {acc.iban && <p className="font-mono text-xs text-gray-500 mt-1">IBAN: {acc.iban}</p>}
                        </div>
                      ))}
                      <p className="text-xs text-blue-600">Share the transaction reference with us to confirm your order.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Cash on Delivery */}
            {paymentMethod === 'Cash' && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <Banknote size={15} className="text-amber-600" /> Cash on Delivery
                </p>
                <p className="text-xs text-amber-700 mt-1">Pay in cash when your order arrives. No upfront payment needed.</p>
              </div>
            )}

            {/* Wallet */}
            {paymentMethod === 'Wallet' && (
              <div className="mt-4 bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <p className="text-sm font-bold text-purple-800 flex items-center gap-2">
                  <Wallet size={15} className="text-purple-600" /> Wallet Balance
                </p>
                <p className="text-xs text-purple-700 mt-1">Your wallet balance will be deducted at order confirmation.</p>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* ── VOUCHER ── */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={17} className="text-gray-500" /> Voucher / Coupon
            </h2>
            {voucherData ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-green-800">{voucherData.code}</p>
                  <p className="text-sm text-green-600">{voucherData.description || 'Discount applied'} — saved {fmt(voucherData.discount)}</p>
                </div>
                <button type="button" onClick={removeVoucher} className="text-red-500 text-sm font-semibold hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text" value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), validateVoucher())}
                  placeholder="Enter voucher code"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 text-sm uppercase tracking-widest"
                />
                <button type="button" onClick={validateVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors">
                  {voucherLoading ? '…' : 'Apply'}
                </button>
              </div>
            )}
            {voucherError && <p className="text-red-500 text-sm mt-2">{voucherError}</p>}
          </div>

          {/* ── PLACE ORDER ── */}
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-base flex justify-center items-center gap-2 transition-colors shadow-md">
            <CheckCircle size={18} /> Place Order — {fmt(finalTotal)}
          </button>
        </form>

        {/* ════════════════════════════════
            RIGHT — SUMMARY SIDEBAR
        ════════════════════════════════ */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 w-full">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Summary</h2>
              <Link to="/cart" className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <ShoppingCart size={13} /> Edit cart
              </Link>
            </div>

            {/* Product list */}
            <div className="px-6 py-4 flex flex-col gap-4 max-h-64 overflow-y-auto border-b border-gray-100">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Your cart is empty</p>
              ) : cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={14} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">×{item.qty}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items subtotal:</span>
                <span className="font-medium text-gray-800">{fmt(cartTotal)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount <span className="text-[10px] text-green-600">({voucherData?.code})</span>:</span>
                  <span className="font-semibold text-red-500">−{fmt(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping Cost:</span>
                <span className="font-medium text-gray-800">
                  {shippingPrice === 0
                    ? <span className="text-green-600 font-semibold">Free</span>
                    : fmt(shippingPrice)
                  }
                </span>
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-base">Total :</span>
                <span className="font-extrabold text-gray-900 text-xl">{fmt(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
