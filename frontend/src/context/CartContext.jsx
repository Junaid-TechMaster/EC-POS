import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Unique storage key per user — different accounts never share a cart
  const cartKey = `cartItems_${user?._id || 'guest'}`;

  // Track the previous key so we can detect user switches during render
  const [prevKey, setPrevKey] = useState(cartKey);

  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]');
    } catch {
      return [];
    }
  });

  // Drawer open/close state
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Increments each time openCart is called so CartDrawer can detect re-opens
  const [cartOpenKey, setCartOpenKey] = useState(0);

  // React-approved pattern: update state during render (not in an effect) when
  // the key changes. This avoids the "setState in effect" anti-pattern.
  if (prevKey !== cartKey) {
    setPrevKey(cartKey);
    try {
      setCartItems(JSON.parse(localStorage.getItem(cartKey) || '[]'));
    } catch {
      setCartItems([]);
    }
  }

  // Persist cart to the correct user-scoped key on every change
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  }, [cartItems, cartKey]);

  const openCart = () => {
    setIsCartOpen(true);
    setCartOpenKey((k) => k + 1);
  };
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product, qty) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...product, qty }];
    });
    openCart();
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((item) => item.id !== id));

  const updateQuantity = (id, qty) =>
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: Number(qty) } : item))
    );

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((acc, item) => acc + Number(item.qty), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
        cartCount, cartTotal,
        isCartOpen, openCart, closeCart, cartOpenKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
