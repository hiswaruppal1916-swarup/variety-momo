import { supabase } from '../lib/supabase';
import { triggerPushNotification } from '../lib/firebase';
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
        phonepe_qr_url: '/phonepe-demo-qr.svg',
        delivery_charge: 50,
        home_delivery_enabled: true,
        dine_in_enabled: true,
        advance_payment_percentage: 30,
        cod_percentage: 70
      };
    }

    return {
      ...data,
      phonepe_qr_url: data.phonepe_qr_url || '/phonepe-demo-qr.svg'
    };
  } catch (err) {
    console.error('Error fetching restaurant settings:', err);
    return null;
  }
}

/**
 * Update Restaurant Settings (Owner only, guarded by RLS)
 */
export async function updateRestaurantSettings(settingsId, updates) {
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
 * Fetch available Menu Items from Supabase (Source of Truth)
 */
export async function getMenuItems(categorySlug = null) {
  try {
    let query = supabase
      .from('menu_items')
      .select('*, categories(slug, name)')
      .order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return fallbackMenuItems;
    }

    // Map database fields to UI schema, ensuring both slug and UUID are retained
    const formatted = data.map((item) => ({
      id: item.slug || item.id,
      dbId: item.id, // Supabase UUID required for order creation
      name: item.name,
      category: item.categories?.slug || 'chicken-momos',
      isVeg: item.is_vegetarian,
      price: Number(item.price),
      description: item.description,
      image: item.image_url,
      isPopular: item.is_popular,
      isFeatured: item.is_popular,
      isAvailable: item.is_available !== false,
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
 * Fetch ALL menu items for Owner (including unavailable items)
 */
export async function getAllMenuItemsForOwner() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, categories(slug, name)')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Add Food Item (Owner only)
 */
export async function addMenuItem(itemData) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([itemData])
    .select('*, categories(slug, name)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update Food Item (Owner only)
 */
export async function updateMenuItem(itemId, updates) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', itemId)
    .select('*, categories(slug, name)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle Food Item Availability (Owner only)
 */
export async function toggleMenuItemAvailability(itemId, isAvailable) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add Category (Owner only)
 */
export async function addCategory(categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update Category (Owner only)
 */
export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch active Delivery Zones for Mecheda
 */
export async function getDeliveryZones() {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching delivery zones:', err);
    return [];
  }
}

/**
 * Add Delivery Zone (Owner only)
 */
export async function addDeliveryZone(zoneData) {
  const { data, error } = await supabase
    .from('delivery_zones')
    .insert([zoneData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update Delivery Zone (Owner only)
 */
export async function updateDeliveryZone(zoneId, updates) {
  const { data, error } = await supabase
    .from('delivery_zones')
    .update(updates)
    .eq('id', zoneId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch active Tables for Dine-In
 */
export async function getTables() {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('id, table_number, qr_token, is_active')
      .order('table_number');

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching tables:', err);
    return [];
  }
}

/**
 * Add Table (Owner only)
 */
export async function addTable(tableData) {
  const { data, error } = await supabase
    .from('tables')
    .insert([tableData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update Table (Owner only)
 */
export async function updateTable(tableId, updates) {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Validate Table QR Token securely
 */
export async function validateTableQR(qrToken) {
  if (!qrToken) return { valid: false, error: 'No table QR token provided.' };
  try {
    const { data, error } = await supabase.rpc('validate_table_qr', {
      p_qr_token: qrToken.trim()
    });

    if (error) {
      console.error('validate_table_qr error:', error);
      return { valid: false, error: error.message || 'Failed to validate table QR' };
    }
    return data || { valid: false, error: 'Invalid or inactive table QR.' };
  } catch (err) {
    console.error('Error in validateTableQR:', err);
    return { valid: false, error: err.message || 'Network error validating table QR' };
  }
}

/**
 * Create Customer Order (Atomic, secure server-side recalculation RPC)
 */
export async function createCustomerOrder({
  orderType,
  customerName,
  customerPhone,
  items,
  tableToken = null,
  deliveryAddress = null,
  paymentReference = null,
  specialInstructions = null
}) {
  const { data, error } = await supabase.rpc('create_customer_order', {
    p_order_type: orderType,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_items: items,
    p_table_token: tableToken,
    p_delivery_address: deliveryAddress,
    p_payment_reference: paymentReference,
    p_special_instructions: specialInstructions
  });

  if (error) {
    console.error('create_customer_order error:', error);
    throw new Error(error.message || 'Failed to place order.');
  }

  // Trigger FCM Push notification to Owner in background
  if (data && data.order_number) {
    triggerPushNotification({
      title: `🔔 New ${orderType === 'DINE_IN' ? 'Dine-In' : 'Delivery'} Order #${data.order_number}`,
      body: `${customerName || 'Customer'} placed an order of ₹${data.grand_total || '0'}. Click to view dashboard.`,
      recipientType: 'OWNER',
      orderId: data.order_id,
      orderNumber: data.order_number,
      url: '/owner-dashboard'
    }).catch((err) => console.warn('[FCM] Push trigger failed:', err));
  }

  return data;
}

/**
 * Submit PhonePe payment reference for manual owner verification
 */
export async function submitOrderPayment({
  orderNumber,
  trackingToken,
  paymentReference,
  paymentAmount = null,
  note = null
}) {
  const { data, error } = await supabase.rpc('submit_order_payment', {
    p_order_number: orderNumber,
    p_tracking_token: trackingToken,
    p_payment_reference: paymentReference,
    p_payment_amount: paymentAmount,
    p_note: note
  });

  if (error) {
    console.error('submit_order_payment error:', error);
    throw new Error(error.message || 'Failed to submit payment reference.');
  }

  // Trigger FCM Push notification to Owner in background
  triggerPushNotification({
    title: `💳 Payment Submitted #${orderNumber}`,
    body: `Ref "${paymentReference}" submitted for ₹${paymentAmount || ''}. Verification needed.`,
    recipientType: 'OWNER',
    orderId: data?.order_id || null,
    orderNumber: orderNumber,
    url: '/owner-dashboard'
  }).catch((err) => console.warn('[FCM] Push trigger failed:', err));

  return data;
}

/**
 * Securely fetch customer order details using order number + non-guessable tracking token
 */
export async function getCustomerOrder(orderNumber = null, trackingToken = null) {
  const { data, error } = await supabase.rpc('get_customer_order', {
    p_order_number: orderNumber || null,
    p_tracking_token: trackingToken || null
  });

  if (error) {
    console.error('get_customer_order error:', error);
    throw new Error(error.message || 'Failed to load order tracking details.');
  }

  return data;
}

/**
 * Subscribe to realtime status changes for a specific order
 */
export function subscribeToOrderUpdates(orderId, onUpdate) {
  if (!orderId) return () => {};

  const channel = supabase
    .channel(`realtime-order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        if (onUpdate && payload.new) {
          onUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ============================================================================
   OWNER-SPECIFIC SECURE FUNCTIONS (STEP 5)
============================================================================ */

/**
 * Format timestamp into Asia/Kolkata timezone: 'DD MMM YYYY, hh:mm A'
 * Example: '02 Oct 2026, 08:42 PM'
 */
export function formatKolkataDateTime(timestamp) {
  if (!timestamp) return '';
  try {
    const d = typeof timestamp === 'string' || typeof timestamp === 'number'
      ? new Date(timestamp)
      : timestamp;
    if (isNaN(d.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const str = formatter.format(d);
    return str.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
  } catch (e) {
    console.error('Date formatting error:', e);
    return '';
  }
}

/**
 * Calculate the exact start and end of TODAY in Asia/Kolkata (UTC+05:30)
 * Returned as ISO strings (UTC) for querying database timestamps
 */
export function getKolkataTodayRange() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA produces "YYYY-MM-DD"
  const dateStr = formatter.format(now); // e.g. "2026-10-02"

  // Start of day in Kolkata is dateStr + "T00:00:00+05:30"
  // End of day in Kolkata is dateStr + "T23:59:59.999+05:30"
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`).toISOString();
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();

  return { dateStr, startOfDay, endOfDay };
}

/**
 * Get Owner Dashboard Statistics (Atomic RPC)
 */
export async function getOwnerDashboardStats() {
  const { data, error } = await supabase.rpc('get_owner_dashboard_stats');
  if (error) {
    console.error('get_owner_dashboard_stats error:', error);
    throw error;
  }
  return data;
}

/**
 * Fetch Orders for Owner with filtering, search and pagination
 */
export async function getOwnerOrders({
  status = 'ALL',
  orderType = 'ALL',
  search = '',
  limit = 50,
  offset = 0,
  onlyToday = false
} = {}) {
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      order_type,
      customer_name,
      customer_phone,
      subtotal,
      delivery_charge,
      grand_total,
      advance_amount,
      cod_amount,
      payment_status,
      order_status,
      payment_reference,
      special_instructions,
      created_at,
      tables(table_number),
      customer_addresses(address_line, area, landmark, city, pincode, delivery_zones(name)),
      order_items(id, item_name_snapshot, unit_price_snapshot, quantity, line_total),
      payments(id, amount, payment_status, customer_reference, submitted_at, verified_at)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (onlyToday) {
    const { startOfDay, endOfDay } = getKolkataTodayRange();
    query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
  }

  if (orderType && orderType !== 'ALL') {
    query = query.eq('order_type', orderType);
  }

  if (status && status !== 'ALL') {
    if (status === 'PAYMENT_VERIFICATION') {
      query = query.eq('payment_status', 'SUBMITTED');
    } else {
      query = query.eq('order_status', status);
    }
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(`order_number.ilike.%${term}%,customer_phone.ilike.%${term}%,customer_name.ilike.%${term}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { orders: data || [], totalCount: count || 0 };
}

/**
 * Delete Order (Owner only - cascades to items, payments, history, notifications)
 */
export async function deleteOrder(orderId) {
  if (!orderId) throw new Error('Order ID is required.');
  const { data, error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .select('id, order_number');

  if (error) {
    console.error('Delete order error:', error);
    throw error;
  }
  return data?.[0] || { id: orderId };
}

/**
 * Get full order details for Owner
 */
export async function getOwnerOrderDetails(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables(table_number, qr_token),
      customer_addresses(*, delivery_zones(name)),
      order_items(*),
      payments(*),
      order_status_history(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify Order Payment (Owner RPC)
 */
export async function verifyOrderPayment({ paymentId, orderId, note = null }) {
  const { data, error } = await supabase.rpc('verify_order_payment', {
    p_payment_id: paymentId,
    p_order_id: orderId,
    p_note: note
  });

  if (error) throw error;

  // Trigger push notification to Customer with direct tracking URL
  const verifyTrackingUrl =
    data?.order_number && data?.tracking_token
      ? `/?order_number=${encodeURIComponent(data.order_number)}&token=${encodeURIComponent(data.tracking_token)}`
      : '/';

  triggerPushNotification({
    title: '✅ Advance Payment Verified',
    body: 'Your advance payment has been verified by Variety Momo. Momos are being prepared!',
    recipientType: 'CUSTOMER',
    orderId: orderId,
    orderNumber: data?.order_number || null,
    url: verifyTrackingUrl
  }).catch((err) => console.warn('[FCM] Push trigger failed:', err));

  return data;
}

/**
 * Reject Order Payment (Owner RPC)
 */
export async function rejectOrderPayment({ paymentId, orderId, reason }) {
  const { data, error } = await supabase.rpc('reject_order_payment', {
    p_payment_id: paymentId,
    p_order_id: orderId,
    p_reason: reason
  });

  if (error) throw error;

  // Trigger push notification to Customer
  const rejectTrackingUrl =
    data?.order_number && data?.tracking_token
      ? `/?order_number=${encodeURIComponent(data.order_number)}&token=${encodeURIComponent(data.tracking_token)}`
      : '/';

  triggerPushNotification({
    title: '❌ Payment Issue',
    body: `Your payment reference could not be verified: ${reason}. Please update your payment reference.`,
    recipientType: 'CUSTOMER',
    orderId: orderId,
    orderNumber: data?.order_number || null,
    url: rejectTrackingUrl
  }).catch((err) => console.warn('[FCM] Push trigger failed:', err));

  return data;
}

/**
 * Update Order Status (Owner RPC with state machine checks)
 */
export async function updateOrderStatus({ orderId, newStatus, note = null }) {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note
  });

  if (error) throw error;

  const orderNum = data?.order_number || '';
  const statusMessages = {
    CONFIRMED: 'Order confirmed! Kitchen is prepping ingredients.',
    PREPARING: 'Your momos are being freshly steamed and prepared! 🥟🔥',
    READY: orderNum ? `Your Variety Momo order #${orderNum} is ready.` : 'Your Variety Momo order is ready.',
    OUT_FOR_DELIVERY: 'Our delivery rider is on the way! 🛵💨',
    SERVED: 'Your order has been served hot at your table! Enjoy! 🥟',
    COMPLETED: 'Thank you for ordering with Variety Momo! Come again soon! ❤️'
  };

  const statusTitles = {
    PREPARING: '🔥 Momos Steaming',
    READY: orderNum ? `🥟 Order Ready #${orderNum}` : '🥟 Order Ready',
    OUT_FOR_DELIVERY: '🛵 Out for Delivery',
    SERVED: '🍽️ Order Served',
    COMPLETED: '❤️ Order Completed'
  };

  const statusTrackingUrl =
    data?.order_number && data?.tracking_token
      ? `/?order_number=${encodeURIComponent(data.order_number)}&token=${encodeURIComponent(data.tracking_token)}`
      : '/';

  // Trigger push notification to Customer
  triggerPushNotification({
    title: statusTitles[newStatus] || `📦 Order Update: ${newStatus.replace(/_/g, ' ')}`,
    body: statusMessages[newStatus] || `Your order status changed to ${newStatus}.`,
    recipientType: 'CUSTOMER',
    orderId: orderId,
    orderNumber: orderNum,
    url: statusTrackingUrl
  }).catch((err) => console.warn('[FCM] Push trigger failed:', err));

  return data;
}

/**
 * Cancel Order (Owner RPC)
 */
export async function cancelOrder({ orderId, reason = null }) {
  const { data, error } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_reason: reason
  });

  if (error) throw error;

  const cancelTrackingUrl =
    data?.order_number && data?.tracking_token
      ? `/?order_number=${encodeURIComponent(data.order_number)}&token=${encodeURIComponent(data.tracking_token)}`
      : '/';

  // Trigger push notification to Customer
  triggerPushNotification({
    title: '⚠️ Order Cancelled',
    body: `Your order was cancelled${reason ? ': ' + reason : '.'}`,
    recipientType: 'CUSTOMER',
    orderId: orderId,
    orderNumber: data?.order_number || null,
    url: cancelTrackingUrl
  }).catch((err) => console.warn('[FCM] Push trigger failed:', err));

  return data;
}

/**
 * Get Pending Payment Verifications Queue
 */
export async function getPaymentVerificationQueue() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      order_id,
      payment_type,
      amount,
      payment_status,
      customer_reference,
      submitted_at,
      orders(
        id,
        order_number,
        order_type,
        customer_name,
        customer_phone,
        grand_total,
        advance_amount,
        cod_amount,
        order_status
      )
    `)
    .eq('payment_status', 'SUBMITTED')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Upload an asset to Supabase Storage (Owner only)
 */
export async function uploadStorageAsset(bucket, file, customPath = null) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = customPath || fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Subscribe to Realtime events on orders, payments, and notifications for Owner Dashboard
 */
export function subscribeToOwnerEvents({
  onNewOrder,
  onOrderUpdate,
  onPaymentSubmitted,
  onNotification
}) {
  const channelName = `owner-realtime-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        if (onNewOrder) onNewOrder(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        if (onOrderUpdate) onOrderUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payments' },
      (payload) => {
        if (onPaymentSubmitted) onPaymentSubmitted(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        if (onNotification && payload.new?.recipient_type === 'OWNER') {
          onNotification(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Accurate server-aligned calculation for Grand Total, Advance & COD.
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

/**
 * Fetch active Offers from Supabase
 */
export async function getOffers() {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
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
 * Add Offer (Owner only)
 */
export async function addOffer(offerData) {
  const { data, error } = await supabase
    .from('offers')
    .insert([offerData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update Offer (Owner only)
 */
export async function updateOffer(offerId, updates) {
  const { data, error } = await supabase
    .from('offers')
    .update(updates)
    .eq('id', offerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch active Gallery items from Supabase
 */
export async function getGallery() {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
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
 * Add Gallery item (Owner only)
 */
export async function addGalleryItem(galleryData) {
  const { data, error } = await supabase
    .from('gallery')
    .insert([galleryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete Gallery item (Owner only)
 */
export async function deleteGalleryItem(galleryId) {
  const { data, error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', galleryId);

  if (error) throw error;
  return data;
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
 * Fetch ALL reviews for Owner moderation
 */
export async function getAllReviewsForOwner() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Approve / Toggle review (Owner only)
 */
export async function setReviewApproval(reviewId, isApproved) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: isApproved })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete review (Owner only)
 */
export async function deleteReview(reviewId) {
  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
  return data;
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
        is_approved: false
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch Owner Notifications
 */
export async function getOwnerNotifications() {
  try {
    const { data, error } = await supabase.rpc('get_owner_notifications');
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    // Fall back to table query
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'OWNER')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((n) => ({
      ...n,
      message: n.body || n.message || ''
    }));
  } catch (err) {
    console.error('Error fetching owner notifications:', err);
    return [];
  }
}

/**
 * Mark a single owner notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase.rpc('mark_owner_notification_read', {
      p_notification_id: notificationId
    });
    if (!error) return data;
  } catch (err) {
    // Fall back to direct table update
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error marking notification read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark all owner notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const { data, error } = await supabase.rpc('mark_all_owner_notifications_read');
    if (!error) return data;
  } catch (err) {
    // Fall back to direct table update
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_type', 'OWNER');
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a single owner notification by ID
 */
export async function deleteOwnerNotification(notificationId) {
  try {
    const { data, error } = await supabase.rpc('delete_owner_notification', {
      p_notification_id: notificationId
    });
    if (!error) return data;
  } catch (err) {
    // Fall back to direct table delete
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_type', 'OWNER');
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error deleting owner notification:', err);
    throw err;
  }
}

/**
 * Delete all owner notifications
 */
export async function deleteAllOwnerNotifications() {
  try {
    const { data, error } = await supabase.rpc('delete_all_owner_notifications');
    if (!error) return data;
  } catch (err) {
    // Fall back to direct table delete
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_type', 'OWNER');
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error deleting all owner notifications:', err);
    throw err;
  }
}

/**
 * Fetch Customer Notifications by their active tracking tokens
 */
export async function getCustomerNotifications(tokens = []) {
  if (!tokens || tokens.length === 0) return [];
  try {
    const { data, error } = await supabase.rpc('get_customer_notifications', {
      p_tokens: tokens
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching customer notifications:', err);
    return [];
  }
}

/**
 * Mark a single customer notification as read
 */
export async function markCustomerNotificationRead(notificationId, trackingToken) {
  try {
    const { data, error } = await supabase.rpc('mark_customer_notification_read', {
      p_notification_id: notificationId,
      p_tracking_token: trackingToken
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error marking customer notification read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark all customer notifications as read
 */
export async function markAllCustomerNotificationsRead(tokens = []) {
  if (!tokens || tokens.length === 0) return { success: true };
  try {
    const { data, error } = await supabase.rpc('mark_all_customer_notifications_read', {
      p_tokens: tokens
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error marking all customer notifications read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a single customer notification
 */
export async function deleteCustomerNotification(notificationId, trackingToken) {
  try {
    const { data, error } = await supabase.rpc('delete_customer_notification', {
      p_notification_id: notificationId,
      p_tracking_token: trackingToken
    });
    if (!error) return data;
  } catch (err) {
    // handled gracefully
  }
  return { success: true };
}

/**
 * Delete all customer notifications
 */
export async function deleteAllCustomerNotifications(tokens = []) {
  if (!tokens || tokens.length === 0) return { success: true, count: 0 };
  try {
    const { data, error } = await supabase.rpc('delete_all_customer_notifications', {
      p_tokens: tokens
    });
    if (!error) return data;
  } catch (err) {
    // handled gracefully
  }
  return { success: true };
}

