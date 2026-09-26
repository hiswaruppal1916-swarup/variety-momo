import React from 'react';
import { Home, Utensils, ShoppingBag, Clock, Search, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';

function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function BottomNav({ activeSection, onNavigate }) {
  const { totalCount, openCart, openSearch, activeTracking, openOrderTracking } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-floating pb-safe transition-all">
      <div className="flex items-center justify-around px-2 py-1.5">
        {/* Home Tab */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeSection === 'home'
              ? 'text-brand-600 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Menu Tab */}
        <button
          onClick={() => onNavigate('menu')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeSection === 'menu'
              ? 'text-brand-600 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>

        {/* Search Action */}
        <button
          onClick={openSearch}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-stone-500 hover:text-stone-800 transition-all"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>

        {/* Call Quick Action */}
        <a
          href="tel:7827423777"
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-stone-600 hover:text-emerald-600 transition-all"
          title="Call 7827423777"
        >
          <Phone className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] tracking-tight font-medium">Call</span>
        </a>

        {/* Track Active Order or WhatsApp */}
        {activeTracking ? (
          <button
            onClick={() => openOrderTracking()}
            className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-amber-600 font-bold transition-all animate-pulse"
          >
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] tracking-tight">Track</span>
          </button>
        ) : (
          <a
            href="https://wa.me/917827423777?text=Hello%20Variety%20Momo%2C%20I%20want%20to%20know%20more%20about%20your%20menu%2Forder."
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-stone-500 hover:text-emerald-600 transition-all"
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] tracking-tight">WhatsApp</span>
          </a>
        )}

        {/* Cart Tab with Badge */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-700 hover:text-brand-600 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white font-outfit text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight font-bold text-brand-600">Cart</span>
        </button>
      </div>
    </nav>
  );
}
