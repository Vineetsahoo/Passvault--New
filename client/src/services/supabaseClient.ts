import { createClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in client/.env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * IMPORTANT — why this exists:
 * A lot of components in this app (Dashboard.tsx, UserProfile.tsx,
 * QrScan.tsx, Alerts.tsx, Sync.tsx, SecureStorage.tsx, MultiDevice.tsx,
 * notificationService.ts, storageService.ts, backupService.ts, ...) read
 * `localStorage.getItem('accessToken')` directly and build their own
 * Authorization header, instead of going through the shared `api` axios
 * instance. Rewriting all of those to call supabase-js directly would be a
 * much bigger change than the auth migration itself calls for right now.
 *
 * Instead, this listener keeps the SAME localStorage keys the old custom-JWT
 * flow used (accessToken, isAuthenticated, userData, mockAuth, userToken,
 * mockUser) in sync with the live Supabase session — including on silent
 * token refreshes. Every one of those existing call sites keeps working
 * unmodified. If you want to retire this shim later, the call sites to
 * change are the ones listed above.
 */
const syncLegacyAuthStorage = (session: Session | null) => {
  if (session) {
    const userPayload = JSON.stringify({
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name ?? session.user.email,
    });

    localStorage.setItem('accessToken', session.access_token);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userData', userPayload);
    localStorage.setItem('mockAuth', 'true');
    localStorage.setItem('userToken', session.access_token);
    localStorage.setItem('mockUser', userPayload);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('mockAuth');
    localStorage.removeItem('userToken');
    localStorage.removeItem('mockUser');
  }

  // Same-tab listeners (e.g. Dashboard.tsx's handleStorageChange) only fire
  // on a native 'storage' event from OTHER tabs — dispatch one manually so
  // this tab's own listeners pick up the change too.
  window.dispatchEvent(new Event('storage'));
};

supabase.auth.onAuthStateChange((_event, session) => {
  syncLegacyAuthStorage(session);
});

// Run once on load in case a session already exists (e.g. page refresh)
supabase.auth.getSession().then(({ data }) => {
  syncLegacyAuthStorage(data.session);
});

export default supabase;
