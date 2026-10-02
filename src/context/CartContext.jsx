import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getRestaurantSettings,
  getDeliveryZones,
  validateTableQR,
  getTables,
  getCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
  deleteCustomerNotification,
  deleteAllCustomerNotifications
} from '../services/restaurantService';
import { supabase } from '../lib/supabase';

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
  const [isCustomerNotifOpen, setIsCustomerNotifOpen] = useState(false);

  // 4. Customer Notifications & Tokens
  const [customerNotifications, setCustomerNotifications] = useState([]);
  const [customerTokens, setCustomerTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('variety_momo_tokens');
      const tokens = saved ? JSON.parse(saved) : [];
      const active = localStorage.getItem('variety_momo_active_order');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.trackingToken && !tokens.includes(parsed.trackingToken)) {
          tokens.push(parsed.trackingToken);
        }
      }
      return tokens;
    } catch {
      return [];
    }
  });

  // 5. Table Context for Dine-In (from QR code scan)
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

  // 6. Delivery Zones
  const [deliveryZones, setDeliveryZones] = useState([]);

  // 7. Active Tracking Order
  const [activeTracking, setActiveTracking] = useState(() => {
    try {
      const saved = localStorage.getItem('variety_momo_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 8. Dynamic Restaurant Settings from Supabase
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
    } else {
      // Restore previously scanned or selected table from sessionStorage
      try {
        const stored = sessionStorage.getItem('variety_momo_table');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.qr_token || parsed.table_number)) {
            setTableContext(parsed);
          }
        }
      } catch (e) {
        console.warn('SessionStorage table restore error:', e);
      }
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

  // Fetch Customer Notifications
  const fetchCustomerNotifs = useCallback(async () => {
    if (!customerTokens || customerTokens.length === 0) return;
    try {
      const data = await getCustomerNotifications(customerTokens);
      let dismissed = [];
      try {
        dismissed = JSON.parse(localStorage.getItem('variety_momo_dismissed_notifs') || '[]');
      } catch (e) {}
      const filtered = (data || []).filter((n) => !dismissed.includes(n.id));
      setCustomerNotifications(filtered);
    } catch (err) {
      console.error('Error loading customer notifications:', err);
    }
  }, [customerTokens]);

  useEffect(() => {
    fetchCustomerNotifs();
  }, [fetchCustomerNotifs]);

  // Realtime subscription for customer notifications
  useEffect(() => {
    if (!customerTokens || customerTokens.length === 0) return;

    const channel = supabase
      .channel('customer-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'recipient_type=eq.CUSTOMER'
        },
        () => {
          fetchCustomerNotifs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerTokens, fetchCustomerNotifs]);

  const customerUnreadCount = customerNotifications.filter((n) => !n.is_read).length;

  // Smart History Navigation for Android / PWA
  const modalHistoryRef = useRef([]);

  const pushModal = useCallback((modalId) => {
    modalHistoryRef.current.push(modalId);
    window.history.pushState({ varietyModal: modalId }, '');
  }, []);

  const popModal = useCallback((modalId, fallbackClose) => {
    if (window.history.state?.varietyModal === modalId) {
      window.history.back();
    } else {
      const idx = modalHistoryRef.current.lastIndexOf(modalId);
      if (idx !== -1) modalHistoryRef.current.splice(idx, 1);
      fallbackClose();
    }
  }, []);

  // Listen for hardware/browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      // If modal was closed via browser/hardware back
      if (modalHistoryRef.current.length > 0) {
        const topModal = modalHistoryRef.current.pop();
        if (topModal === 'customer-notif') setIsCustomerNotifOpen(false);
        else if (topModal === 'order-tracking') setIsOrderTrackingOpen(false);
        else if (topModal === 'search') setIsSearchOpen(false);
        else if (topModal === 'food-detail') setSelectedFoodItem(null);
        else if (topModal === 'cart') setIsCartOpen(false);
        else if (topModal === 'dinein') setIsDineInModalOpen(false);
        return;
      }

      // Check current open state as fallback
      if (isCustomerNotifOpen) {
        setIsCustomerNotifOpen(false);
      } else if (isOrderTrackingOpen) {
        setIsOrderTrackingOpen(false);
      } else if (isSearchOpen) {
        setIsSearchOpen(false);
      } else if (selectedFoodItem) {
        setSelectedFoodItem(null);
      } else if (isCartOpen) {
        setIsCartOpen(false);
      } else if (isDineInModalOpen) {
        setIsDineInModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCustomerNotifOpen, isOrderTrackingOpen, isSearchOpen, selectedFoodItem, isCartOpen, isDineInModalOpen]);

  const openCart = useCallback(() => {
    pushModal('cart');
    setIsCartOpen(true);
  }, [pushModal]);

  const closeCart = useCallback(() => {
    popModal('cart', () => setIsCartOpen(false));
  }, [popModal]);

  const openFoodDetail = useCallback((item) => {
    pushModal('food-detail');
    setSelectedFoodItem(item);
  }, [pushModal]);

  const closeFoodDetail = useCallback(() => {
    popModal('food-detail', () => setSelectedFoodItem(null));
  }, [popModal]);

  const openSearch = useCallback(() => {
    pushModal('search');
    setIsSearchOpen(true);
  }, [pushModal]);

  const closeSearch = useCallback(() => {
    popModal('search', () => setIsSearchOpen(false));
  }, [popModal]);

  const openDineInModal = useCallback(() => {
    pushModal('dinein');
    setIsDineInModalOpen(true);
  }, [pushModal]);

  const closeDineInModal = useCallback(() => {
    popModal('dinein', () => setIsDineInModalOpen(false));
  }, [popModal]);

  const openOrderTracking = useCallback((orderNumber = null, trackingToken = null) => {
    if (orderNumber && trackingToken) {
      setActiveTracking((prev) => ({
        ...prev,
        orderNumber,
        trackingToken
      }));
      try {
        const existingTokens = JSON.parse(localStorage.getItem('variety_momo_tokens') || '[]');
        if (!existingTokens.includes(trackingToken)) {
          existingTokens.push(trackingToken);
          localStorage.setItem('variety_momo_tokens', JSON.stringify(existingTokens));
          setCustomerTokens(existingTokens);
        }
      } catch (e) {}
    }
    pushModal('order-tracking');
    setIsOrderTrackingOpen(true);
  }, [pushModal]);

  const closeOrderTracking = useCallback(() => {
    popModal('order-tracking', () => setIsOrderTrackingOpen(false));
  }, [popModal]);

  const openCustomerNotif = useCallback(() => {
    pushModal('customer-notif');
    setIsCustomerNotifOpen(true);
    fetchCustomerNotifs();
  }, [pushModal, fetchCustomerNotifs]);

  const closeCustomerNotif = useCallback(() => {
    popModal('customer-notif', () => setIsCustomerNotifOpen(false));
  }, [popModal]);

  const markCustomerNotifRead = async (id, token) => {
    await markCustomerNotificationRead(id, token);
    setCustomerNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllCustomerNotifsRead = async () => {
    await markAllCustomerNotificationsRead(customerTokens);
    setCustomerNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteCustomerNotif = async (id, token) => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('variety_momo_dismissed_notifs') || '[]');
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('variety_momo_dismissed_notifs', JSON.stringify(dismissed));
      }
    } catch (e) {}
    setCustomerNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteCustomerNotification(id, token).catch(() => {});
  };

  const deleteAllCustomerNotifs = async () => {
    try {
      const allIds = customerNotifications.map((n) => n.id);
      const dismissed = JSON.parse(localStorage.getItem('variety_momo_dismissed_notifs') || '[]');
      const combined = Array.from(new Set([...dismissed, ...allIds]));
      localStorage.setItem('variety_momo_dismissed_notifs', JSON.stringify(combined));
    } catch (e) {}
    setCustomerNotifications([]);
    deleteAllCustomerNotifications(customerTokens).catch(() => {});
  };

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
      const existingTokens = JSON.parse(localStorage.getItem('variety_momo_tokens') || '[]');
      if (orderData.tracking_token && !existingTokens.includes(orderData.tracking_token)) {
        existingTokens.push(orderData.tracking_token);
        localStorage.setItem('variety_momo_tokens', JSON.stringify(existingTokens));
        setCustomerTokens(existingTokens);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        orderType,
        setOrderType,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart: () => (isCartOpen ? closeCart() : openCart()),
        selectedFoodItem,
        openFoodDetail,
        closeFoodDetail,
        isSearchOpen,
        openSearch,
        closeSearch,
        isDineInModalOpen,
        openDineInModal,
        closeDineInModal,
        isOrderTrackingOpen,
        openOrderTracking,
        closeOrderTracking,
        isCustomerNotifOpen,
        openCustomerNotif,
        closeCustomerNotif,
        customerNotifications,
        customerUnreadCount,
        markCustomerNotifRead,
        markAllCustomerNotifsRead,
        deleteCustomerNotif,
        deleteAllCustomerNotifs,
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
