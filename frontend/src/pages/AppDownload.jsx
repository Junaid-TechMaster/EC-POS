import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone, Star, Shield, Zap, Bell, ShoppingBag, Wallet, Gift } from 'lucide-react';

const FEATURES = [
  { icon: ShoppingBag, title: 'Shop Anywhere', desc: 'Browse thousands of organic products on the go, anytime.' },
  { icon: Wallet,      title: 'Wallet & Rewards', desc: 'Top up your wallet, earn bonus points, and redeem instantly.' },
  { icon: Bell,        title: 'Order Tracking', desc: 'Get live push notifications for every order status update.' },
  { icon: Zap,         title: 'Lightning Fast', desc: 'One-tap checkout with saved addresses and payment methods.' },
  { icon: Gift,        title: 'Exclusive Offers', desc: 'App-only vouchers and flash deals every week.' },
  { icon: Shield,      title: 'Secure Payments', desc: 'End-to-end encrypted transactions via Stripe & local wallets.' },
];

const REVIEWS = [
  { name: 'Hamza A.', rating: 5, text: 'Best grocery app in Pakistan. Delivery is always on time!' },
  { name: 'Sara K.',  rating: 5, text: 'Love the wallet feature. So easy to pay and earn points.' },
  { name: 'Usman R.', rating: 4, text: 'Great selection of organic products. App is super smooth.' },
];

const AppDownload = () => (
  <div className="w-full pb-16">
    <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
      <ArrowLeft size={15} /> Back to Home
    </Link>

    {/* Hero */}
    <section className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-10 md:p-16 mb-12 text-white flex flex-col md:flex-row items-center gap-10">
      <div className="md:w-1/2">
        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">📱 Now Available</span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
          EC-POS <br /> <span className="text-yellow-300">Mobile App</span>
        </h1>
        <p className="text-green-100 text-lg mb-8 leading-relaxed">
          Shop smarter, earn rewards, and track orders right from your phone. The full EC-POS experience — in your pocket.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#"
            className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-6 py-3.5 rounded-2xl transition-colors shadow-lg"
          >
            <span className="text-2xl">🍏</span>
            <div>
              <p className="text-[10px] text-gray-300 leading-none">Download on the</p>
              <p className="font-bold text-base leading-tight">App Store</p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-6 py-3.5 rounded-2xl transition-colors shadow-lg"
          >
            <span className="text-2xl">▶️</span>
            <div>
              <p className="text-[10px] text-gray-300 leading-none">GET IT ON</p>
              <p className="font-bold text-base leading-tight">Google Play</p>
            </div>
          </a>
        </div>
        <div className="flex items-center gap-4 mt-6 text-sm text-green-100">
          <span className="flex items-center gap-1">⭐ 4.8 / 5</span>
          <span>·</span>
          <span>50K+ Downloads</span>
          <span>·</span>
          <span>Free</span>
        </div>
      </div>

      {/* Phone mockup */}
      <div className="md:w-1/2 flex justify-center">
        <div className="relative">
          <div className="w-52 h-96 bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="h-6 bg-gray-800 flex items-center justify-center">
              <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
            </div>
            <div className="flex-1 bg-gradient-to-b from-green-50 to-white p-3 flex flex-col gap-2">
              <div className="bg-green-600 rounded-xl p-3 text-white text-xs font-bold">🌿 EC-POS Organic</div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {['🥦 Veggies', '🍎 Fruits', '🥛 Dairy', '🌾 Grains'].map(c => (
                  <div key={c} className="bg-white rounded-xl border border-gray-100 p-2 text-xs font-medium text-gray-700 flex items-center gap-1 shadow-sm">{c}</div>
                ))}
              </div>
              <div className="bg-yellow-400 rounded-xl p-2 text-xs font-bold text-gray-900 text-center">🎁 Earn Rewards Today</div>
            </div>
          </div>
          <div className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow">FREE</div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="mb-12">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Everything you need</h2>
      <p className="text-gray-500 text-center mb-8">Packed with features to make your shopping easier</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
            <div className="bg-green-50 p-3 rounded-xl flex-shrink-0">
              <Icon size={22} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Reviews */}
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">What our users say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {REVIEWS.map(({ name, rating, text }) => (
          <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex mb-2">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-600 italic mb-3">&ldquo;{text}&rdquo;</p>
            <p className="text-sm font-bold text-gray-900">{name}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-green-50 border border-green-100 rounded-3xl p-10 text-center">
      <Smartphone size={40} className="text-green-600 mx-auto mb-3" />
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to shop smarter?</h2>
      <p className="text-gray-500 mb-6">Download the EC-POS app today and get 10% off your first mobile order.</p>
      <div className="flex justify-center gap-4 flex-wrap">
        <a href="#" className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">🍏 App Store</a>
        <a href="#" className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">▶️ Google Play</a>
      </div>
    </section>
  </div>
);

export default AppDownload;
