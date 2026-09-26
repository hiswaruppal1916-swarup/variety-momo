import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, Zap, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FoodDetailModal() {
  const {
    selectedFoodItem,
    closeFoodDetail,
    addToCart,
    openCart
  } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState('half');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (selectedFoodItem) {
      setSelectedVariantId(
        selectedFoodItem.defaultVariant || selectedFoodItem.variants?.[0]?.id || 'default'
      );
      setQty(1);
    }
  }, [selectedFoodItem]);

  if (!selectedFoodItem) return null;

  const currentVariant =
    selectedFoodItem.variants?.find(v => v.id === selectedVariantId) ||
    selectedFoodItem.variants?.[0] || { id: 'default', name: 'Plate', price: selectedFoodItem.price || 0 };

  const isAvailable = selectedFoodItem?.isAvailable !== false && selectedFoodItem?.is_available !== false;
  const totalPrice = currentVariant.price * qty;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(selectedFoodItem, currentVariant.id, qty);
    closeFoodDetail();
  };

  const handleBuyNow = () => {
    if (!isAvailable) return;
    addToCart(selectedFoodItem, currentVariant.id, qty);
    closeFoodDetail();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0"
        onClick={closeFoodDetail}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Floating Close Button */}
        <button
          onClick={closeFoodDetail}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Image */}
        <div className="relative h-64 sm:h-72 w-full bg-stone-900 shrink-0">
          <img
            src={selectedFoodItem.image}
            alt={selectedFoodItem.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />

          {/* Badges on image */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span className={selectedFoodItem.isVeg ? "badge-veg shadow-md" : "badge-non-veg shadow-md"} />
            {selectedFoodItem.badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                {selectedFoodItem.badge}
              </span>
            )}
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{selectedFoodItem.rating.toFixed(1)}</span>
                <span className="text-white/70 font-normal">({selectedFoodItem.ratingCount} reviews)</span>
              </div>
            </div>
            <h2 className="font-outfit font-extrabold text-xl sm:text-2xl leading-tight drop-shadow-md">
              {selectedFoodItem.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Details Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase text-stone-400 tracking-wider mb-1">
              About This Dish
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed font-normal">
              {selectedFoodItem.description}
            </p>
          </div>

          {/* Highlights & Inclusions */}
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Fiery Garlic Chutney</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Clear Pepper Broth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>100% Hygienic Prep</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>Served Steaming Hot</span>
            </div>
          </div>

          {/* Variant Selection */}
          {selectedFoodItem.variants && selectedFoodItem.variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-stone-400 tracking-wider mb-2">
                Choose Portion / Size
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {selectedFoodItem.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-brand-900' : 'text-stone-800'}`}>
                        {v.name}
                      </span>
                      <span className="font-outfit font-black text-stone-900 text-sm mt-1">
                        ₹{v.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between py-2 border-t border-stone-100">
            <div>
              <span className="text-xs font-bold uppercase text-stone-400 tracking-wider block">
                Quantity
              </span>
              <span className="text-xs text-stone-500">Select number of plates</span>
            </div>
            <div className="flex items-center rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white text-stone-800 shadow-xs flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all font-bold"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-outfit font-black text-stone-900 text-base">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="w-8 h-8 rounded-lg bg-brand-600 text-white shadow-xs flex items-center justify-center hover:bg-brand-700 active:scale-90 transition-all font-bold"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-stone-100 flex items-center gap-3 shrink-0 pb-safe">
          <div className="shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Total Price</div>
            <div className="font-outfit font-black text-stone-900 text-xl leading-none">
              ₹{totalPrice}
            </div>
          </div>

          {!isAvailable ? (
            <div className="flex-1 py-3 px-4 rounded-xl bg-stone-100 text-stone-500 font-outfit font-bold text-xs uppercase tracking-wider text-center border border-stone-200">
              Currently Unavailable
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-3 rounded-xl bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 active:scale-95 font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-outfit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-600/30"
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
