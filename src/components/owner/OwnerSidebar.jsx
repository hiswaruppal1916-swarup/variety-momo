import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Utensils,
  Layers,
  MapPin,
  Settings,
  QrCode,
  Tag,
  Image,
  Star,
  Bell,
  LogOut,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  Truck,
  UtensilsCrossed,
  AlertCircle
} from 'lucide-react';

export default function OwnerSidebar({
  activeTab,
  onSelectTab,
  onLogout,
  onNavigateHome,
  stats,
  unreadCount = 0,
  pendingVerifications = 0,
  isMobileOpen,
  setIsMobileOpen
}) {
  // All 17 Management Links (Requirement 5)
  const navSections = [
    {
      title: 'Orders & Live Operations',
      items: [
        { id: 'overview', label: '1. Dashboard Overview', icon: LayoutDashboard },
        {
          id: 'orders-today',
          tabId: 'orders',
          scope: 'TODAY',
          filter: 'ALL',
          label: "2. Today's Orders",
          icon: Clock,
          badge: stats?.today_orders > 0 ? stats.today_orders : null,
          badgeColor: 'bg-brand-500'
        },
        {
          id: 'orders-all',
          tabId: 'orders',
          scope: 'ALL',
          filter: 'ALL',
          label: '3. All Orders',
          icon: ShoppingBag,
          badge: stats?.all_orders > 0 ? stats.all_orders : null,
          badgeColor: 'bg-stone-700'
        },
        {
          id: 'orders-pending',
          tabId: 'orders',
          scope: 'ALL',
          filter: 'PENDING',
          label: '4. Pending Orders',
          icon: AlertCircle,
          badge: stats?.pending_orders > 0 ? stats.pending_orders : null,
          badgeColor: 'bg-amber-500'
        },
        {
          id: 'orders-delivery',
          tabId: 'orders',
          scope: 'ALL',
          filter: 'HOME_DELIVERY',
          label: '5. Home Delivery Orders',
          icon: Truck,
          badge: stats?.home_delivery_orders > 0 ? stats.home_delivery_orders : null,
          badgeColor: 'bg-emerald-600'
        },
        {
          id: 'orders-dinein',
          tabId: 'orders',
          scope: 'ALL',
          filter: 'DINE_IN',
          label: '6. Dine-In Orders',
          icon: UtensilsCrossed,
          badge: stats?.dine_in_orders > 0 ? stats.dine_in_orders : null,
          badgeColor: 'bg-blue-600'
        },
        {
          id: 'payments',
          label: '7. Payment Verification Queue',
          icon: CreditCard,
          badge: pendingVerifications > 0 ? pendingVerifications : null,
          badgeColor: 'bg-rose-500 animate-pulse'
        }
      ]
    },
    {
      title: 'Menu & Store Setup',
      items: [
        { id: 'menu', label: '8. Menu Management', icon: Utensils },
        { id: 'categories', label: '9. Category Management', icon: Layers },
        { id: 'delivery-zones', label: '10. Delivery Zones & Charges', icon: MapPin },
        { id: 'tables', label: '11. Table QR Management', icon: QrCode },
        { id: 'offers', label: '12. Special Offers & Banners', icon: Tag },
        { id: 'reviews', label: '13. Customer Reviews Moderation', icon: Star },
        {
          id: 'notifications',
          label: '14. Live Notification Center',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : null,
          badgeColor: 'bg-brand-500'
        },
        { id: 'settings', label: '15. Restaurant Settings', icon: Settings }
      ]
    },
    {
      title: 'Store & Session',
      items: [
        { id: 'storefront', label: '16. View Live Customer Site', icon: ExternalLink, isAction: true },
        { id: 'logout', label: '17. Owner Logout', icon: LogOut, isDanger: true, isAction: true }
      ]
    }
  ];

  const handleItemClick = (item) => {
    if (item.id === 'storefront') {
      onNavigateHome();
    } else if (item.id === 'logout') {
      onLogout();
    } else if (item.tabId === 'orders') {
      onSelectTab('orders', null, item.scope || 'TODAY', item.filter || 'ALL');
    } else {
      onSelectTab(item.id);
    }

    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-stone-950 border-r border-stone-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/variety-momo-logo.jpg"
              alt="Variety Momo"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/40"
            />
            <div>
              <div className="font-outfit font-extrabold text-white text-base tracking-tight leading-tight">
                Variety Momo
              </div>
              <div className="flex items-center gap-1 text-[11px] text-brand-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Management</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List - 17 links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.tabId && activeTab === item.tabId);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      item.isDanger
                        ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
                        : isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-stone-300 hover:text-white hover:bg-stone-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${item.isDanger ? 'text-rose-400' : isActive ? 'text-white' : 'text-stone-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full shrink-0 ${item.badgeColor || 'bg-brand-500'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
