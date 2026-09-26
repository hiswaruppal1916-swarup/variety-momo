import React, { useState, useMemo } from 'react';
import { Search, X, Star, Plus } from 'lucide-react';
import { menuItems } from '../data/menuItems';
import { useCart } from '../context/CartContext';

export default function SearchModal() {
  const { isSearchOpen, closeSearch, openFoodDetail, addToCart } = useCart();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'nonveg'

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesText =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchesDiet =
        filterType === 'all' ? true : filterType === 'veg' ? item.isVeg : !item.isVeg;

      return matchesText && matchesDiet;
    });
  }, [query, filterType]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeSearch}
        aria-hidden="true"
      />

      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10 my-4 flex flex-col max-h-[88vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50/80">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search steam, crunchy, gondhoraj momo, chowmein..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dietary Filters Pill Row */}
        <div className="px-4 py-2 bg-white border-b border-stone-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Dishes
          </button>
          <button
            onClick={() => setFilterType('veg')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              filterType === 'veg'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span className="badge-veg scale-75" />
            <span>Pure Veg</span>
          </button>
          <button
            onClick={() => setFilterType('nonveg')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              filterType === 'nonveg'
                ? 'bg-rose-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span className="badge-non-veg scale-75" />
            <span>Non-Veg Special</span>
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p className="text-sm font-semibold text-stone-700">No momo dishes found for "{query}"</p>
              <p className="text-xs text-stone-400 mt-1">Try searching for "fried", "gondhoraj", or "tikka"</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  openFoodDetail(item);
                  closeSearch();
                }}
                className="py-3 first:pt-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={item.isVeg ? "badge-veg shrink-0" : "badge-non-veg shrink-0"} />
                      <h4 className="font-outfit font-bold text-stone-900 text-sm truncate">
                        {item.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </div>
                    <div className="font-outfit font-extrabold text-stone-900 text-xs mt-1">
                      From ₹{item.variants?.[0]?.price || item.price}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-brand-600 text-brand-600 hover:bg-brand-50 font-outfit font-bold text-xs uppercase shadow-xs shrink-0 active:scale-95"
                >
                  ADD
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
