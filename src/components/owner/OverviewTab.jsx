import React from 'react';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CreditCard,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  XCircle,
  UtensilsCrossed,
  Truck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function OverviewTab({
  stats,
  loading,
  onRefresh,
  onSelectTab
}) {
  const safeStats = stats || {
    today_orders: 0,
    today_revenue: 0,
    pending_orders: 0,
    payment_verification_required: 0,
    accepted_orders: 0,
    preparing_orders: 0,
    ready_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    dinein_orders: 0,
    homedelivery_orders: 0
  };

  const statCards = [
    {
      title: "Today's Orders",
      value: safeStats.today_orders,
      icon: ShoppingBag,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: "Today's Revenue",
      value: `₹${Number(safeStats.today_revenue || 0).toLocaleString('en-IN')}`,
      subtitle: 'Valid non-cancelled orders',
      icon: IndianRupee,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Payment Verification',
      value: safeStats.payment_verification_required,
      subtitle: 'PhonePe QR submissions',
      icon: CreditCard,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      action: () => onSelectTab('payments'),
      actionText: 'Verify Payments',
      highlight: safeStats.payment_verification_required > 0
    },
    {
      title: 'Pending Orders',
      value: safeStats.pending_orders,
      subtitle: 'Awaiting acceptance',
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      action: () => onSelectTab('orders')
    },
    {
      title: 'Accepted Orders',
      value: safeStats.accepted_orders,
      icon: CheckCircle2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Preparing in Kitchen',
      value: safeStats.preparing_orders,
      icon: ChefHat,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Ready for Pickup / Delivery',
      value: safeStats.ready_orders,
      icon: PackageCheck,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20'
    },
    {
      title: 'Completed Orders',
      value: safeStats.completed_orders,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Cancelled / Rejected',
      value: safeStats.cancelled_orders,
      icon: XCircle,
      color: 'text-stone-400',
      bgColor: 'bg-stone-800/40',
      borderColor: 'border-stone-700/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div>
          <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
            Live Business Overview
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Realtime statistics calculated directly from Supabase database records.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* High Alert: Pending Payment Verifications Banner */}
      {safeStats.payment_verification_required > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/40">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {safeStats.payment_verification_required} PhonePe Payment Verification Required
              </div>
              <p className="text-xs text-rose-200">
                Customers have submitted UTR / transaction references for advance payments. Please verify before accepting orders.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('payments')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto shrink-0 active:scale-95"
          >
            <span>Review Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${card.bgColor} ${card.borderColor} flex flex-col justify-between transition-all ${
                card.highlight ? 'ring-2 ring-rose-500/50 shadow-lg' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-stone-300 line-clamp-1">{card.title}</span>
                <div className={`p-2 rounded-xl bg-stone-900/60 border border-stone-800 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-outfit font-black text-white tracking-tight">
                  {card.value}
                </div>
                {card.subtitle && (
                  <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                    {card.subtitle}
                  </p>
                )}
              </div>

              {card.actionText && (
                <button
                  onClick={card.action}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Type Breakdown: Dine-In vs Home Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dine-In Card */}
        <div className="bg-stone-900/80 p-5 rounded-2xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Dine-In Service
              </div>
              <div className="text-2xl font-outfit font-black text-white">
                {safeStats.dinein_orders} Orders
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Served at restaurant tables with counter bill settlement.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('orders')}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title="View Dine-In Orders"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Home Delivery Card */}
        <div className="bg-stone-900/80 p-5 rounded-2xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Home Delivery
              </div>
              <div className="text-2xl font-outfit font-black text-white">
                {safeStats.homedelivery_orders} Orders
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Mecheda local deliveries with PhonePe advance + COD.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('orders')}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title="View Delivery Orders"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
        <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
          Quick Management Shortcuts
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectTab('payments')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-rose-400" />
            <span>Payment Queue</span>
          </button>
          <button
            onClick={() => onSelectTab('orders')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage Orders</span>
          </button>
          <button
            onClick={() => onSelectTab('menu')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all flex items-center gap-1.5"
          >
            <ChefHat className="w-3.5 h-3.5 text-brand-400" />
            <span>Food & Availability</span>
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all flex items-center gap-1.5"
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivery & QR Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
