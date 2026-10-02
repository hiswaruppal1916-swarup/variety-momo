import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Phone,
  Clock,
  KeyRound,
  Bell,
  Download,
  Menu,
  X,
  Utensils,
  Tag,
  Image as ImageIcon,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePwa } from '../context/PwaContext';
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

  const { isStandalone, installApp } = usePwa();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const handleOpenHamburger = () => {
    window.history.pushState({ varietyModal: 'hamburger-menu' }, '');
    setIsHamburgerOpen(true);
  };

  const handleCloseHamburger = () => {
    if (window.history.state?.varietyModal === 'hamburger-menu') {
      window.history.back();
    } else {
      setIsHamburgerOpen(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isHamburgerOpen) {
        setIsHamburgerOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isHamburgerOpen]);

  const handleOwnerClick = (e) => {
    e.preventDefault();
    handleCloseHamburger();
    if (onNavigate) {
      onNavigate('owner-login');
    } else {
      window.history.pushState({}, '', '/owner-login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const scrollToSection = (id) => {
    handleCloseHamburger();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs transition-all">
        {/* Top Banner with Location, Call, WhatsApp & Fast Info */}
        <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate font-medium">{restaurantInfo.location}</span>
            <span className="hidden sm:inline text-stone-400">• Hot & Fresh Delivery</span>
          </div>

          {/* Call, WhatsApp & Install App Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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

            {/* Quick Top Bar Install App (Only if not already running standalone) */}
            {!isStandalone && (
              <button
                onClick={installApp}
                className="flex items-center gap-1 text-rose-300 hover:text-white transition-colors font-semibold pl-1 border-l border-stone-700"
                title="Install Variety Momo App"
              >
                <Download className="w-3 h-3 text-rose-400" />
                <span className="text-[11px]">Install</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Header Bar: Logo | Notification/Bell | Hamburger Menu */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 sm:gap-3 group shrink min-w-0"
            aria-label="Variety Momo Home"
          >
            <img
              src="/variety-momo-logo.jpg"
              alt="Variety Momo Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl object-cover shadow-sm ring-1 ring-stone-200/80 group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1">
                <span className="font-outfit font-extrabold text-base sm:text-xl md:text-2xl tracking-tight text-stone-900 leading-none truncate">
                  VARIETY <span className="text-brand-600">MOMO</span>
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-stone-500 font-medium tracking-wider mt-0.5 truncate">
                MECHEDA'S FAVOURITE
              </p>
            </div>
          </a>

          {/* Center Indicators: Active Table QR or Live Tracking (sm+ screens) */}
          <div className="hidden md:flex items-center gap-2">
            {tableContext && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Dine-In • Table {tableContext.table_number}</span>
              </div>
            )}

            {activeTracking && (
              <button
                onClick={() => openOrderTracking()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Track {activeTracking.orderNumber}</span>
              </button>
            )}
          </div>

          {/* Right Actions: Search, Notifications/Bell, Cart & Hamburger Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={openSearch}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Search dishes"
              title="Search"
            >
              <Search className="w-5 h-5 text-stone-700" />
            </button>

            {/* Customer Notification Bell */}
            <button
              onClick={openCustomerNotif}
              className="relative p-2 rounded-full hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors active:scale-95"
              title="Customer Notifications"
              aria-label="Customer notifications"
            >
              <Bell className="w-5 h-5 text-stone-700" />
              {customerUnreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-600 text-white font-outfit text-[9px] font-extrabold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {customerUnreadCount}
                </span>
              )}
            </button>

            {/* Cart Icon with Counter */}
            <button
              onClick={openCart}
              className="relative p-2 sm:px-3 sm:py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
              aria-label="Open cart"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {totalCount > 0 && (
                <span className="bg-white text-brand-600 font-outfit text-[10px] sm:text-xs font-extrabold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Top Hamburger Menu Button: Logo | Bell | Hamburger */}
            <button
              onClick={handleOpenHamburger}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-800 transition-colors flex items-center justify-center active:scale-95 border border-stone-200/80 shadow-xs"
              aria-label="Open menu"
              title="Menu & Owner Access"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Drawer Overlay */}
      {isHamburgerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="fixed inset-0" onClick={handleCloseHamburger} aria-hidden="true" />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/90 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src="/variety-momo-logo.jpg"
                  alt="Variety Momo"
                  className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-1 ring-stone-200"
                />
                <div>
                  <h3 className="font-outfit font-extrabold text-stone-900 text-base">
                    Variety Momo
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Mecheda, West Bengal
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseHamburger}
                className="p-2 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Highlighted Owner Dashboard Access Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Staff & Owner Access
                  </span>
                </div>
                <h4 className="font-outfit font-black text-stone-900 text-sm">
                  Owner Management Dashboard
                </h4>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                  Manage live kitchen orders, verify payments, update menu & table QR codes.
                </p>
                <a
                  href="/owner-login"
                  onClick={handleOwnerClick}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter Owner Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Install App CTA inside Hamburger if not standalone */}
              {!isStandalone && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-outfit font-extrabold text-stone-900 text-xs">
                      📱 Install Variety Momo App
                    </h5>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Faster orders & direct full-screen experience.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleCloseHamburger();
                      installApp();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
                  >
                    Install
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 pb-1">
                  Customer Navigation
                </div>

                <button
                  onClick={() => scrollToSection('menu')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4 text-brand-600" />
                    <span>Explore Full Menu</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    handleCloseHamburger();
                    openOrderTracking();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Track Active Order</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => scrollToSection('offers')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Special Deals & Offers</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => scrollToSection('gallery')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Kitchen & Momo Gallery</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => scrollToSection('reviews')}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Customer Reviews</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    handleCloseHamburger();
                    openCustomerNotif();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-brand-600" />
                    <span>Order Notifications</span>
                  </div>
                  {customerUnreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                      {customerUnreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Direct Restaurant Contact */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3">
                  Direct Contact
                </div>
                <a
                  href="tel:7827423777"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call 7827423777</span>
                </a>
                <a
                  href="https://wa.me/917827423777?text=Hello%20Variety%20Momo%2C%20I%20want%20to%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-900 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 text-[11px] text-stone-500 flex items-center justify-between shrink-0">
              <span>© {new Date().getFullYear()} Variety Momo</span>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Hygienic</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
