// frontend/src/context/CartContext.jsx
import { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // 1. Lazy Initialize: Check localStorage for existing cart items on load
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('cartItems');
    return localData ? JSON.parse(localData) : [];
  });

  // 2. Auto-Save: Whenever cartItems change, save them to localStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Add to Cart Logic
  const addToCart = (product, qty) => {
    setCartItems((prevItems) => {
      // Check if item is already in cart
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // If it exists, just update the quantity
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      } else {
        // If it's new, add the whole product plus the selected quantity
        return [...prevItems, { ...product, qty }];
      }
    });
  };

  // 4. Remove Item Logic
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // 5. Update Specific Quantity (e.g., from the Cart page)
  const updateQuantity = (id, qty) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, qty: Number(qty) } : item))
    );
  };

  // 6. Clear Cart (Useful after a successful checkout)
  const clearCart = () => setCartItems([]);

  // 7. Calculate Totals dynamically
  const cartCount = cartItems.reduce((acc, item) => acc + Number(item.qty), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        cartCount, 
        cartTotal 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};