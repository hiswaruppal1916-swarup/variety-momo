import { supabase } from '../lib/supabase';

export const OWNER_EMAILS = [
  (import.meta.env.VITE_OWNER_EMAIL || 'owner@varietymomo.com').toLowerCase().trim(),
  'hiswaruppal1916@gmail.com',
  'owner@varietymomo.com'
];

export const isOwnerEmail = (email) => {
  const norm = (email || '').toLowerCase().trim();
  return OWNER_EMAILS.includes(norm);
};

export const OWNER_EMAIL = OWNER_EMAILS[0];

/**
 * Sign in as the restaurant owner.
 * Strictly verifies email match AND active OWNER role in Supabase profiles.
 */
export async function loginOwner(email, password) {
  const normalizedEmail = (email || '').toLowerCase().trim();

  // Strict email guard
  if (!isOwnerEmail(normalizedEmail)) {
    throw new Error('Access denied: Unauthorized owner credentials.');
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

  if (authError) {
    throw authError;
  }

  // Verify profile role in database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile || profile.role !== 'OWNER' || !profile.is_active) {
    // Force sign out if not valid active OWNER
    await supabase.auth.signOut();
    throw new Error('Unauthorized: This account does not possess active OWNER privileges.');
  }

  return { user: authData.user, profile };
}

/**
 * Sign out owner
 */
export async function logoutOwner() {
  await supabase.auth.signOut();
}

/**
 * Check current authenticated owner session and profile
 */
export async function getOwnerSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return null;
    }

    if (!isOwnerEmail(session.user.email)) {
      await supabase.auth.signOut();
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile || profile.role !== 'OWNER' || !profile.is_active) {
      await supabase.auth.signOut();
      return null;
    }

    return { user: session.user, profile };
  } catch (err) {
    console.error('Error verifying owner session:', err);
    return null;
  }
}

/**
 * Subscribe to auth changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const owner = await getOwnerSession();
      callback(owner);
    } else {
      callback(null);
    }
  });
}
