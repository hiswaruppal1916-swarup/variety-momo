import React from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Phone,
  Clock,
  KeyRound,
  Bell
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { restaurantInfo } from '../data/restaurantInfo';

// Authentic Official WhatsApp SVG Icon
function WhatsAppIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Header({ onNavigate }) {
  const {
    totalCount,
    openCart,
    openSearch,
    tableContext,
    activeTracking,
    openOrderTracking,
    customerUnreadCount,
    openCustomerNotif
  } = useCart();

  const handleOwnerClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('owner-login');
    } else {
      window.history.pushState({}, '', '/owner-login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs transition-all">
      {/* Top Banner with Location, Call & WhatsApp */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          <span className="truncate font-medium">{restaurantInfo.location}</span>
          <span className="hidden sm:inline text-stone-400">• Hot & Fresh Delivery</span>
        </div>

        {/* Call and WhatsApp Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:7827423777"
            className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors"
            title="Call Variety Momo"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold tracking-wide">7827423777</span>
          </a>

          <a
            href="https://wa.me/917827423777?text=Hello%20Variety%20Momo%2C%20I%20want%20to%20know%20more%20about%20your%20menu%2Forder."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Name (Enlarged & Sharp as requested in Requirement 9) */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
        >
          <img
            src="/variety-momo-logo.jpg"
            alt="Variety Momo Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl object-cover shadow-sm ring-1 ring-stone-200/80 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-outfit font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight text-stone-900 leading-none">
                VARIETY <span className="text-brand-600">MOMO</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 font-medium tracking-wider mt-0.5">
              MECHEDA'S FAVOURITE
            </p>
          </div>
        </a>

        {/* Center Indicators: Active Table QR or Live Tracking */}
        <div className="flex items-center gap-2">
          {tableContext && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] sm:text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dine-In • Table {tableContext.table_number}</span>
            </div>
          )}

          {activeTracking && (
            <button
              onClick={() => openOrderTracking()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Track {activeTracking.orderNumber}</span>
            </button>
          )}
        </div>

        {/* Right Actions: Search, Cart & Owner Button (Requirement 8) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            onClick={openSearch}
            className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-stone-100 text-stone-700 flex items-center gap-1.5 transition-colors"
            aria-label="Search dishes"
          >
            <Search className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-medium text-stone-500">Search</span>
          </button>

          {/* Customer Notification Bell (Requirement 9 & 31) */}
          <button
            onClick={openCustomerNotif}
            className="relative p-2 sm:px-2.5 sm:py-2 rounded-full hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors"
            title="Notifications"
            aria-label="Customer notifications"
          >
            <Bell className="w-5 h-5 text-stone-700" />
            {customerUnreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-brand-600 text-white font-outfit text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {customerUnreadCount}
              </span>
            )}
          </button>

          {/* Cart Icon with Counter */}
          <button
            onClick={openCart}
            className="relative p-2 sm:px-3 sm:py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-bold">Cart</span>
            {totalCount > 0 && (
              <span className="bg-white text-brand-600 font-outfit text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalCount}
              </span>
            )}
          </button>

          {/* Owner Dashboard Top-Bar Button (Requirement 8) */}
          <a
            href="/owner-login"
            onClick={handleOwnerClick}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200/90 text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-all active:scale-95"
            title="Owner Management Portal"
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline text-xs font-bold text-stone-700">Owner</span>
          </a>
        </div>
      </div>
    </header>
  );
}
