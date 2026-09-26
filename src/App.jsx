import React, { useState, useMemo, useEffect } from 'react';
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
import OrderTrackingModal from './components/OrderTrackingModal';
import Footer from './components/Footer';
import { getMenuItems } from './services/restaurantService';
import { menuItems as fallbackMenuItems } from './data/menuItems';
import { Flame, UtensilsCrossed, AlertCircle, Phone, MessageSquare, Clock } from 'lucide-react';
import OwnerLogin from './pages/OwnerLogin';
import OwnerDashboard from './pages/OwnerDashboard';

function WhatsAppFloatingIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function RestaurantApp() {
  const { tableContext, tableError, activeTracking, openOrderTracking } = useCart();

  const [activeCategory, setActiveCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [activeNav, setActiveNav] = useState('home');
  const [menuItemsList, setMenuItemsList] = useState(fallbackMenuItems);

  // Fetch live menu items from Supabase as source of truth (Requirement 2 & 18)
  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      try {
        const liveItems = await getMenuItems();
        if (isMounted && liveItems && liveItems.length > 0) {
          setMenuItemsList(liveItems);
        }
      } catch (err) {
        console.error('Error fetching live menu from Supabase:', err);
      }
    }
    loadMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered Menu Items for the main discovery grid
  const filteredItems = useMemo(() => {
    return menuItemsList.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchDiet =
        dietaryFilter === 'all' ? true : dietaryFilter === 'veg' ? item.isVeg : !item.isVeg;
      return matchCat && matchDiet;
    });
  }, [menuItemsList, activeCategory, dietaryFilter]);

  // Curated Subsets for FoodSliders
  const customerFavourites = useMemo(() => {
    return menuItemsList.filter((item) => item.isPopular);
  }, [menuItemsList]);

  const specialMomos = useMemo(() => {
    return menuItemsList.filter((item) => item.category === 'special-momos');
  }, [menuItemsList]);

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

      {/* Table Context Banner if QR was scanned (Requirements 5 & 26) */}
      {tableContext && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span>
                <strong>Dine-In Active:</strong> You are seated at Table{' '}
                <strong>{tableContext.table_number}</strong>. Orders will be served directly to your table with counter billing.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Table QR Alert Banner */}
      {tableError && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                <strong>Table Error:</strong> {tableError}
              </span>
            </div>
          </div>
        </div>
      )}

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

        {/* Customer Favourites Slider */}
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

        {/* Main Food Discovery Section */}
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
                    : menuItemsList.find((m) => m.category === activeCategory)?.category?.replace('-', ' ')?.toUpperCase() || 'Category Menu'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Showing {filteredItems.length} freshly prepared dishes from Supabase
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

      {/* Floating Action Buttons for Call & WhatsApp & Active Order */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-30 flex flex-col items-end gap-2.5">
        {activeTracking && (
          <button
            onClick={() => openOrderTracking()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-lg shadow-amber-500/30 transition-all active:scale-95 animate-bounce"
            title="Track your active order"
          >
            <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Track Order {activeTracking.orderNumber}</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Call Floating Pill */}
          <a
            href="tel:7827423777"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-lg transition-all active:scale-95"
            title="Call Variety Momo 7827423777"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>7827423777</span>
          </a>

          {/* WhatsApp Floating Button */}
          <a
            href="https://wa.me/917827423777?text=Hello%20Variety%20Momo%2C%20I%20want%20to%20know%20more%20about%20your%20menu%2Forder."
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            title="Chat with Variety Momo on WhatsApp"
            aria-label="WhatsApp Contact"
          >
            <WhatsAppFloatingIcon className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav activeSection={activeNav} onNavigate={handleNav} />

      {/* Overlays and Modals */}
      <FoodDetailModal />
      <CartDrawer />
      <SearchModal />
      <OrderTrackingModal />
      <DineInDeliveryChoice isModal={false} />
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('/owner-dashboard')) return 'owner-dashboard';
    if (p.includes('/owner-login')) return 'owner-login';
    return 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('/owner-dashboard')) setCurrentRoute('owner-dashboard');
      else if (p.includes('/owner-login')) setCurrentRoute('owner-login');
      else setCurrentRoute('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route) => {
    let url = '/';
    if (route === 'owner-dashboard') url = '/owner-dashboard';
    else if (route === 'owner-login') url = '/owner-login';
    window.history.pushState({}, '', url);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getInitialOwnerOrderId = () => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('order_id')) return searchParams.get('order_id');
    const p = window.location.pathname;
    if (p.includes('/owner-dashboard/orders/')) {
      return p.split('/owner-dashboard/orders/')[1]?.split('/')[0]?.split('?')[0];
    }
    return null;
  };

  if (currentRoute === 'owner-dashboard') {
    return <OwnerDashboard onNavigate={navigate} initialOrderId={getInitialOwnerOrderId()} />;
  }

  if (currentRoute === 'owner-login') {
    return <OwnerLogin onNavigate={navigate} />;
  }

  return (
    <CartProvider>
      <RestaurantApp onNavigate={navigate} />
    </CartProvider>
  );
}
