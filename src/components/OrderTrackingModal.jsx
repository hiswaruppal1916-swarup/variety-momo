import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Bike,
  ShieldCheck,
  RefreshCw,
  Bell,
  BellRing,
  AlertTriangle,
  Receipt,
  Calendar
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  getCustomerOrder,
  submitOrderPayment,
  subscribeToOrderUpdates,
  formatKolkataDateTime
} from '../services/restaurantService';
import {
  checkFcmSupport,
  requestNotificationPermission,
  getFcmToken,
  registerPushSubscriptionInDatabase
} from '../lib/firebase';

export default function OrderTrackingModal() {
  const { isOrderTrackingOpen, closeOrderTracking, activeTracking, settings } = useCart();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // FCM Customer Push Notification State
  const [fcmSupported, setFcmSupported] = useState(false);
  const [pushStatus, setPushStatus] = useState('idle'); // 'idle' | 'requesting' | 'enabled' | 'denied'

  // Fetch Order details securely using orderNumber + trackingToken
  const fetchOrder = async (isSilent = false) => {
    if (!activeTracking?.orderNumber || !activeTracking?.trackingToken) return;
    if (!isSilent) setLoading(true);
    try {
      const res = await getCustomerOrder(
        activeTracking.orderNumber,
        activeTracking.trackingToken
      );
      if (res && res.success) {
        setOrderDetails(res);
        setError(null);
      } else {
        setError(res?.error || 'Unable to locate order tracking details.');
      }
    } catch (err) {
      console.error('Error fetching customer order:', err);
      setError(err.message || 'Failed to connect to order server.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrderTrackingOpen) {
      if (activeTracking?.orderNumber && activeTracking?.trackingToken) {
        fetchOrder();
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem('variety_momo_active_order') || '{}');
          if (saved.orderNumber && saved.trackingToken) {
            openOrderTracking(saved.orderNumber, saved.trackingToken);
            return;
          }
        } catch (e) {}
        setLoading(false);
      }
    }
  }, [isOrderTrackingOpen, activeTracking?.orderNumber, activeTracking?.trackingToken]);

  // Subscribe to Realtime Updates with automatic cleanup
  useEffect(() => {
    if (!isOrderTrackingOpen || !orderDetails?.order?.id) return;

    const unsubscribe = subscribeToOrderUpdates(orderDetails.order.id, (updatedRow) => {
      setOrderDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          order: {
            ...prev.order,
            ...updatedRow
          }
        };
      });
    });

    // Failsafe periodic sync every 15 seconds
    const interval = setInterval(() => {
      fetchOrder(true);
    }, 15000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [isOrderTrackingOpen, orderDetails?.order?.id]);

  // FCM Push Notifications Support & Local Status Check
  useEffect(() => {
    let mounted = true;
    checkFcmSupport().then((supported) => {
      if (!mounted) return;
      setFcmSupported(supported);
      if (supported && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const isSubscribed = localStorage.getItem(`fcm_sub_${activeTracking?.orderNumber}`);
          if (isSubscribed) {
            setPushStatus('enabled');
          }
        } else if (Notification.permission === 'denied') {
          setPushStatus('denied');
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeTracking?.orderNumber]);

  const handleEnableCustomerPush = async () => {
    if (!orderDetails?.order?.order_number || !activeTracking?.trackingToken) return;
    setPushStatus('requesting');
    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        return;
      }

      const token = await getFcmToken();
      if (token) {
        await registerPushSubscriptionInDatabase({
          userType: 'CUSTOMER',
          orderNumber: orderDetails.order.order_number,
          trackingToken: activeTracking.trackingToken,
          fcmToken: token
        });
        localStorage.setItem(`fcm_sub_${orderDetails.order.order_number}`, 'true');
        setPushStatus('enabled');
      } else {
        setPushStatus('denied');
      }
    } catch (err) {
      console.error('Customer push subscription error:', err);
      setPushStatus('idle');
    }
  };

  if (!isOrderTrackingOpen) return null;

  const order = orderDetails?.order;
  const items = orderDetails?.items || [];
  const isDineIn = order?.order_type === 'DINE_IN';

  // Handle PhonePe payment submission for home delivery
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!utrInput.trim() || utrInput.trim().length < 4) {
      alert('Please enter a valid PhonePe reference or transaction ID.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await submitOrderPayment({
        orderNumber: order.order_number,
        trackingToken: order.tracking_token,
        paymentReference: utrInput.trim(),
        paymentAmount: order.advance_amount
      });

      if (res && res.success) {
        setPaymentSuccessMsg('Payment submitted. Waiting for restaurant verification.');
        setUtrInput('');
        fetchOrder(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit payment reference.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Distinct timeline steps per Requirement 2
  const dineInSteps = [
    { key: 'ORDER_PLACED', label: 'Order Placed' },
    { key: 'ACCEPTED', label: 'Order Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    { key: 'SERVED', label: 'Served' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const deliverySteps = [
    { key: 'ORDER_PLACED', label: 'Order Placed' },
    { key: 'PAYMENT_SUBMITTED', label: 'Payment Submitted' },
    { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
    { key: 'ACCEPTED', label: 'Order Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getDineInStepIndex = (ord) => {
    if (!ord) return 0;
    const status = ord.order_status;
    if (status === 'COMPLETED') return 5;
    if (status === 'SERVED') return 4;
    if (status === 'READY') return 3;
    if (status === 'PREPARING') return 2;
    if (status === 'ACCEPTED') return 1;
    return 0; // PENDING / ORDER PLACED
  };

  const getDeliveryStepIndex = (ord) => {
    if (!ord) return 0;
    const status = ord.order_status;
    const payStatus = ord.payment_status;

    if (status === 'COMPLETED') return 7;
    if (status === 'OUT_FOR_DELIVERY') return 6;
    if (status === 'READY') return 5;
    if (status === 'PREPARING') return 4;
    if (status === 'ACCEPTED') return 3;
    if (status === 'PAYMENT_VERIFIED' || payStatus === 'VERIFIED') return 2;
    if (status === 'PAYMENT_SUBMITTED' || payStatus === 'SUBMITTED') return 1;
    return 0; // PENDING / ORDER PLACED
  };

  const currentStepList = isDineIn ? dineInSteps : deliverySteps;
  const currentStepIdx = isDineIn ? getDineInStepIndex(order) : getDeliveryStepIndex(order);

  // Status message calculation for real-time order alerts (Requirement 3)
  const getStatusHeadline = () => {
    if (!order) return '';
    const status = order.order_status;
    const payStatus = order.payment_status;

    if (status === 'CANCELLED' || status === 'REJECTED') {
      return 'Your order has been cancelled.';
    }

    if (isDineIn) {
      if (status === 'COMPLETED') return 'Your order is completed. Thank you!';
      if (status === 'SERVED') return 'Your order has been served.';
      if (status === 'READY') return 'Your order is ready.';
      if (status === 'PREPARING') return 'Your order is being prepared.';
      if (status === 'ACCEPTED') return 'Your order has been accepted.';
      return 'Your Variety Momo order has been received.';
    } else {
      if (status === 'COMPLETED') return 'Your order has been completed.';
      if (status === 'OUT_FOR_DELIVERY') return 'Your order is on the way.';
      if (status === 'READY') return 'Your order is ready.';
      if (status === 'PREPARING') return 'Your order is being prepared.';
      if (status === 'ACCEPTED') return 'Your order has been accepted.';
      if (payStatus === 'VERIFIED' || status === 'PAYMENT_VERIFIED') {
        return 'Advance payment verified.';
      }
      if (payStatus === 'SUBMITTED' || status === 'PAYMENT_SUBMITTED') {
        return 'Payment submitted. Waiting for restaurant verification.';
      }
      if (payStatus === 'REJECTED') {
        return 'Payment verification failed. Please contact Variety Momo.';
      }
      return 'Your Variety Momo order has been received.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeOrderTracking}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header with Variety Momo Branding */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeOrderTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all border border-stone-700 active:scale-95 shrink-0"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <img
              src="/variety-momo-logo.jpg"
              alt="Variety Momo"
              className="w-10 h-10 rounded-2xl object-cover border border-white/20 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-outfit font-extrabold text-base text-white tracking-tight">
                  Variety Momo
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Live Tracking
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-300 mt-0.5">
                <span className="font-mono font-bold text-amber-300">
                  {order ? `Order #${order.order_number}` : 'Locating...'}
                </span>
                {order && (
                  <>
                    <span>•</span>
                    <span className="font-medium">
                      {isDineIn ? `Dine-In (Table ${order.table_number || 'Counter'})` : 'Home Delivery'}
                    </span>
                  </>
                )}
              </div>
              {order && order.created_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-semibold mt-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{formatKolkataDateTime(order.created_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchOrder()}
              className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeOrderTracking}
              className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
              aria-label="Close tracking"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!loading && !order && !activeTracking?.orderNumber ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8 text-stone-500" />
              </div>
              <div>
                <h4 className="font-outfit font-extrabold text-stone-900 text-lg">No Active Orders</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  You don't have any active orders right now. Explore our delicious momos and place an order!
                </p>
              </div>
              <button
                onClick={() => {
                  closeOrderTracking();
                  const menuEl = document.getElementById('menu');
                  if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all inline-flex items-center gap-1.5"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : loading && !order ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-600">Connecting to live restaurant terminal...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-outfit font-bold text-stone-900 text-base">Order Not Found</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">{error}</p>
              <button
                onClick={() => fetchOrder()}
                className="px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold"
              >
                Try Again
              </button>
            </div>
          ) : order ? (
            <>
              {/* REAL-TIME STATUS HEADLINE BANNER (Requirement 3) */}
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  {isDineIn ? <UtensilsCrossed className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
                    Current Update
                  </span>
                  <h4 className="font-outfit font-black text-stone-900 text-sm sm:text-base leading-snug">
                    {getStatusHeadline()}
                  </h4>
                </div>
              </div>

              {/* PUSH NOTIFICATIONS SUBSCRIPTION FOR ORDER */}
              {fcmSupported && pushStatus !== 'denied' && (
                pushStatus === 'enabled' ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-950 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Push alerts active for Order #{order.order_number}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-950 text-xs">Get Live Order Alerts</div>
                        <div className="text-[11px] text-amber-800 leading-tight">Get phone alerts when momos are preparing or ready</div>
                      </div>
                    </div>
                    <button
                      onClick={handleEnableCustomerPush}
                      disabled={pushStatus === 'requesting'}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{pushStatus === 'requesting' ? 'Enabling...' : 'Enable Alerts'}</span>
                    </button>
                  </div>
                )
              )}

              {/* DINE-IN SERVED BANNER (Requirement 4) */}
              {isDineIn && order.order_status === 'SERVED' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-3 text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-black text-lg text-emerald-900">
                      Your order has been served.
                    </h4>
                    <p className="text-sm font-bold text-emerald-800 mt-0.5">
                      Please pay the bill at the counter.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-1.5 text-left shadow-xs">
                    <div className="flex justify-between text-stone-600 font-semibold">
                      <span>Order Number:</span>
                      <span className="font-bold text-stone-900">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 font-semibold">
                      <span>Table:</span>
                      <span className="font-bold text-stone-900">Table {order.table_number || 'Dine-In'}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 font-semibold pt-1 border-t border-stone-100">
                      <span>Grand Total:</span>
                      <span className="font-black text-brand-600 text-base">₹{order.grand_total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Meta Info Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Order Placed At
                  </span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })} • {new Date(order.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    {isDineIn ? 'Table Assignment' : 'Delivery Zone'}
                  </span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {isDineIn ? `Table ${order.table_number || 'Dine-In'}` : order.address?.zone_name || 'Mecheda'}
                  </span>
                </div>
              </div>

              {/* FCM Customer Push Notification Opt-In */}
              {fcmSupported && pushStatus !== 'enabled' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-xs">Real-Time Order Notifications</p>
                      <p className="text-[11px] text-stone-500">Get push alerts on food preparation & delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnableCustomerPush}
                    disabled={pushStatus === 'requesting'}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs active:scale-95"
                  >
                    {pushStatus === 'requesting' ? 'Enabling...' : 'Enable Alerts'}
                  </button>
                </div>
              )}

              {pushStatus === 'enabled' && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <BellRing className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time push alerts active for order #{order.order_number}</span>
                </div>
              )}

              {/* VISUAL ORDER TIMELINE (Requirement 2) */}
              <div className="py-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-3">
                  Order Timeline
                </span>
                <div className="space-y-3">
                  {currentStepList.map((step, idx) => {
                    const isDone = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                              : isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-outfit text-xs sm:text-sm font-bold truncate ${
                              isDone ? 'text-stone-900' : isCurrent ? 'text-brand-600 font-extrabold' : 'text-stone-400'
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            In Progress
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HOME DELIVERY PHONEPE ADVANCE PAYMENT CARD (Requirement 6) */}
              {!isDineIn && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-outfit font-bold text-amber-900 text-sm">
                        {order.payment_status === 'VERIFIED'
                          ? 'Advance payment verified.'
                          : order.payment_status === 'SUBMITTED'
                          ? 'Payment submitted. Waiting for restaurant verification.'
                          : order.payment_status === 'REJECTED'
                          ? 'Payment verification failed. Please contact Variety Momo.'
                          : 'Pay 30% advance'}
                      </div>
                      <p className="text-amber-800 leading-relaxed font-medium">
                        {order.payment_status === 'VERIFIED' ? (
                          <span>
                            Your advance payment of <strong>₹{order.advance_amount}</strong> is confirmed. The remaining <strong>₹{order.cod_amount}</strong> will be collected in cash upon delivery.
                          </span>
                        ) : order.payment_status === 'SUBMITTED' ? (
                          <span>
                            Reference <strong>{order.payment_reference}</strong> received. Our team is verifying this on PhonePe. Remaining COD: <strong>₹{order.cod_amount}</strong>.
                          </span>
                        ) : order.payment_status === 'REJECTED' ? (
                          <span>
                            We could not verify your PhonePe reference. Please call us or reach out on WhatsApp to resolve this immediately.
                          </span>
                        ) : (
                          <span>
                            Please scan the QR code below to transfer the 30% advance of <strong>₹{order.advance_amount}</strong> via PhonePe.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* If PENDING, show PhonePe QR, UPI ID, Amount and Reference Submission Form */}
                  {order.payment_status === 'PENDING' && (
                    <div className="pt-2 border-t border-amber-200/80 space-y-3">
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
                        <div>
                          <span className="text-[10px] text-stone-500 font-bold uppercase block">Amount to Pay</span>
                          <span className="font-outfit font-black text-brand-600 text-lg">₹{order.advance_amount}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 font-bold uppercase block">PhonePe UPI ID</span>
                          <span className="font-mono font-bold text-stone-800 text-xs">
                            {settings?.phonepe_upi_id || '7827423777@ybl'}
                          </span>
                        </div>
                      </div>

                      {/* PhonePe QR Image */}
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-200 max-w-[200px] mx-auto">
                        <img
                          src={settings?.phonepe_qr_url || '/phonepe-qr.png'}
                          alt="PhonePe QR Code"
                          className="w-40 h-40 object-contain mx-auto rounded-lg"
                        />
                        <span className="text-[10px] font-bold text-stone-500 uppercase mt-1 block">
                          Scan with PhonePe App
                        </span>
                      </div>

                      {/* Payment Reference Form */}
                      <form onSubmit={handlePaymentSubmit} className="space-y-2">
                        <label className="text-[11px] font-bold text-stone-700 block">
                          Payment Reference / Transaction ID:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            placeholder="e.g. 425619283746"
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold uppercase text-stone-900 focus:outline-hidden focus:border-brand-500"
                          />
                          <button
                            type="submit"
                            disabled={submittingPayment}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 shadow-xs"
                          >
                            {submittingPayment ? 'Submitting...' : 'I Paid / Submit'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* If REJECTED, show instant call/WhatsApp prompts */}
                  {order.payment_status === 'REJECTED' && (
                    <div className="pt-2 border-t border-red-200 flex gap-2">
                      <a
                        href="tel:7827423777"
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-900 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        Call 7827423777
                      </a>
                      <a
                        href={`https://wa.me/917827423777?text=${encodeURIComponent(
                          `Hello Variety Momo, my payment verification failed for order ${order.order_number}. Please assist.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp Support
                      </a>
                    </div>
                  )}

                  {paymentSuccessMsg && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-1">{paymentSuccessMsg}</p>
                  )}
                </div>
              )}

              {/* ORDER ITEMS SNAPSHOT (Requirement 2) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Ordered Items ({items.length})
                </h4>
                <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl p-3 border border-stone-200/60 text-xs">
                  {items.map((item) => (
                    <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-stone-900">{item.name}</span>
                        <div className="text-[11px] text-stone-500 font-medium">
                          ₹{item.unit_price} × {item.quantity}
                        </div>
                      </div>
                      <span className="font-outfit font-black text-stone-900 text-sm">
                        ₹{item.line_total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINANCIAL BREAKDOWN & ADVANCE/COD (Requirements 2 & 5) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Food Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">
                    {order.delivery_charge === 0 ? (
                      <span className="text-emerald-600 font-bold">₹0 (Dine-In)</span>
                    ) : (
                      `₹${order.delivery_charge}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-outfit font-black text-stone-900">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-600">₹{order.grand_total}</span>
                </div>

                {!isDineIn && (
                  <div className="pt-2 border-t border-dashed border-stone-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>30% Advance Required:</span>
                      <span>₹{order.advance_amount}</span>
                    </div>
                    <div className="flex justify-between text-stone-800 font-bold">
                      <span>70% Remaining COD:</span>
                      <span>₹{order.cod_amount}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address Details */}
              {!isDineIn && order.address && (
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 text-xs space-y-1">
                  <div className="font-bold text-stone-900">Delivery Address:</div>
                  <div className="text-stone-600">
                    {order.address.address_line}, {order.address.area}
                    {order.address.landmark ? ` (Near ${order.address.landmark})` : ''}, {order.address.city || 'Mecheda'}
                    {order.address.pincode ? ` - ${order.address.pincode}` : ''}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Support Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center gap-2 shrink-0 pb-safe">
          <a
            href="tel:7827423777"
            className="flex-1 py-3 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Restaurant</span>
          </a>

          <a
            href={`https://wa.me/917827423777?text=${encodeURIComponent(
              `Hello Variety Momo, I am inquiring about my order ${order?.order_number || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
