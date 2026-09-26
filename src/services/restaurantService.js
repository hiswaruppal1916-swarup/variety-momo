import { supabase } from '../lib/supabase';
import { restaurantInfo as fallbackRestaurantInfo } from '../data/restaurantInfo';
import { categories as fallbackCategories } from '../data/categories';
import { menuItems as fallbackMenuItems } from '../data/menuItems';
import { specialOffers as fallbackOffers } from '../data/offers';
import { customerReviews as fallbackReviews } from '../data/reviews';

/**
 * Fetch Restaurant Settings from Supabase
 */
export async function getRestaurantSettings() {
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        restaurant_name: fallbackRestaurantInfo.name,
        phone: fallbackRestaurantInfo.phone,
        address: fallbackRestaurantInfo.fullAddress,
        city: fallbackRestaurantInfo.location.split(',')[0].trim(),
        state: 'West Bengal',
        country: 'India',
        logo_url: '/variety-momo-logo.jpg',
        favicon_url: '/favicon.png',
        phonepe_upi_id: '7827423777@ybl',
        phonepe_qr_url: null,
        delivery_charge: 50,
        home_delivery_enabled: true,
        dine_in_enabled: true,
        advance_payment_percentage: 30,
        cod_percentage: 70
      };
    }

    return data;
  } catch (err) {
    console.error('Error fetching restaurant settings:', err);
    return null;
  }
}

/**
 * Update Restaurant Settings (Owner only, guarded by RLS)
 */
export async function updateRestaurantSettings(settingsId, updates) {
  // Validate percentages if provided
  if (
    updates.advance_payment_percentage !== undefined &&
    updates.cod_percentage !== undefined
  ) {
    if (
      Number(updates.advance_payment_percentage) +
        Number(updates.cod_percentage) !==
      100
    ) {
      throw new Error(
        'Advance percentage and COD percentage must strictly add up to 100%.'
      );
    }
  }

  const { data, error } = await supabase
    .from('restaurant_settings')
    .update(updates)
    .eq('id', settingsId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Fetch active Categories from Supabase
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCategories;
    }
    return data;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return fallbackCategories;
  }
}

/**
 * Fetch available Menu Items from Supabase
 */
export async function getMenuItems(categorySlug = null) {
  try {
    let query = supabase
      .from('menu_items')
      .select('*, categories(slug, name)')
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return fallbackMenuItems;
    }

    // Map database fields to the UI schema
    const formatted = data.map((item) => ({
      id: item.slug || item.id,
      name: item.name,
      category: item.categories?.slug || 'chicken-momos',
      isVeg: item.is_vegetarian,
      price: Number(item.price),
      description: item.description,
      image: item.image_url,
      isPopular: item.is_popular,
      isFeatured: item.is_popular,
      rating: 4.8,
      ratingCount: 200,
      variants: [
        { id: 'standard', name: 'Standard Plate', price: Number(item.price) }
      ],
      defaultVariant: 'standard'
    }));

    if (categorySlug && categorySlug !== 'all') {
      return formatted.filter((item) => item.category === categorySlug);
    }

    return formatted;
  } catch (err) {
    console.error('Error fetching menu items:', err);
    return fallbackMenuItems;
  }
}

/**
 * Fetch active Offers from Supabase
 */
export async function getOffers() {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackOffers;
    }
    return data;
  } catch (err) {
    console.error('Error fetching offers:', err);
    return fallbackOffers;
  }
}

/**
 * Fetch active Gallery items from Supabase
 */
export async function getGallery() {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }
    return data;
  } catch (err) {
    console.error('Error fetching gallery:', err);
    return [];
  }
}

/**
 * Fetch approved customer reviews
 */
export async function getApprovedReviews() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackReviews;
    }
    return data.map((r) => ({
      id: r.id,
      name: r.customer_name,
      rating: Number(r.rating),
      review: r.review_text,
      verified: true,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    }));
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return fallbackReviews;
  }
}

/**
 * Submit a customer review for moderation (Public Insert, RLS guarded)
 */
export async function submitReview({ customer_name, rating, review_text }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        customer_name,
        rating,
        review_text,
        is_approved: false // requires owner moderation
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch active delivery zones for Mecheda
 */
export async function getDeliveryZones() {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Accurate server-aligned calculation for Grand Total, Advance & COD.
 * Rule:
 * For DINE_IN:
 *   delivery = 0, advance = 0, cod = 0, grand_total = subtotal
 * For HOME_DELIVERY:
 *   grand_total = subtotal + delivery_charge
 *   advance = grand_total * advance_percentage / 100
 *   cod = grand_total - advance
 */
export function calculateOrderBreakdown({
  subtotal = 0,
  orderType = 'delivery',
  settings = {}
}) {
  const cleanSubtotal = Math.max(0, Number(subtotal) || 0);

  if (orderType === 'dinein' || orderType === 'DINE_IN') {
    return {
      subtotal: cleanSubtotal,
      deliveryCharge: 0,
      grandTotal: cleanSubtotal,
      advancePercentage: 0,
      advanceAmount: 0,
      codAmount: 0,
      isAdvanceRequired: false
    };
  }

  // Home Delivery
  const deliveryCharge = Number(settings.delivery_charge ?? 50);
  const grandTotal = cleanSubtotal + deliveryCharge;
  const advancePercentage = Number(settings.advance_payment_percentage ?? 30);
  const advanceAmount = Math.round((grandTotal * advancePercentage) / 100);
  const codAmount = grandTotal - advanceAmount;

  return {
    subtotal: cleanSubtotal,
    deliveryCharge,
    grandTotal,
    advancePercentage,
    advanceAmount,
    codAmount,
    isAdvanceRequired: advanceAmount > 0
  };
}
