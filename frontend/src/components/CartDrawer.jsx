import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Minus, Plus, Trash2, ShoppingBag, ChevronRight, Minimize2, Maximize2,
} from 'lucide-react';
import axios from '../utils/api';
import { CartContext } from '../context/CartContext';

const CartDrawer = () => {
  const {
    cartItems, cartTotal, isCartOpen, closeCart, openCart,
    removeFromCart, updateQuantity, cartOpenKey,
  } = useContext(CartContext);

  const [minimized, setMinimized] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productShipping, setProductShipping] = useState({ charge: 0, threshold: null });

  // Fetch shipping settings from products in cart — same logic as Checkout
  useEffect(() => {
    if (cartItems.length === 0) {
      setProductShipping({ charge: 0, threshold: null });
      return;
    }
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

  const qualifiesForFree = productShipping.threshold !== null && cartTotal >= productShipping.threshold;
  const shipping = cartTotal === 0 ? 0 : (qualifiesForFree ? 0 : productShipping.charge);
  const finalTotal = cartTotal + shipping;

  // Expand drawer whenever openCart is freshly triggered (e.g. addToCart while minimized)
  useEffect(() => {
    if (cartOpenKey <= 0) return;
    const t = setTimeout(() => setMinimized(false), 0);
    return () => clearTimeout(t);
  }, [cartOpenKey]);

  // Fetch related products based on the first cart item's category
  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) {
      const t = setTimeout(() => setRelatedProducts([]), 0);
      return () => clearTimeout(t);
    }
    const category = cartItems[0]?.category;
    if (!category) return;
    const cartIds = new Set(cartItems.map((i) => i.id));
    axios
      .get(`/api/products?category=${encodeURIComponent(category)}&pageSize=6`)
      .then(({ data }) => {
        setRelatedProducts(
          (data.products || []).filter((p) => !cartIds.has(p._id)).slice(0, 4)
        );
      })
      .catch(() => {});
  }, [isCartOpen, cartItems]);

  if (!isCartOpen) return null;

  // Minimized: floating pill at bottom-right
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); openCart(); }}
        className="fixed bottom-8 right-0 z-50 bg-green-600 text-white rounded-l-2xl shadow-2xl flex items-center gap-2 px-4 py-3 hover:bg-green-700 transition-colors"
      >
        <ShoppingBag size={18} />
        <span className="font-bold text-sm">Cart ({cartItems.length})</span>
        <Maximize2 size={13} />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
        onClick={closeCart}
      />

      {/* Slide-in Drawer — 100dvh keeps footer visible even when mobile browser chrome shows */}
      <div className="fixed top-0 right-0 w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right" style={{ height: '100dvh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-green-600" />
            <h2 className="font-bold text-gray-900 text-base">My Cart</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={closeCart}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <ShoppingBag size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={closeCart}
                className="mt-4 text-green-600 text-sm font-semibold hover:underline"
              >
                Browse products →
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex flex-col divide-y divide-gray-100 px-4 py-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.id}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-gray-800 hover:text-green-600 line-clamp-2 leading-tight"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-green-600 font-bold mt-0.5">
                        Rs {item.price.toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty control */}
                        <div className="flex items-center border border-gray-200 rounded-full h-7">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.qty - 1))}
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold select-none">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700">
                            Rs {(item.price * item.qty).toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="px-4 pt-3 pb-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    You might also like
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar max-h-44">
                    {relatedProducts.map((p) => (
                      <Link
                        key={p._id}
                        to={`/product/${p.slug || p._id}`}
                        onClick={closeCart}
                        className="flex-shrink-0 w-28 bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-md transition-all"
                      >
                        <div className="w-full h-24 bg-gray-100">
                          {(p.images?.[0] || p.image) && (
                            <img
                              src={p.images?.[0] || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-tight">
                            {p.name}
                          </p>
                          <p className="text-xs font-bold text-green-600 mt-1">
                            Rs {p.price?.toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: Totals + Buttons — flex-shrink-0 keeps it always visible */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 pb-safe bg-white flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800">Rs {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>Shipping</span>
              <span className="font-semibold text-gray-800">
                {shipping === 0
                  ? <span className="text-green-600">Free</span>
                  : `Rs ${shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base mb-4 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-green-600 text-lg">Rs {finalTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Link
                to="/cart"
                onClick={closeCart}
                className="flex-1 border border-gray-300 text-gray-700 text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-colors"
              >
                Checkout <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
