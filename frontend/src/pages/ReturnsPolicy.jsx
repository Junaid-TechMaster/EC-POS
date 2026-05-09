import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, PackageCheck, AlertCircle, CheckCircle, XCircle, Phone, Mail } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'Contact Us', desc: 'Reach out within 7 days of delivery via phone or email with your order number and reason for return.' },
  { num: '02', title: 'Get Approval', desc: 'Our team reviews your request and sends a return approval along with instructions within 24 hours.' },
  { num: '03', title: 'Ship the Item', desc: 'Pack the item securely in its original packaging and ship it to our return address provided in the approval email.' },
  { num: '04', title: 'Refund Processed', desc: 'Once we receive and inspect the item, your refund is credited to your wallet or original payment method within 3–5 business days.' },
];

const ELIGIBLE = [
  'Items in original, unopened packaging',
  'Products with manufacturing defects',
  'Wrong item delivered',
  'Damaged during delivery',
  'Size/colour mismatch from order',
];

const NOT_ELIGIBLE = [
  'Items used or washed',
  'Products without original tags/packaging',
  'Digital goods and gift vouchers',
  'Perishable groceries and fresh produce',
  'Items returned after 7 days of delivery',
];

const ReturnsPolicy = () => (
  <div className="max-w-3xl mx-auto pb-16 pt-4">
    {/* Back */}
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6">
      <ArrowLeft size={15} /> Back to Home
    </Link>

    {/* Header */}
    <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="relative z-10">
        <RotateCcw size={36} className="mb-3 opacity-90" />
        <h1 className="text-2xl font-extrabold">Easy 7-Day Returns</h1>
        <p className="text-sm opacity-80 mt-1 max-w-md">
          Not happy with your purchase? No problem. Return eligible items within 7 days of delivery — hassle-free.
        </p>
      </div>
    </div>

    {/* How it works */}
    <h2 className="text-lg font-bold text-gray-900 mb-5">How to Return an Item</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
      {STEPS.map((s) => (
        <div key={s.num} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
          <span className="text-2xl font-extrabold text-orange-400 leading-none flex-shrink-0">{s.num}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{s.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Eligible / Not eligible */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
      <div className="bg-green-50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={20} className="text-green-600" />
          <h3 className="font-bold text-green-800 text-sm">Eligible for Return</h3>
        </div>
        <ul className="space-y-2">
          {ELIGIBLE.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-green-700">
              <CheckCircle size={12} className="mt-0.5 flex-shrink-0 text-green-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-red-50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={20} className="text-red-500" />
          <h3 className="font-bold text-red-800 text-sm">Not Eligible for Return</h3>
        </div>
        <ul className="space-y-2">
          {NOT_ELIGIBLE.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-red-700">
              <XCircle size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Important note */}
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 mb-10">
      <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-amber-800 text-sm">Important Note</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          Return shipping costs are borne by the customer unless the item was delivered incorrectly or is defective.
          Refunds for cash-on-delivery orders are credited as wallet balance.
        </p>
      </div>
    </div>

    {/* Contact */}
    <h2 className="text-lg font-bold text-gray-900 mb-4">Need Help with a Return?</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-center hover:shadow-md transition-shadow">
        <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Phone size={20} className="text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Call Us</p>
          <p className="text-xs text-gray-500 mt-0.5">Mon–Sat, 9am–6pm PKT</p>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-center hover:shadow-md transition-shadow">
        <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Mail size={20} className="text-green-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Email Support</p>
          <p className="text-xs text-gray-500 mt-0.5">Response within 24 hours</p>
        </div>
      </div>
    </div>

    {/* CTA */}
    <div className="mt-10 text-center">
      <Link
        to="/contact"
        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
      >
        Contact Support
      </Link>
    </div>
  </div>
);

export default ReturnsPolicy;
