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
  ShieldCheck
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
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: stats?.pending_orders > 0 ? stats.pending_orders : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: pendingVerifications > 0 ? pendingVerifications : null,
      badgeColor: 'bg-rose-500 animate-pulse'
    },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'delivery-zones', label: 'Delivery Zones', icon: MapPin },
    { id: 'tables', label: 'Tables', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'reviews', label: 'Reviews', icon: Star },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-brand-500'
    }
  ];

  const handleItemClick = (id) => {
    onSelectTab(id);
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
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
                <span>Owner Portal</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor || 'bg-brand-500'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-stone-800 space-y-1">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-stone-500" />
            <span>View Public Storefront</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout Owner</span>
          </button>
        </div>
      </aside>
    </>
  );
}
