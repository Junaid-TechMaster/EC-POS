// frontend/src/pages/Checkout.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { CreditCard, Truck, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const shipping = cartTotal > 0 ? 5.00 : 0;
  const finalTotal = cartTotal + shipping;

const placeOrderHandler = async (e) => {
  e.preventDefault();
  
  try {
    const orderData = {
      orderItems: cartItems,
      shippingAddress: { address, city, postalCode, country: 'USA' }, // Hardcoded country for now
      paymentMethod,
      itemsPrice: cartTotal,
      shippingPrice: shipping,
      totalPrice: finalTotal,
    };

    // Note: withCredentials: true tells Axios to send the secure JWT cookie to the backend
    const { data } = await axios.post('http://localhost:5000/api/orders', orderData, {
      withCredentials: true 
    });

    alert('Order Placed Successfully! Order ID: ' + data._id);
    clearCart();
    navigate('/'); // Redirect to home after successful order
  } catch (error) {
    console.error(error);
    alert(error.response?.data?.message || 'Something went wrong during checkout');
  }
};

  if (!user) {
    return <div className="text-center py-20">Please <button onClick={() => navigate('/login')} className="text-green-600 font-bold underline">log in</button> to checkout.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Secure Checkout</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Form */}
        <form onSubmit={placeOrderHandler} className="md:w-2/3 flex flex-col gap-8">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Truck className="text-green-600"/> Shipping Address</h2>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Street Address" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500" />
              <div className="flex gap-4">
                <input type="text" placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500" />
                <input type="text" placeholder="Postal Code" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><CreditCard className="text-green-600"/> Payment Method</h2>
            <div className="flex gap-4">
              <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center gap-3 ${paymentMethod === 'Credit Card' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" value="Credit Card" checked={paymentMethod === 'Credit Card'} onChange={(e) => setPaymentMethod(e.target.value)} /> Credit Card
              </label>
              <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center gap-3 ${paymentMethod === 'PayPal' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} /> PayPal
              </label>
            </div>
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-colors">
            <CheckCircle size={20}/> Place Order (${finalTotal.toFixed(2)})
          </button>
        </form>

        {/* Right Summary */}
        <div className="md:w-1/3">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-6">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Order Summary</h2>
            <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-4">{item.qty} x {item.name}</span>
                  <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 text-sm flex justify-between mb-2"><span className="text-gray-600">Subtotal</span> <span>${cartTotal.toFixed(2)}</span></div>
            <div className="text-sm flex justify-between mb-4"><span className="text-gray-600">Shipping</span> <span>${shipping.toFixed(2)}</span></div>
            <div className="border-t border-gray-200 pt-4 text-xl font-bold flex justify-between text-green-600"><span>Total</span> <span>${finalTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;