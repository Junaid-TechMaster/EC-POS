import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Wallet, Banknote, ShieldCheck, Lock } from 'lucide-react';

const METHODS = [
  {
    icon: <Smartphone size={28} className="text-red-500" />,
    bg: 'bg-red-50',
    name: 'JazzCash',
    desc: 'Pay instantly using your JazzCash mobile account. Fast, secure and available 24/7.',
    badge: 'Mobile Wallet',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    icon: <Smartphone size={28} className="text-green-600" />,
    bg: 'bg-green-50',
    name: 'Easypaisa',
    desc: 'Use your Easypaisa account or Easypaisa OTC at any nearby retailer.',
    badge: 'Mobile Wallet',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: <Smartphone size={28} className="text-purple-600" />,
    bg: 'bg-purple-50',
    name: 'NayaPay',
    desc: 'Send payment directly via your NayaPay digital wallet.',
    badge: 'Digital Wallet',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    icon: <Smartphone size={28} className="text-teal-600" />,
    bg: 'bg-teal-50',
    name: 'SadaPay',
    desc: 'Pay using your SadaPay account — zero-fee digital payments.',
    badge: 'Digital Wallet',
    badgeColor: 'bg-teal-100 text-teal-700',
  },
  {
    icon: <CreditCard size={28} className="text-blue-600" />,
    bg: 'bg-blue-50',
    name: 'Debit / Credit Card',
    desc: 'All major Visa, Mastercard and local debit cards accepted. Secured by Stripe.',
    badge: 'Card Payment',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: <Banknote size={28} className="text-amber-600" />,
    bg: 'bg-amber-50',
    name: 'Bank Transfer',
    desc: 'Direct bank transfer to our merchant accounts. Share your TID after payment.',
    badge: 'Bank Transfer',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: <Wallet size={28} className="text-indigo-600" />,
    bg: 'bg-indigo-50',
    name: 'Wallet Balance',
    desc: 'Use your EC-POS wallet balance for instant checkout with no extra steps.',
    badge: 'In-App Wallet',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
];

const TRUST = [
  { icon: <Lock size={20} className="text-green-600" />, title: 'SSL Encrypted', desc: 'All transactions are secured with 256-bit SSL encryption.' },
  { icon: <ShieldCheck size={20} className="text-blue-600" />, title: 'Stripe Secured', desc: 'Card payments are processed by Stripe — PCI-DSS Level 1 compliant.' },
  { icon: <ShieldCheck size={20} className="text-purple-600" />, title: 'Privacy First', desc: 'We never store your card or wallet credentials on our servers.' },
];

const PaymentInfo = () => (
  <div className="max-w-3xl mx-auto pb-16 pt-4">
    {/* Back */}
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6">
      <ArrowLeft size={15} /> Back to Home
    </Link>

    {/* Header */}
    <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="relative z-10">
        <ShieldCheck size={36} className="mb-3 opacity-90" />
        <h1 className="text-2xl font-extrabold">Secure Payment Methods</h1>
        <p className="text-sm opacity-80 mt-1 max-w-md">
          We support multiple payment options so you can choose what's most convenient. All payments are fully encrypted and secure.
        </p>
      </div>
    </div>

    {/* Payment Methods */}
    <h2 className="text-lg font-bold text-gray-900 mb-4">Accepted Payment Methods</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
      {METHODS.map((m) => (
        <div key={m.name} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.bg}`}>
            {m.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-gray-900 text-sm">{m.name}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Trust Badges */}
    <h2 className="text-lg font-bold text-gray-900 mb-4">Why Your Payment is Safe</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TRUST.map((t) => (
        <div key={t.title} className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-2">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">{t.icon}</div>
          <p className="font-bold text-sm text-gray-900">{t.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="mt-10 text-center">
      <p className="text-sm text-gray-500 mb-3">Ready to shop securely?</p>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
      >
        Browse Products
      </Link>
    </div>
  </div>
);

export default PaymentInfo;
