import React, { useState } from 'react';
import { Star, Plus, Minus, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FoodCard({ item }) {
  const {
    addToCart,
    updateQuantity,
    getItemQuantity,
    getItemCartKey,
    openCart,
    openFoodDetail
  } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState(
    item.defaultVariant || item.variants?.[0]?.id || 'default'
  );

  const currentVariant =
    item.variants?.find(v => v.id === selectedVariantId) ||
    item.variants?.[0] || { id: 'default', name: 'Plate', price: item.price || 0 };

  const currentCartKey = getItemCartKey(item.id, currentVariant.id);
  const quantityInCart = getItemQuantity(item.id, currentVariant.id);

  const isAvailable = item.isAvailable !== false && item.is_available !== false;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(item, currentVariant.id, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    updateQuantity(currentCartKey, quantityInCart + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(currentCartKey, quantityInCart - 1);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    if (quantityInCart === 0) {
      addToCart(item, currentVariant.id, 1);
    }
    openCart();
  };

  return (
    <div
      onClick={() => openFoodDetail(item)}
      className="group bg-white rounded-2xl border border-stone-100/90 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
    >
      {/* Top Image Area with Badge */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={item.isVeg ? "badge-veg shadow-xs" : "badge-non-veg shadow-xs"} />
        </div>

        {/* Promo / Chef Badge */}
        {item.badge && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-stone-900/85 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
            {item.badge}
          </div>
        )}

        {/* Quick View Tag or Unavailable Overlay */}
        {!isAvailable ? (
          <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-[1px] flex items-center justify-center p-2 z-20">
            <span className="px-2.5 py-1 rounded-full bg-red-600/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
              Currently Unavailable
            </span>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 py-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
            <span className="text-[11px] text-white font-medium">Click to view details</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Type */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-800">
              <Star className="w-3 h-3 text-amberGold fill-amberGold" />
              <span>{item.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({item.ratingCount})</span>
            </div>
            <span className="text-[11px] font-medium text-stone-500 capitalize truncate">
              {item.category?.replace('-', ' ')}
            </span>
          </div>

          {/* Dish Title */}
          <h3 className="font-outfit font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-brand-600 transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Variant Selector & Pricing Block */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-2">
          {/* Variant Pill Toggle */}
          {item.variants && item.variants.length > 1 && (
            <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-lg">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantId(variant.id);
                  }}
                  className={`flex-1 py-1 px-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all text-center ${
                    selectedVariantId === variant.id
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span className="truncate block">
                    {variant.name.includes('(') ? variant.name.replace(/\s*\([^)]*\)/, '') : variant.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Price & Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-medium tracking-wider">Price</div>
              <div className="font-outfit font-extrabold text-stone-900 text-base sm:text-lg leading-none">
                ₹{currentVariant.price}
              </div>
            </div>

            {/* Stepper or ADD Button & Buy Now OR Unavailable State */}
            {!isAvailable ? (
              <span className="px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-400 font-bold text-[11px] uppercase tracking-wider">
                Unavailable
              </span>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {quantityInCart === 0 ? (
                  <button
                    onClick={handleAdd}
                    className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white border border-brand-500 text-brand-600 hover:bg-brand-50 font-outfit font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-xs hover:shadow transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>ADD</span>
                  </button>
                ) : (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center rounded-lg bg-brand-600 text-white font-outfit font-bold text-xs shadow-xs"
                  >
                    <button
                      onClick={handleDecrement}
                      className="px-1.5 sm:px-2 py-1.5 hover:bg-brand-700 rounded-l-lg transition-colors active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="px-1.5 sm:px-2 font-black">{quantityInCart}</span>
                    <button
                      onClick={handleIncrement}
                      className="px-1.5 sm:px-2 py-1.5 hover:bg-brand-700 rounded-r-lg transition-colors active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* Buy Now Button (Always visible on all screens) */}
                <button
                  onClick={handleBuyNow}
                  title="Buy Now - Instant checkout"
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-[11px] sm:text-xs font-semibold shadow-xs active:scale-95 transition-all"
                >
                  <Zap className="w-3 h-3 text-amberGold fill-amberGold" />
                  <span>Buy</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
