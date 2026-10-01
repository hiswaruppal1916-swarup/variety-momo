import React from 'react';
import { Home, Utensils, ShoppingBag, Clock, Search, KeyRound } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function BottomNav({ activeSection, onNavigate }) {
  const { totalCount, openCart, openSearch, activeTracking, openOrderTracking } = useCart();

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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-floating pb-safe transition-all">
      <div className="flex items-center justify-around px-1 py-1.5">
        {/* Home Tab */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all ${
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
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all ${
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
          className="flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl text-stone-500 hover:text-stone-800 transition-all"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>

        {/* Track Active Order */}
        <button
          onClick={() => openOrderTracking()}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all ${
            activeTracking
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          title="Track Order"
        >
          <div className="relative">
            <Clock className={`w-5 h-5 ${activeTracking ? 'text-amber-600' : 'text-stone-500'}`} />
            {activeTracking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Track</span>
        </button>

        {/* Cart Tab with Badge */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl text-stone-700 hover:text-brand-600 transition-all"
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

        {/* Owner Portal Tab */}
        <a
          href="/owner-login"
          onClick={handleOwnerClick}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all ${
            activeSection === 'owner-login' || activeSection === 'owner-dashboard'
              ? 'text-amber-600 font-bold'
              : 'text-stone-600 hover:text-amber-600'
          }`}
          title="Owner Portal"
        >
          <div className="relative">
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] tracking-tight font-bold text-amber-700">Owner</span>
        </a>
      </div>
    </nav>
  );
}
