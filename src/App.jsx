import React, { useState, useMemo } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CategoryBar from './components/CategoryBar';
import FoodCard from './components/FoodCard';
import FoodSlider from './components/FoodSlider';
import FoodDetailModal from './components/FoodDetailModal';
import CartDrawer from './components/CartDrawer';
import DineInDeliveryChoice from './components/DineInDeliveryChoice';
import OffersSection from './components/OffersSection';
import RestaurantInfo from './components/RestaurantInfo';
import GallerySection from './components/GallerySection';
import ReviewsSection from './components/ReviewsSection';
import BottomNav from './components/BottomNav';
import SearchModal from './components/SearchModal';
import Footer from './components/Footer';
import { menuItems } from './data/menuItems';
import { Sparkles, Flame, Filter } from 'lucide-react';

function RestaurantApp() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [activeNav, setActiveNav] = useState('home');

  // Filtered Menu Items for the main discovery grid
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchDiet =
        dietaryFilter === 'all' ? true : dietaryFilter === 'veg' ? item.isVeg : !item.isVeg;
      return matchCat && matchDiet;
    });
  }, [activeCategory, dietaryFilter]);

  // Curated Subsets for FoodSliders
  const customerFavourites = useMemo(() => {
    return menuItems.filter((item) => item.isPopular);
  }, []);

  const specialMomos = useMemo(() => {
    return menuItems.filter((item) => item.category === 'special-momos');
  }, []);

  const handleNav = (tab) => {
    setActiveNav(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'menu') {
      const el = document.getElementById('menu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-stone-900 flex flex-col selection:bg-brand-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroSection />

        {/* Dine-In vs Delivery Quick Selector */}
        <DineInDeliveryChoice />

        {/* Horizontal Category Pill Bar */}
        <CategoryBar
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            const menuEl = document.getElementById('menu');
            if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Customer Favourites Slider (Zomato-style horizontal carousel) */}
        {activeCategory === 'all' && (
          <FoodSlider
            title="Customer Favourites"
            subtitle="Most ordered & loved momos in Mecheda"
            badgeText="Top Rated"
            items={customerFavourites}
          />
        )}

        {/* Special Momos Slider */}
        {activeCategory === 'all' && (
          <FoodSlider
            title="Chef's Special & Fusion Momos"
            subtitle="Signature Gondhoraj, Kabul Malai, Chocolate & Pizza Momos"
            badgeText="Unique Creations"
            items={specialMomos}
          />
        )}

        {/* Main Food Discovery Section (Flipkart style 2-column mobile grid) */}
        <section id="menu" className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            {/* Section Header with Dietary Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
                  <Flame className="w-4 h-4 fill-brand-600" />
                  <span>Fresh From The Steamer & Wok</span>
                </div>
                <h2 className="font-outfit font-extrabold text-stone-900 text-xl sm:text-3xl tracking-tight">
                  {activeCategory === 'all'
                    ? 'Explore Full Menu'
                    : menuItems.find(m => m.category === activeCategory)?.category?.replace('-', ' ')?.toUpperCase() || 'Category Menu'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Showing {filteredItems.length} freshly prepared dishes
                </p>
              </div>

              {/* Veg / Non-Veg Quick Switcher */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dietaryFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietaryFilter('veg')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    dietaryFilter === 'veg'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="badge-veg scale-75" />
                  <span>Veg Only</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('nonveg')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    dietaryFilter === 'nonveg'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-rose-700'
                  }`}
                >
                  <span className="badge-non-veg scale-75" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Product Cards Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-6">
                <p className="text-base font-semibold text-stone-700">No dishes match the selected filter.</p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setDietaryFilter('all');
                  }}
                  className="mt-3 px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold shadow-md"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {filteredItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Offers Section */}
        <OffersSection />

        {/* Restaurant Story, Phone & Mecheda Location Info */}
        <RestaurantInfo />

        {/* Sizzling Kitchen Gallery */}
        <GallerySection />

        {/* Customer Testimonials & Reviews */}
        <ReviewsSection />
      </main>

      {/* Desktop/Tablet Footer */}
      <Footer />

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav activeSection={activeNav} onNavigate={handleNav} />

      {/* Overlays and Modals */}
      <FoodDetailModal />
      <CartDrawer />
      <SearchModal />
      <DineInDeliveryChoice isModal={false} />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <RestaurantApp />
    </CartProvider>
  );
}
