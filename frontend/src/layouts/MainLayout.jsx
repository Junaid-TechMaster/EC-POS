// frontend/src/layouts/MainLayout.jsx
import { Outlet, Link } from "react-router-dom";
import { ShoppingCart, User, Heart, Search } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

const MainLayout = () => {
  // Grab the user state and logout function from our AuthContext
  const { user, logout } = useContext(AuthContext);
  // Grab the cartCount from our CartContext
  const { cartCount } = useContext(CartContext);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="border-b border-gray-100 py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-extrabold flex items-center gap-2"
          >
            <span className="text-green-600">Organic</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-grow max-w-2xl w-full flex items-center border border-gray-200 rounded-full overflow-hidden bg-gray-50">
            <select className="bg-transparent border-none outline-none py-2 px-4 text-sm text-gray-600 border-r border-gray-200 cursor-pointer">
              <option>All Categories</option>
              <option>Vegetables</option>
              <option>Fruits</option>
              <option>Meat</option>
            </select>
            <input
              type="text"
              placeholder="Search for items..."
              className="w-full bg-transparent border-none outline-none px-4 py-2 text-sm"
            />
            <button className="p-3 text-gray-500 hover:text-green-600 cursor-pointer">
              <Search size={20} />
            </button>
          </div>

          {/* Icons Menu */}
          <nav className="flex items-center gap-6">
            <Link
              to="/wishlist"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              <Heart size={24} />
            </Link>

            {/* DYNAMIC CART ICON */}
            <Link
              to="/cart"
              className="text-gray-600 hover:text-green-600 transition-colors relative"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* DYNAMIC AUTH UI */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="text-sm font-bold text-gray-800 hover:text-green-600 transition-colors cursor-pointer"
                >
                  Hi, {user.name.split(" ")[0]}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium"
              >
                <User size={24} /> Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 pt-16 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand & Socials */}
            <div className="lg:col-span-1">
              <Link
                to="/"
                className="text-3xl font-extrabold flex items-center gap-2 mb-6"
              >
                <span className="text-green-600">Organic</span>
              </Link>
              <div className="flex gap-2">
                <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-colors">
                  f
                </div>
                <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-colors">
                  t
                </div>
                <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-colors">
                  in
                </div>
                <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-colors">
                  ig
                </div>
              </div>
            </div>

            {/* Organic Links */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6 text-lg">Organic</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li className="hover:text-green-600 cursor-pointer">
                  About us
                </li>
                <li className="hover:text-green-600 cursor-pointer">
                  Conditions
                </li>
                <li className="hover:text-green-600 cursor-pointer">
                  Our Journals
                </li>
                <li className="hover:text-green-600 cursor-pointer">Careers</li>
                <li className="hover:text-green-600 cursor-pointer">
                  Affiliate Programme
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6 text-lg">
                Quick Links
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li className="hover:text-green-600 cursor-pointer">Offers</li>
                <li className="hover:text-green-600 cursor-pointer">
                  Discount Coupons
                </li>
                <li className="hover:text-green-600 cursor-pointer">Stores</li>
                <li className="hover:text-green-600 cursor-pointer">
                  Track Order
                </li>
                <li className="hover:text-green-600 cursor-pointer">Shop</li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6 text-lg">
                Customer Service
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-500">
                <li className="hover:text-green-600 cursor-pointer">FAQ</li>
                <li className="hover:text-green-600 cursor-pointer">Contact</li>
                <li className="hover:text-green-600 cursor-pointer">
                  Privacy Policy
                </li>
                <li className="hover:text-green-600 cursor-pointer">
                  Returns & Refunds
                </li>
                <li className="hover:text-green-600 cursor-pointer">
                  Cookie Guidelines
                </li>
              </ul>
            </div>

            {/* Subscribe Us */}
            <div className="lg:col-span-1">
              <h4 className="font-bold text-gray-900 mb-6 text-lg">
                Subscribe Us
              </h4>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Subscribe to our newsletter to get updates about our grand
                offers.
              </p>
              <div className="flex border border-gray-200 rounded-md overflow-hidden focus-within:border-green-500">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-2 outline-none text-sm bg-gray-50"
                />
                <button className="bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black transition-colors cursor-pointer">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} Organic. All rights reserved.
            </p>
            <p>
              HTML Template by{" "}
              <span className="font-semibold text-gray-900">
                TemplatesJungle
              </span>{" "}
              Distributed By{" "}
              <span className="font-semibold text-gray-900">ThemeWagon</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
