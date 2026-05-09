import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InfoBar from '../components/InfoBar';
import CartDrawer from '../components/CartDrawer';

const MainLayout = () => {
  // Request geolocation permission as soon as the site loads
  useEffect(() => {
    if (!navigator.geolocation) return;
    if (sessionStorage.getItem('locationRequested')) return;
    sessionStorage.setItem('locationRequested', '1');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionStorage.setItem('userLat', pos.coords.latitude);
        sessionStorage.setItem('userLon', pos.coords.longitude);
      },
      () => { /* permission denied — silent */ }
    );
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <InfoBar />
      <Navbar />
      <CartDrawer />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-10 py-4 md:py-6">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 pt-16 pb-8 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">

            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <Link to="/" className="text-2xl font-extrabold flex items-center gap-2 mb-4">
                <span className="text-orange-500">🦊</span>
                <span><span className="text-orange-500">CoZy</span><span className="text-gray-900"> FoX</span></span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
                A cozy place to shop fresh, organic and everyday items. Earn rewards, track orders, and enjoy fast delivery.
              </p>
              <div className="flex gap-2">
                {['f', 't', 'in', 'ig'].map((s) => (
                  <div key={s} className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-xs cursor-pointer hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold text-gray-900 mb-5">Shop</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li><Link to="/shop" className="hover:text-orange-500 transition-colors">All Products</Link></li>
                <li><Link to="/categories" className="hover:text-orange-500 transition-colors">Categories</Link></li>
                <li><Link to="/tag/sale" className="hover:text-orange-500 transition-colors">Sale</Link></li>
                <li><Link to="/tag/new" className="hover:text-orange-500 transition-colors">New Arrivals</Link></li>
                <li><Link to="/tag/hot" className="hover:text-orange-500 transition-colors">Hot Picks</Link></li>
                <li><Link to="/tag/bestseller" className="hover:text-orange-500 transition-colors">Bestsellers</Link></li>
                <li><Link to="/compare" className="hover:text-orange-500 transition-colors">Compare</Link></li>
              </ul>
            </div>

            {/* My Account */}
            <div>
              <h4 className="font-bold text-gray-900 mb-5">My Account</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li><Link to="/login" className="hover:text-orange-500 transition-colors">Sign In / Register</Link></li>
                <li><Link to="/profile" className="hover:text-orange-500 transition-colors">My Profile</Link></li>
                <li><Link to="/profile?tab=orders" className="hover:text-orange-500 transition-colors">My Orders</Link></li>
                <li><Link to="/profile?tab=wallet" className="hover:text-orange-500 transition-colors">My Wallet</Link></li>
                <li><Link to="/favorites" className="hover:text-orange-500 transition-colors">Wishlist</Link></li>
                <li><Link to="/profile/shipping" className="hover:text-orange-500 transition-colors">Shipping Address</Link></li>
                <li><Link to="/cart" className="hover:text-orange-500 transition-colors">Cart</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-bold text-gray-900 mb-5">Customer Service</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li><Link to="/contact" className="hover:text-orange-500 transition-colors">Contact Us</Link></li>
                <li><Link to="/returns-policy" className="hover:text-orange-500 transition-colors">Returns Policy</Link></li>
                <li><Link to="/payment-info" className="hover:text-orange-500 transition-colors">Payment Info</Link></li>
                <li><Link to="/profile/shipping" className="hover:text-orange-500 transition-colors">Shipping Info</Link></li>
                <li><Link to="/games" className="hover:text-orange-500 transition-colors">Games &amp; Earn</Link></li>
                <li><Link to="/app" className="hover:text-orange-500 transition-colors">Get the App</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold text-gray-900 mb-5">Newsletter</h4>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Subscribe for offers, fresh drops and CoZy FoX news.
              </p>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-2.5 outline-none text-sm bg-gray-50"
                />
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer">
                  Go
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} CoZy FoX. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/returns-policy" className="hover:text-gray-600">Returns</Link>
              <Link to="/payment-info" className="hover:text-gray-600">Payment</Link>
              <Link to="/contact" className="hover:text-gray-600">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
