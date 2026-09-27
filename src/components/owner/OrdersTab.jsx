import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Phone,
  MapPin,
  UtensilsCrossed,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  X,
  RotateCcw,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Loader2,
  Flame,
  Check,
  CreditCard,
  RefreshCw,
  ChefHat,
  Bike
} from 'lucide-react';
import {
  getOwnerOrders,
  getOwnerOrderDetails,
  updateOrderStatus,
  cancelOrder,
  getOwnerDashboardStats,
  verifyOrderPayment,
  rejectOrderPayment,
  subscribeToOwnerEvents
} from '../../services/restaurantService';

export default function OrdersTab({ onSelectTab, initialOrderId = null }) {
  // Orders State
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Stats State (8 Key Cards)
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Selected Order for Details Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection / Cancellation Modal
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Payment Rejection Modal
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState('');

  // 1. Load Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getOwnerDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn('Failed to load dashboard stats in OrdersTab:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 2. Load Orders based on filters
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let statusParam = 'ALL';
      let typeParam = 'ALL';

      if (activeFilter === 'HOME_DELIVERY') {
        typeParam = 'HOME_DELIVERY';
      } else if (activeFilter === 'DINE_IN') {
        typeParam = 'DINE_IN';
      } else if (activeFilter === 'PAYMENT_VERIFICATION') {
        statusParam = 'PAYMENT_VERIFICATION';
      } else if (activeFilter !== 'ALL') {
        statusParam = activeFilter;
      }

      const res = await getOwnerOrders({
        status: statusParam,
        orderType: typeParam,
        search: searchQuery,
        limit: pageSize,
        offset: page * pageSize
      });

      setOrders(res.orders || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery, page]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadOrders();
  }, [loadStats, loadOrders]);

  // Handle initialOrderId prop if passed (e.g. from notification click)
  useEffect(() => {
    if (initialOrderId) {
      handleOpenDetails(initialOrderId);
    }
  }, [initialOrderId]);

  // 3. Supabase Realtime Subscription for instant live orders & stats
  useEffect(() => {
    const cleanup = subscribeToOwnerEvents({
      onNewOrder: () => {
        loadOrders();
        loadStats();
      },
      onOrderUpdate: () => {
        loadOrders();
        loadStats();
      },
      onPaymentSubmitted: () => {
        loadOrders();
        loadStats();
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [loadOrders, loadStats]);

  // Open Details Modal
  const handleOpenDetails = async (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsLoading(true);
    try {
      const details = await getOwnerOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err) {
      console.error('Failed to load order details:', err);
      alert('Failed to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // 4. One-Tap Order Status Transitions directly from cards
  const handleDirectTransition = async (orderId, newStatus, note = '') => {
    setActionLoadingId(orderId);
    try {
      await updateOrderStatus({
        orderId,
        newStatus,
        note
      });
      // Refresh list, stats, and modal if open
      await Promise.all([loadOrders(), loadStats()]);
      if (selectedOrderId === orderId) {
        const updated = await getOwnerOrderDetails(orderId);
        setOrderDetails(updated);
      }
    } catch (err) {
      console.error('Order status transition error:', err);
      alert(err.message || 'Failed to update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Order Reject
  const handleConfirmOrderReject = async () => {
    if (!rejectingOrder) return;
    setActionLoadingId(rejectingOrder.id);
    try {
      await cancelOrder({
        orderId: rejectingOrder.id,
        reason: rejectReason.trim() || 'Rejected by restaurant kitchen'
      });
      setRejectingOrder(null);
      setRejectReason('');
      await Promise.all([loadOrders(), loadStats()]);
      if (selectedOrderId === rejectingOrder.id) {
        setSelectedOrderId(null);
      }
    } catch (err) {
      console.error('Reject order error:', err);
      alert(err.message || 'Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Payment Verification Direct Actions
  const handleDirectVerifyPayment = async (order) => {
    const payment = order.payments?.[0];
    if (!payment) {
      alert('No payment record found for this order.');
      return;
    }
    setActionLoadingId(order.id);
    try {
      await verifyOrderPayment({
        paymentId: payment.id,
        orderId: order.id,
        note: `Advance payment verified for order #${order.order_number}`
      });
      await Promise.all([loadOrders(), loadStats()]);
      if (selectedOrderId === order.id) {
        const updated = await getOwnerOrderDetails(order.id);
        setOrderDetails(updated);
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      alert(err.message || 'Failed to verify payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectingPayment) return;
    const payment = rejectingPayment.payments?.[0];
    if (!payment) return;

    setActionLoadingId(rejectingPayment.id);
    try {
      await rejectOrderPayment({
        paymentId: payment.id,
        orderId: rejectingPayment.id,
        reason: paymentRejectReason.trim() || 'UTR / Transaction reference invalid'
      });
      setRejectingPayment(null);
      setPaymentRejectReason('');
      await Promise.all([loadOrders(), loadStats()]);
      if (selectedOrderId === rejectingPayment.id) {
        const updated = await getOwnerOrderDetails(rejectingPayment.id);
        setOrderDetails(updated);
      }
    } catch (err) {
      console.error('Reject payment error:', err);
      alert(err.message || 'Failed to reject payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      case 'PAYMENT_SUBMITTED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">Payment Submitted</span>;
      case 'PAYMENT_VERIFIED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">Payment Verified</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Accepted</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Preparing</span>;
      case 'READY':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Ready</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Out For Delivery</span>;
      case 'SERVED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Served</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completed</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">{status}</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-stone-800 text-stone-300">{status}</span>;
    }
  };

  // Helper format time
  const formatOrderTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          1. TOP SUMMARY METRIC CARDS (Requirement 20)
          TODAY'S ORDERS, HOME DELIVERY, DINE-IN, PENDING,
          PREPARING, READY, COMPLETED, PAYMENT VERIFICATION
         ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Order Performance Overview
          </h2>
          <button
            onClick={() => {
              loadStats();
              loadOrders();
            }}
            disabled={statsLoading}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Today's Orders */}
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
              activeFilter === 'ALL'
                ? 'bg-brand-500/15 border-brand-500/40 ring-1 ring-brand-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
              <ShoppingBag className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div className="text-xl font-outfit font-black text-white">
              {stats?.today_orders ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Total Orders</div>
          </button>

          {/* 2. Home Delivery */}
          <button
            onClick={() => {
              setActiveFilter('HOME_DELIVERY');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'HOME_DELIVERY'
                ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Delivery</span>
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-outfit font-black text-white">
              {stats?.home_delivery_orders ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Home Delivery</div>
          </button>

          {/* 3. Dine-In */}
          <button
            onClick={() => {
              setActiveFilter('DINE_IN');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'DINE_IN'
                ? 'bg-blue-500/15 border-blue-500/40 ring-1 ring-blue-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Dine-In</span>
              <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-outfit font-black text-white">
              {stats?.dine_in_orders ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Dine-In Tables</div>
          </button>

          {/* 4. Pending */}
          <button
            onClick={() => {
              setActiveFilter('PENDING');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'PENDING'
                ? 'bg-amber-500/20 border-amber-500/50 ring-1 ring-amber-500/40'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-outfit font-black text-amber-300">
              {stats?.pending_orders ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Needs Action</div>
          </button>

          {/* 5. Preparing */}
          <button
            onClick={() => {
              setActiveFilter('PREPARING');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'PREPARING'
                ? 'bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Kitchen</span>
              <Flame className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-outfit font-black text-purple-300">
              {stats?.preparing ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Preparing</div>
          </button>

          {/* 6. Ready */}
          <button
            onClick={() => {
              setActiveFilter('READY');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'READY'
                ? 'bg-cyan-500/15 border-cyan-500/40 ring-1 ring-cyan-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ready</span>
              <Check className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-outfit font-black text-cyan-300">
              {stats?.ready ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Serve / Dispatch</div>
          </button>

          {/* 7. Completed */}
          <button
            onClick={() => {
              setActiveFilter('COMPLETED');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeFilter === 'COMPLETED'
                ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-outfit font-black text-emerald-400">
              {stats?.completed ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Completed</div>
          </button>

          {/* 8. Payment Verification */}
          <button
            onClick={() => {
              setActiveFilter('PAYMENT_VERIFICATION');
              setPage(0);
            }}
            className={`p-3 rounded-2xl border text-left transition-all relative ${
              activeFilter === 'PAYMENT_VERIFICATION'
                ? 'bg-rose-500/20 border-rose-500/50 ring-1 ring-rose-500/40'
                : (stats?.payment_verification ?? 0) > 0
                ? 'bg-rose-950/40 border-rose-800/80 hover:border-rose-700 animate-pulse'
                : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Verify</span>
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-outfit font-black text-rose-400">
              {stats?.payment_verification ?? 0}
            </div>
            <div className="text-[10px] text-stone-400 truncate mt-0.5">Payments</div>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. FILTER BAR & SEARCH (Requirement 26)
          ALL, HOME DELIVERY, DINE-IN, PENDING, PREPARING,
          READY, COMPLETED, PAYMENT VERIFICATION
         ======================================================== */}
      <div className="bg-stone-900/80 p-4 rounded-2xl border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="font-outfit font-black text-white text-lg tracking-tight">
              LIVE ORDERS
            </h2>
            <span className="text-xs text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-lg border border-stone-700">
              {totalCount} orders
            </span>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order # or Phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 bg-stone-950 text-white placeholder-stone-500 text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'HOME_DELIVERY', label: '🛵 Home Delivery' },
            { id: 'DINE_IN', label: '🍽️ Dine-In' },
            { id: 'PENDING', label: '⏳ Pending' },
            { id: 'PREPARING', label: '🔥 Preparing' },
            { id: 'READY', label: '🥟 Ready' },
            { id: 'COMPLETED', label: '✅ Completed' },
            { id: 'PAYMENT_VERIFICATION', label: '💳 Payment Verification' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-900/30'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. LIVE ORDER QUEUE (Requirements 21, 22, 23, 24, 25)
         ======================================================== */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading live orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-stone-800">
          <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <p className="text-base font-bold text-stone-200">No matching orders found</p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {activeFilter !== 'ALL'
              ? `There are currently no orders in "${activeFilter.replace(/_/g, ' ')}" status.`
              : 'New orders placed by customers will appear here instantly in realtime.'}
          </p>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => setActiveFilter('ALL')}
              className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold"
            >
              Show All Orders
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const isDineIn = order.order_type === 'DINE_IN';
            const isProcessingThis = actionLoadingId === order.id;
            const needsPaymentVerification = order.payment_status === 'SUBMITTED';

            return (
              <div
                key={order.id}
                className={`bg-stone-900/95 rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-lg ${
                  needsPaymentVerification
                    ? 'border-rose-500/50 ring-1 ring-rose-500/30'
                    : order.order_status === 'PENDING'
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Header: Order Number, Type, Time & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-outfit font-black text-white text-lg tracking-tight">
                          {order.order_number}
                        </span>
                        {isDineIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/25">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>Table {order.tables?.table_number || 'N/A'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/25">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Home Delivery</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>{formatOrderTime(order.created_at)}</span>
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.order_status)}
                    </div>
                  </div>

                  {/* Customer Information & Address */}
                  <div className="py-3 border-b border-stone-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{order.customer_name}</span>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customer_phone}</span>
                      </a>
                    </div>

                    {!isDineIn && order.customer_addresses && (
                      <div className="flex items-start gap-1.5 text-stone-400 text-[11px] bg-stone-950/60 p-2 rounded-xl border border-stone-800/80">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {order.customer_addresses.address_line}, {order.customer_addresses.area}
                          {order.customer_addresses.delivery_zones?.name ? ` (${order.customer_addresses.delivery_zones.name})` : ''}
                        </span>
                      </div>
                    )}

                    {/* Order Food Items Summary */}
                    <div className="pt-2 text-stone-300 text-xs">
                      <div className="font-semibold text-[11px] text-stone-400 uppercase tracking-wider mb-1">
                        Items ({order.order_items?.length || 0})
                      </div>
                      <div className="space-y-0.5">
                        {order.order_items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-stone-200">
                            <span>
                              <strong className="text-brand-400">{it.quantity}x</strong> {it.item_name_snapshot}
                            </span>
                            <span className="text-stone-400">₹{it.line_total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Payment Details */}
                  <div className="py-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 text-[11px]">Grand Total</span>
                      <span className="text-base font-outfit font-black text-brand-400">
                        ₹{order.grand_total}
                      </span>
                    </div>

                    {!isDineIn && (
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>Advance: ₹{order.advance_amount}</span>
                        <span>Remaining COD: ₹{order.cod_amount}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-stone-400">Payment Status</span>
                      <span className={`font-bold ${
                        order.payment_status === 'VERIFIED'
                          ? 'text-emerald-400'
                          : order.payment_status === 'SUBMITTED'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================
                      PAYMENT VERIFICATION CALLOUT (Requirement 25)
                     ======================================================== */}
                  {needsPaymentVerification && (
                    <div className="my-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Advance Payment Verification Required</span>
                      </div>
                      <div className="text-[11px] text-stone-300">
                        Ref / UTR: <strong className="text-white font-mono">{order.payment_reference || order.payments?.[0]?.customer_reference || 'N/A'}</strong>
                        <div className="text-rose-300 font-semibold mt-0.5">Amount: ₹{order.advance_amount}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={isProcessingThis}
                          onClick={() => handleDirectVerifyPayment(order)}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isProcessingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                        <button
                          disabled={isProcessingThis}
                          onClick={() => setRejectingPayment(order)}
                          className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/60 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================
                    ONE-TAP STATUS CONTROLS (Requirements 22, 23, 24)
                   ======================================================== */}
                <div className="pt-3 border-t border-stone-800/80 space-y-2">
                  {/* Status Action Buttons */}
                  {order.order_status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isProcessingThis}
                        onClick={() => handleDirectTransition(order.id, 'ACCEPTED', 'Order accepted by kitchen')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isProcessingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>ACCEPT</span>
                          </>
                        )}
                      </button>
                      <button
                        disabled={isProcessingThis}
                        onClick={() => setRejectingOrder(order)}
                        className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-red-900/50 text-red-400 hover:text-white border border-red-800/60 text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  )}

                  {order.order_status === 'ACCEPTED' && (
                    <button
                      disabled={isProcessingThis}
                      onClick={() => handleDirectTransition(order.id, 'PREPARING', 'Momos are steaming in the kitchen')}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all shadow-md shadow-purple-950/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ChefHat className="w-4 h-4" />
                          <span>START PREPARING</span>
                        </>
                      )}
                    </button>
                  )}

                  {order.order_status === 'PREPARING' && (
                    <button
                      disabled={isProcessingThis}
                      onClick={() => handleDirectTransition(order.id, 'READY', 'Order is freshly prepared and ready')}
                      className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold transition-all shadow-md shadow-cyan-950/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>MARK READY</span>
                        </>
                      )}
                    </button>
                  )}

                  {order.order_status === 'READY' && (
                    <div>
                      {isDineIn ? (
                        <button
                          disabled={isProcessingThis}
                          onClick={() => handleDirectTransition(order.id, 'SERVED', 'Order served hot at table')}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-950/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UtensilsCrossed className="w-4 h-4" />
                              <span>MARK SERVED</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled={isProcessingThis}
                          onClick={() => handleDirectTransition(order.id, 'OUT_FOR_DELIVERY', 'Rider is out for delivery')}
                          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-950/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Bike className="w-4 h-4" />
                              <span>OUT FOR DELIVERY</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {(order.order_status === 'SERVED' || order.order_status === 'OUT_FOR_DELIVERY') && (
                    <button
                      disabled={isProcessingThis}
                      onClick={() => handleDirectTransition(order.id, 'COMPLETED', 'Order completed and settled')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>COMPLETE ORDER</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Secondary Details Trigger */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-500">
                      ID: {order.id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => handleOpenDetails(order.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Details & Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-4 text-xs text-stone-400">
          <span>
            Page {page + 1} of {Math.ceil(totalCount / pageSize)}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          4. REJECT ORDER MODAL (Requirement 24)
         ======================================================== */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-outfit font-black text-lg">Reject Order #{rejectingOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setRejectingOrder(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Are you sure you want to reject this order? The customer will receive an alert notification.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Reason for Rejection (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Item Out of Stock', 'Kitchen Too Busy', 'Address Outside Delivery Range'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectReason(r)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason for customer..."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-red-500 h-20"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoadingId === rejectingOrder.id}
                onClick={handleConfirmOrderReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === rejectingOrder.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. REJECT PAYMENT MODAL (Requirement 25)
         ======================================================== */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-outfit font-black text-lg">Reject Payment</h3>
              </div>
              <button
                onClick={() => setRejectingPayment(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              The customer will be notified that their payment reference could not be verified and asked to resubmit.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Rejection Reason
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['UTR not found in merchant bank', 'Incorrect amount received', 'Duplicate UTR reference'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPaymentRejectReason(r)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={paymentRejectReason}
                onChange={(e) => setPaymentRejectReason(e.target.value)}
                placeholder="Reason (e.g. UTR not matching statement)"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionLoadingId === rejectingPayment.id}
                onClick={handleConfirmRejectPayment}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === rejectingPayment.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Reject Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. FULL ORDER DETAILS MODAL
         ======================================================== */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-3xl p-5 sm:p-6 text-white max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
            {detailsLoading || !orderDetails ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-stone-400">Fetching order details...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-stone-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-outfit font-black text-xl text-white">
                        {orderDetails.order_number}
                      </h2>
                      {orderDetails.order_type === 'DINE_IN' ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/25">
                          Dine-In • Table {orderDetails.tables?.table_number || 'N/A'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/25">
                          Home Delivery
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Placed on {new Date(orderDetails.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrderId(null);
                      setOrderDetails(null);
                    }}
                    className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Customer</div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-white">{orderDetails.customer_name}</span>
                    <a
                      href={`tel:${orderDetails.customer_phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{orderDetails.customer_phone}</span>
                    </a>
                  </div>

                  {orderDetails.order_type === 'HOME_DELIVERY' && orderDetails.customer_addresses && (
                    <div className="text-xs text-stone-300 pt-1 border-t border-stone-800/80">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <div>
                          <p>{orderDetails.customer_addresses.address_line}</p>
                          <p className="text-stone-400">
                            {orderDetails.customer_addresses.area}, {orderDetails.customer_addresses.city} - {orderDetails.customer_addresses.pincode}
                          </p>
                          {orderDetails.customer_addresses.landmark && (
                            <p className="text-stone-500 text-[11px]">Landmark: {orderDetails.customer_addresses.landmark}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Ordered Items</div>
                  <div className="space-y-1.5">
                    {orderDetails.order_items?.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{it.item_name_snapshot}</span>
                          <span className="text-stone-400 ml-2">₹{it.unit_price_snapshot} × {it.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-stone-200">₹{it.line_total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Subtotal</span>
                    <span>₹{orderDetails.subtotal}</span>
                  </div>
                  {orderDetails.order_type === 'HOME_DELIVERY' && (
                    <div className="flex justify-between text-stone-400">
                      <span>Delivery Charge</span>
                      <span>₹{orderDetails.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-stone-800">
                    <span>Grand Total</span>
                    <span className="text-brand-400">₹{orderDetails.grand_total}</span>
                  </div>
                  {orderDetails.order_type === 'HOME_DELIVERY' && (
                    <div className="flex justify-between text-[11px] text-stone-400 pt-1">
                      <span>Advance: ₹{orderDetails.advance_amount}</span>
                      <span>Remaining COD: ₹{orderDetails.cod_amount}</span>
                    </div>
                  )}
                </div>

                {/* Status Timeline History */}
                {orderDetails.order_status_history && orderDetails.order_status_history.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Status History</div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {orderDetails.order_status_history.map((h) => (
                        <div key={h.id} className="text-[11px] p-2 rounded-lg bg-stone-950/40 border border-stone-800/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-stone-200">{h.new_status}</span>
                            {h.note && <span className="text-stone-400 ml-2">({h.note})</span>}
                          </div>
                          <span className="text-stone-500 font-mono">
                            {new Date(h.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
