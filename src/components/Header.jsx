import React from 'react';
import { ShoppingBag, Search, MapPin, Phone, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { restaurantInfo } from '../data/restaurantInfo';

export default function Header() {
  const { totalCount, openCart, openSearch, orderType, setOrderType, openDineInModal } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm transition-all">
      {/* Top micro banner for location & phone */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          <span className="truncate font-medium">{restaurantInfo.location}</span>
          <span className="hidden sm:inline text-stone-400">• Hot & Fresh Delivery</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={restaurantInfo.socials.phone}
            className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">{restaurantInfo.phone}</span>
          </a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/variety-momo-logo.jpg"
            alt="Variety Momo Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm ring-1 ring-stone-200/50 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-outfit font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 leading-none">
                VARIETY <span className="text-brand-600">MOMO</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 font-medium tracking-wide">
              MECHEDA'S FAVOURITE
            </p>
          </div>
        </a>

        {/* Order Mode Switcher (Desktop / Tablet) */}
        <button
          onClick={openDineInModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-semibold text-stone-800 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{orderType === 'delivery' ? 'Home Delivery' : 'Dine-In (Counter Pay)'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
        </button>

        {/* Right Actions: Search & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            onClick={openSearch}
            className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-stone-100 text-stone-700 flex items-center gap-1.5 transition-colors"
            aria-label="Search dishes"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-medium text-stone-500">Search Momos...</span>
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
              <span className="bg-white text-brand-600 font-outfit text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
