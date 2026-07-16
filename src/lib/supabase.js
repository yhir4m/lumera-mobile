import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Toggle for Sprint Mock mode (defaults to true for local testing without credentials)
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false';

let supabaseClient;

if (USE_MOCK) {
  console.log('[Supabase] Running in MOCK session mode');
  const MOCK_STORAGE_KEY = 'sb-mock-auth-token';
  let listeners = [];
  let currentSession = null;
  let sessionLoaded = false;
  let loadPromise = null;

  const loadSession = async () => {
    if (sessionLoaded) return currentSession;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const stored = await ExpoSecureStoreAdapter.getItem(MOCK_STORAGE_KEY);
        if (stored) {
          currentSession = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('[Supabase Mock] Failed to load mock session', e);
      } finally {
        sessionLoaded = true;
        loadPromise = null;
      }
      return currentSession;
    })();
    return loadPromise;
  };

  const saveSession = async (session) => {
    currentSession = session;
    try {
      if (session) {
        await ExpoSecureStoreAdapter.setItem(MOCK_STORAGE_KEY, JSON.stringify(session));
      } else {
        await ExpoSecureStoreAdapter.removeItem(MOCK_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[Supabase Mock] Failed to save mock session', e);
    }
  };

  // Pre-load session eagerly
  loadSession();

  // Store the real API token so signInWithPassword can use it
  // instead of generating a fake mock token.
  let _realApiToken = null;

  const mockAuth = {
    // Called after passwordLogin to store the real JWT from the API
    setRealToken(token) {
      _realApiToken = token;
    },

    async getSession() {
      const session = await loadSession();
      return { data: { session }, error: null };
    },

    onAuthStateChange(callback) {
      listeners.push(callback);
      
      // Trigger callback asynchronously with current state
      loadSession().then((session) => {
        if (listeners.includes(callback)) {
          callback('INITIAL_SESSION', session);
        }
      });

      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners = listeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ phone, password, orgId }) {
      console.log('[Supabase Mock] signInWithPassword called', { phone, orgId });
      const activeOrgId = orgId || 'org_amanecer';
      // Use the real API token if available; fall back to mock only when no real token exists
      const tokenToUse = _realApiToken || `mock-jwt-token-sprint2-${activeOrgId}`;
      const session = {
        access_token: tokenToUse,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-123',
          email: 'demo@lumera.mx',
          phone: phone || '+525512345678',
          user_metadata: {
            first_name: 'Administrador',
            last_name: 'Demo',
            active_org_id: activeOrgId,
          },
        },
      };
      await saveSession(session);
      listeners.forEach((cb) => cb('SIGNED_IN', session));
      return { data: { session }, error: null };
    },

    async updateSession(session) {
      console.log('[Supabase Mock] updateSession called', session);
      await saveSession(session);
      listeners.forEach((cb) => cb('USER_UPDATED', session));
      return { data: { session }, error: null };
    },

    async signUp({ phone, password, options }) {
      console.log('[Supabase Mock] signUp called (phone-first confirmation pending)', { phone, options });
      const metadata = options?.data || {};
      const user = {
        id: 'mock-user-123',
        email: metadata.email || 'demo@lumera.mx',
        phone: phone || '+525512345678',
        user_metadata: {
          first_name: metadata.first_name || 'Administrador',
          last_name: metadata.last_name || 'Demo',
        },
      };
      // For phone-first registration with later OTP/password setup,
      // no session is returned immediately.
      return { data: { user, session: null }, error: null };
    },

    async signOut() {
      console.log('[Supabase Mock] signOut called');
      await saveSession(null);
      listeners.forEach((cb) => cb('SIGNED_OUT', null));
      return { error: null };
    },
  };

  supabaseClient = {
    auth: mockAuth,
  };
}

/*
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
*/

export const supabase = supabaseClient;

