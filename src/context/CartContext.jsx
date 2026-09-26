import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getRestaurantSettings,
  getDeliveryZones,
  validateTableQR,
  getTables
} from '../services/restaurantService';

const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. Cart Items with localStorage persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('variety_momo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Order Type: 'delivery' or 'dinein'
  const [orderType, setOrderType] = useState('delivery');

  // 3. UI Drawer / Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDineInModalOpen, setIsDineInModalOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);

  // 4. Table Context for Dine-In (from QR code scan)
  const [tableContext, setTableContext] = useState(() => {
    try {
      const saved = sessionStorage.getItem('variety_momo_table');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tableError, setTableError] = useState(null);
  const [tablesList, setTablesList] = useState([]);

  // 5. Delivery Zones
  const [deliveryZones, setDeliveryZones] = useState([]);

  // 6. Active Tracking Order
  const [activeTracking, setActiveTracking] = useState(() => {
    try {
      const saved = localStorage.getItem('variety_momo_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 7. Dynamic Restaurant Settings from Supabase
  const [settings, setSettings] = useState({
    delivery_charge: 50,
    advance_payment_percentage: 30,
    cod_percentage: 70,
    phonepe_qr_url: '/phonepe-demo-qr.svg',
    phonepe_upi_id: '7827423777@ybl',
    home_delivery_enabled: true,
    dine_in_enabled: true
  });

  // Fetch settings, delivery zones, and tables on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [settingsData, zonesData, tablesData] = await Promise.all([
          getRestaurantSettings(),
          getDeliveryZones(),
          getTables()
        ]);

        if (isMounted) {
          if (settingsData) setSettings(settingsData);
          if (zonesData && zonesData.length > 0) setDeliveryZones(zonesData);
          if (tablesData && tablesData.length > 0) setTablesList(tablesData);
        }
      } catch (err) {
        console.error('Error loading initial restaurant data:', err);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detect and validate Table QR in URL parameter (e.g. ?table=tbl_momo_01_sec82 or ?t=... or ?qr=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableToken =
      urlParams.get('table') ||
      urlParams.get('t') ||
      urlParams.get('table_token') ||
      urlParams.get('qr');

    if (tableToken) {
      validateTableQR(tableToken).then((res) => {
        if (res && res.valid) {
          const tableInfo = {
            table_id: res.table_id,
            table_number: res.table_number,
            qr_token: tableToken
          };
          setTableContext(tableInfo);
          setOrderType('dinein');
          setTableError(null);
          try {
            sessionStorage.setItem('variety_momo_table', JSON.stringify(tableInfo));
          } catch (e) {
            console.error(e);
          }
        } else {
          setTableError(res?.error || 'Invalid or inactive table QR.');
        }
      });
    }
  }, []);

  // Detect Order Tracking in URL (e.g. /order-tracking/:token or ?token=... or ?order_number=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let trackingToken = urlParams.get('token') || urlParams.get('tracking_token');
    let orderNum = urlParams.get('order_number') || urlParams.get('order');

    const pathname = window.location.pathname;
    if (pathname.includes('/order-tracking/')) {
      const pathToken = pathname.split('/order-tracking/')[1]?.split('/')[0]?.split('?')[0];
      if (pathToken && pathToken.length > 5) {
        trackingToken = pathToken;
      }
    }

    if (trackingToken || orderNum) {
      setActiveTracking((prev) => ({
        ...prev,
        orderNumber: orderNum || prev?.orderNumber || '',
        trackingToken: trackingToken || prev?.trackingToken || ''
      }));
      setIsOrderTrackingOpen(true);
    }
  }, []);

  // Save Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('variety_momo_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Set active table manually / from selection
  const setTableByToken = useCallback(async (token) => {
    if (!token) {
      setTableContext(null);
      sessionStorage.removeItem('variety_momo_table');
      return { valid: false };
    }
    const res = await validateTableQR(token);
    if (res && res.valid) {
      const tableInfo = {
        table_id: res.table_id,
        table_number: res.table_number,
        qr_token: token
      };
      setTableContext(tableInfo);
      setTableError(null);
      sessionStorage.setItem('variety_momo_table', JSON.stringify(tableInfo));
      return { valid: true, table: tableInfo };
    } else {
      setTableError(res?.error || 'Invalid or inactive table QR.');
      return { valid: false, error: res?.error };
    }
  }, []);

  // Add Item to Cart
  const addToCart = (item, variantId = null, qty = 1) => {
    const selectedVariant =
      item.variants?.find((v) => v.id === (variantId || item.defaultVariant)) ||
      item.variants?.[0] || {
        id: 'default',
        name: 'Standard',
        price: item.price || 0
      };

    const cartKey = `${item.id}-${selectedVariant.id}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.cartKey === cartKey);
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
            quantity: Math.max(1, qty)
          }
        ];
      }
    });
  };

  // Stepper Quantity Update
  const updateQuantity = (cartKey, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.cartKey === cartKey ? { ...ci, quantity: newQty } : ci))
    );
  };

  const removeFromCart = (cartKey) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartKey !== cartKey));
  };

  const clearCart = () => setCartItems([]);

  // Get quantity in cart for a specific dish
  const getItemQuantity = (itemId, variantId = null) => {
    if (variantId) {
      const found = cartItems.find((ci) => ci.cartKey === `${itemId}-${variantId}`);
      return found ? found.quantity : 0;
    }
    return cartItems
      .filter((ci) => ci.item.id === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const getItemCartKey = (itemId, variantId) => `${itemId}-${variantId}`;

  // Totals calculations
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );

  // Delivery charge from database setting (₹50 default)
  const deliveryFee =
    orderType === 'dinein'
      ? 0
      : subtotal === 0
      ? 0
      : Number(settings.delivery_charge ?? 50);

  const grandTotal = subtotal + deliveryFee;

  // Advance percentage from database setting (30% default for delivery, 0% for dine-in)
  const advancePercentage =
    orderType === 'dinein' ? 0 : Number(settings.advance_payment_percentage ?? 30);

  const advanceAmount =
    orderType === 'dinein'
      ? 0
      : Math.round((grandTotal * advancePercentage) / 100);

  const codAmount = grandTotal - advanceAmount;

  // Track an active order
  const saveActiveOrder = (orderData) => {
    const trackingInfo = {
      orderNumber: orderData.order_number,
      trackingToken: orderData.tracking_token,
      orderId: orderData.order_id,
      orderType: orderData.order_type,
      grandTotal: orderData.grand_total,
      placedAt: new Date().toISOString()
    };
    setActiveTracking(trackingInfo);
    try {
      localStorage.setItem('variety_momo_active_order', JSON.stringify(trackingInfo));
    } catch (e) {
      console.error(e);
    }
  };

  const openOrderTracking = (orderNumber = null, trackingToken = null) => {
    if (orderNumber && trackingToken) {
      setActiveTracking({ orderNumber, trackingToken });
    }
    setIsOrderTrackingOpen(true);
  };

  const closeOrderTracking = () => {
    setIsOrderTrackingOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        orderType,
        setOrderType,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((p) => !p),
        selectedFoodItem,
        openFoodDetail: (item) => setSelectedFoodItem(item),
        closeFoodDetail: () => setSelectedFoodItem(null),
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        isDineInModalOpen,
        openDineInModal: () => setIsDineInModalOpen(true),
        closeDineInModal: () => setIsDineInModalOpen(false),
        isOrderTrackingOpen,
        openOrderTracking,
        closeOrderTracking,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        getItemCartKey,
        totalCount,
        subtotal,
        deliveryFee,
        grandTotal,
        advancePercentage,
        advanceAmount,
        codAmount,
        settings,
        deliveryZones,
        tablesList,
        tableContext,
        tableError,
        setTableByToken,
        activeTracking,
        saveActiveOrder
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
