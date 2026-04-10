// frontend/src/pages/Cart.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { CartContext } from "../context/CartContext";

const Cart = () => {
  // Grab EVERYTHING from our global CartContext
  const { cartItems, removeFromCart, updateQuantity, cartTotal } =
    useContext(CartContext);

  const shipping = cartTotal > 0 ? 5.0 : 0; // Flat rate shipping
  const finalTotal = cartTotal + shipping;

  // Empty Cart UI
  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <ShoppingBag size={64} className="text-gray-300" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-8">
          Looks like you haven't added any organic goodness yet.
        </p>
        <Link
          to="/shop"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  // Active Cart UI
  return (
    <div className="w-full pb-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-4 text-center">
        Your Shopping Cart
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Cart Items Table */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-6 gap-4 p-6 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Product</div>
              <div className="text-center">Price</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Total</div>
            </div>

            <div className="flex flex-col">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 border-b border-gray-100 items-center relative group"
                >
                  {/* Product Info */}
                  <div className="col-span-3 flex items-center gap-4">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors absolute top-4 right-4 md:static cursor-pointer"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        [{item.image}]
                      </span>
                    </div>
                    <Link
                      to={`/product/${item.id}`}
                      className="font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                  </div>

                  {/* Price */}
                  <div className="text-gray-600 md:text-center font-medium mt-2 md:mt-0">
                    <span className="md:hidden font-bold mr-2">Price:</span>$
                    {item.price.toFixed(2)}
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex justify-start md:justify-center mt-2 md:mt-0">
                    <div className="flex items-center border border-gray-200 rounded-full bg-white h-10">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.qty - 1))
                        }
                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="text"
                        value={item.qty}
                        readOnly
                        className="w-8 text-center font-bold text-sm outline-none pointer-events-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-green-600 cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-green-600 font-bold md:text-right text-lg mt-2 md:mt-0">
                    <span className="md:hidden font-bold text-gray-600 mr-2 text-base">
                      Total:
                    </span>
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link
                to="/shop"
                className="text-gray-600 border border-gray-300 bg-white hover:bg-gray-100 px-6 py-2 rounded-md font-semibold transition-colors w-full sm:w-auto text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
              Order Summary
            </h2>

            <div className="flex justify-between mb-4 text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-6 text-gray-600">
              <span>Shipping Estimate</span>
              <span className="font-bold text-gray-900">
                ${shipping.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between mb-8 pb-6 border-b border-gray-100 text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-green-600 text-2xl">
                ${finalTotal.toFixed(2)}
              </span>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mb-4 text-lg cursor-pointer shadow-md active:scale-[0.98]"
            >
              Proceed to Checkout <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
