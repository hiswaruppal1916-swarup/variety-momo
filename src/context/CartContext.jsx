import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('variety_momo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'dinein'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDineInModalOpen, setIsDineInModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('variety_momo_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const addToCart = (item, variantId = null, qty = 1) => {
    const selectedVariant = item.variants?.find(v => v.id === (variantId || item.defaultVariant)) || item.variants?.[0] || { id: 'default', name: 'Standard', price: item.price || 0 };
    const cartKey = `${item.id}-${selectedVariant.id}`;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(ci => ci.cartKey === cartKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            cartKey,
            item,
            variant: selectedVariant,
            quantity: qty
          }
        ];
      }
    });
  };

  const updateQuantity = (cartKey, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCartItems(prev =>
      prev.map(ci => (ci.cartKey === cartKey ? { ...ci, quantity: newQty } : ci))
    );
  };

  const removeFromCart = (cartKey) => {
    setCartItems(prev => prev.filter(ci => ci.cartKey !== cartKey));
  };

  const clearCart = () => setCartItems([]);

  // Check if item (and optional variant) is in cart
  const getItemQuantity = (itemId, variantId = null) => {
    if (variantId) {
      const found = cartItems.find(ci => ci.cartKey === `${itemId}-${variantId}`);
      return found ? found.quantity : 0;
    }
    return cartItems
      .filter(ci => ci.item.id === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const getItemCartKey = (itemId, variantId) => `${itemId}-${variantId}`;

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? (subtotal > 249 || subtotal === 0 ? 0 : 30) : 0;
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + (subtotal > 0 ? taxes : 0);
  // Future Step 2 readiness: 30% advance for delivery, 0 for dine-in
  const advanceAmount = orderType === 'delivery' ? Math.round(grandTotal * 0.3) : 0;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        orderType,
        setOrderType,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen(p => !p),
        selectedFoodItem,
        openFoodDetail: (item) => setSelectedFoodItem(item),
        closeFoodDetail: () => setSelectedFoodItem(null),
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        isDineInModalOpen,
        openDineInModal: () => setIsDineInModalOpen(true),
        closeDineInModal: () => setIsDineInModalOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        getItemCartKey,
        totalCount,
        subtotal,
        deliveryFee,
        taxes,
        grandTotal,
        advanceAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
