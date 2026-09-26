import React from 'react';
import { Home, Utensils, ShoppingBag, Info, Search, Bike } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function BottomNav({ activeSection, onNavigate }) {
  const { totalCount, openCart, openSearch, openDineInModal, orderType } = useCart();

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

        {/* Dine-In / Delivery Choice */}
        <button
          onClick={openDineInModal}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-stone-500 hover:text-stone-800 transition-all"
        >
          <Bike className="w-5 h-5 text-amber-600" />
          <span className="text-[10px] tracking-tight capitalize truncate max-w-[50px]">
            {orderType}
          </span>
        </button>

        {/* Cart Tab with Badge */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-700 hover:text-brand-600 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white font-outfit text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
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
