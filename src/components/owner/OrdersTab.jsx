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
  ChevronRight,
  ArrowRight,
  RotateCcw,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  getOwnerOrders,
  getOwnerOrderDetails,
  updateOrderStatus,
  cancelOrder
} from '../../services/restaurantService';

export default function OrdersTab({ onSelectTab, initialOrderId = null }) {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Selected Order for Details Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOwnerOrders({
        status: statusFilter,
        orderType: typeFilter,
        search: searchQuery,
        limit: pageSize,
        offset: page * pageSize
      });
      setOrders(res.orders);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (initialOrderId) {
      handleOpenDetails(initialOrderId);
    }
  }, [initialOrderId]);

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

  // Status transitions
  const handleStatusTransition = async (newStatus, note = '') => {
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      await updateOrderStatus({
        orderId: selectedOrderId,
        newStatus,
        note
      });
      // Refresh details and order list
      const updated = await getOwnerOrderDetails(selectedOrderId);
      setOrderDetails(updated);
      loadOrders();
    } catch (err) {
      console.error('Status transition error:', err);
      alert(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order
  const handleConfirmCancel = async () => {
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      await cancelOrder({
        orderId: selectedOrderId,
        reason: cancellationReason || 'Cancelled by restaurant owner'
      });
      setShowCancelModal(false);
      setCancellationReason('');
      const updated = await getOwnerOrderDetails(selectedOrderId);
      setOrderDetails(updated);
      loadOrders();
    } catch (err) {
      console.error('Cancel order error:', err);
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

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

  return (
    <div className="space-y-5">
      {/* Header and Filter Controls */}
      <div className="bg-stone-900/70 p-4 rounded-2xl border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Order Management
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Showing {orders.length} of {totalCount} total orders in database.
            </p>
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

        {/* Order Type Toggle Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-800/80">
          <span className="text-[11px] font-semibold text-stone-400 mr-1">Type:</span>
          {['ALL', 'DINE_IN', 'HOME_DELIVERY'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === t
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t === 'DINE_IN' ? 'Dine-In' : 'Home Delivery'}
            </button>
          ))}
        </div>

        {/* Status Filter Horizontal Scrolling Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-[11px] font-semibold text-stone-400 mr-1 shrink-0">Status:</span>
          {[
            'ALL',
            'PENDING',
            'PAYMENT_VERIFICATION',
            'PAYMENT_VERIFIED',
            'ACCEPTED',
            'PREPARING',
            'READY',
            'OUT_FOR_DELIVERY',
            'SERVED',
            'COMPLETED',
            'CANCELLED'
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading order records...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No orders found.</p>
          <p className="text-xs text-stone-500 mt-1">Try changing your search terms or status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {orders.map((order) => {
            const isDineIn = order.order_type === 'DINE_IN';
            return (
              <div
                key={order.id}
                className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 hover:border-stone-700 transition-all flex flex-col justify-between"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit font-black text-white text-base tracking-tight">
                        {order.order_number}
                      </span>
                      {isDineIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-bold border border-amber-500/20">
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>Table {order.tables?.table_number || 'N/A'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                          <Truck className="w-3 h-3" />
                          <span>Delivery</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      <span>{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.order_status)}
                    <span className="text-[10px] text-stone-400">
                      Payment: <strong className="text-white">{order.payment_status}</strong>
                    </span>
                  </div>
                </div>

                {/* Customer & Location */}
                <div className="py-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{order.customer_name}</span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </a>
                  </div>

                  {!isDineIn && order.customer_addresses && (
                    <div className="flex items-start gap-1.5 text-[11px] text-stone-400">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {order.customer_addresses.address_line}, {order.customer_addresses.area} ({order.customer_addresses.pincode})
                      </span>
                    </div>
                  )}

                  {/* Items summary */}
                  <div className="pt-2 text-[11px] text-stone-300 border-t border-stone-800/40">
                    <div className="line-clamp-2">
                      {order.order_items?.map((it) => `${it.quantity}x ${it.item_name_snapshot}`).join(', ') || 'No item details'}
                    </div>
                  </div>
                </div>

                {/* Order Footer & Price */}
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-stone-400">Grand Total</div>
                    <div className="text-base font-outfit font-black text-brand-400">
                      ₹{order.grand_total}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetails(order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
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
        <div className="flex items-center justify-between pt-3 text-xs text-stone-400">
          <span>
            Page {page + 1} of {Math.ceil(totalCount / pageSize)}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
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
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-outfit font-black text-xl sm:text-2xl text-white">
                        Order #{orderDetails.order_number}
                      </h2>
                      {getStatusBadge(orderDetails.order_status)}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Placed on {new Date(orderDetails.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Section */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Customer Information
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white">{orderDetails.customer_name}</div>
                      <div className="text-xs text-stone-400">Customer</div>
                    </div>
                    <a
                      href={`tel:${orderDetails.customer_phone}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 self-start sm:self-auto"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{orderDetails.customer_phone}</span>
                    </a>
                  </div>
                </div>

                {/* Service Type Section */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Service Specifics
                  </div>
                  {orderDetails.order_type === 'DINE_IN' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          Table Number: {orderDetails.tables?.table_number || 'N/A'}
                        </div>
                        <p className="text-xs text-stone-400">
                          Dine-in service. Billing settlement is completed at counter.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <Truck className="w-4 h-4" />
                        <span>Home Delivery — Mecheda</span>
                      </div>
                      {orderDetails.customer_addresses && (
                        <div className="text-xs text-stone-300 pl-6 space-y-0.5">
                          <p className="font-semibold text-white">{orderDetails.customer_addresses.address_line}</p>
                          <p>{orderDetails.customer_addresses.area}, {orderDetails.customer_addresses.city} - {orderDetails.customer_addresses.pincode}</p>
                          {orderDetails.customer_addresses.landmark && (
                            <p className="text-stone-400">Landmark: {orderDetails.customer_addresses.landmark}</p>
                          )}
                          {orderDetails.customer_addresses.delivery_zones && (
                            <p className="text-brand-400">Zone: {orderDetails.customer_addresses.delivery_zones.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {orderDetails.special_instructions && (
                    <div className="mt-2 pt-2 border-t border-stone-800 text-xs text-stone-300">
                      <span className="font-semibold text-stone-400">Note from customer:</span> "{orderDetails.special_instructions}"
                    </div>
                  )}
                </div>

                {/* Ordered Items List */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-3">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Ordered Dishes Snapshot
                  </div>
                  <div className="divide-y divide-stone-800">
                    {orderDetails.order_items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white">{item.item_name_snapshot}</div>
                          <div className="text-stone-400 text-[11px]">
                            {item.quantity} × ₹{item.unit_price_snapshot}
                          </div>
                        </div>
                        <div className="font-bold text-stone-200">
                          ₹{item.line_total}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals Breakdown */}
                  <div className="pt-3 border-t border-stone-800 text-xs space-y-1">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal:</span>
                      <span>₹{orderDetails.subtotal}</span>
                    </div>
                    {orderDetails.order_type === 'HOME_DELIVERY' && (
                      <div className="flex justify-between text-stone-400">
                        <span>Delivery Charge:</span>
                        <span>₹{orderDetails.delivery_charge}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-stone-800">
                      <span>Grand Total:</span>
                      <span className="text-brand-400">₹{orderDetails.grand_total}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown Section */}
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Payment Breakdown
                  </div>
                  {orderDetails.order_type === 'HOME_DELIVERY' ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[11px] text-stone-400 block">PhonePe Advance (30%)</span>
                        <span className="font-bold text-white text-sm">₹{orderDetails.advance_amount}</span>
                        <span className="text-[10px] text-teal-400 block mt-0.5">
                          Status: {orderDetails.payment_status}
                        </span>
                      </div>
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[11px] text-stone-400 block">COD at Doorstep (70%)</span>
                        <span className="font-bold text-white text-sm">₹{orderDetails.cod_amount}</span>
                        <span className="text-[10px] text-amber-400 block mt-0.5">Pay on delivery</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">
                      Dine-in counter billing: Customer will pay total of ₹{orderDetails.grand_total} directly at cashier counter.
                    </p>
                  )}

                  {orderDetails.payment_reference && (
                    <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                      <span className="text-stone-400">Customer Payment Reference / UTR: </span>
                      <strong className="text-brand-300 font-mono">{orderDetails.payment_reference}</strong>
                    </div>
                  )}
                </div>

                {/* Status Timeline History */}
                {orderDetails.order_status_history && orderDetails.order_status_history.length > 0 && (
                  <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-2">
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Order Lifecycle History
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-brand-500/40 text-xs">
                      {orderDetails.order_status_history.map((hist) => (
                        <div key={hist.id} className="relative pl-3">
                          <div className="font-semibold text-stone-200">
                            {hist.new_status.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {new Date(hist.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            {hist.note ? ` — ${hist.note}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OWNER STATUS TRANSITION ACTIONS (Requirement 11, 12, 13) */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-brand-500/30 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Workflow Actions
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* DINE-IN WORKFLOW: PENDING -> ACCEPTED -> PREPARING -> READY -> SERVED -> COMPLETED */}
                    {orderDetails.order_type === 'DINE_IN' && (
                      <>
                        {orderDetails.order_status === 'PENDING' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('ACCEPTED', 'Accepted by kitchen')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Accept Order
                          </button>
                        )}
                        {orderDetails.order_status === 'ACCEPTED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('PREPARING', 'Food being prepared in kitchen')}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {orderDetails.order_status === 'PREPARING' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('READY', 'Food ready at pickup counter')}
                            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Mark Ready
                          </button>
                        )}
                        {orderDetails.order_status === 'READY' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('SERVED', 'Served to table. Pay bill at counter.')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Mark Served
                          </button>
                        )}
                        {orderDetails.order_status === 'SERVED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('COMPLETED', 'Bill paid at counter and order completed')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Complete Order (Bill Paid)
                          </button>
                        )}
                      </>
                    )}

                    {/* HOME DELIVERY WORKFLOW: PENDING/PAYMENT_SUBMITTED -> PAYMENT_VERIFIED -> ACCEPTED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> COMPLETED */}
                    {orderDetails.order_type === 'HOME_DELIVERY' && (
                      <>
                        {orderDetails.payment_status === 'SUBMITTED' && (
                          <button
                            onClick={() => {
                              setSelectedOrderId(null);
                              onSelectTab('payments');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Go to Payment Verification Queue
                          </button>
                        )}

                        {orderDetails.payment_status === 'VERIFIED' && orderDetails.order_status === 'PAYMENT_VERIFIED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('ACCEPTED', 'Order accepted after payment verification')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Accept Order
                          </button>
                        )}

                        {orderDetails.order_status === 'ACCEPTED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('PREPARING', 'Food being cooked')}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Mark Preparing
                          </button>
                        )}

                        {orderDetails.order_status === 'PREPARING' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('READY', 'Food packaged and ready for dispatch')}
                            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Mark Ready
                          </button>
                        )}

                        {orderDetails.order_status === 'READY' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('OUT_FOR_DELIVERY', 'Dispatched with delivery rider')}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Dispatch Out For Delivery
                          </button>
                        )}

                        {orderDetails.order_status === 'OUT_FOR_DELIVERY' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusTransition('COMPLETED', 'Delivered and COD collected')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                          >
                            Complete Order (Delivered & COD Collected)
                          </button>
                        )}
                      </>
                    )}

                    {/* Cancellation Button (Only if not already finished) */}
                    {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(orderDetails.order_status) && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-red-950/60 text-red-300 hover:text-red-200 text-xs font-bold border border-red-500/30 transition-all ml-auto"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-outfit font-extrabold text-lg text-white">
                Cancel Order Confirmation
              </h3>
            </div>

            <p className="text-xs text-stone-300">
              Are you sure you want to cancel this order? This action will update the status to CANCELLED and log an audit record.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Customer requested cancellation, out of stock, etc."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
              >
                Go Back
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
