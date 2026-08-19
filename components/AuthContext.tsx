'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  authError: null,
  setAuthError: () => {},
  clearAuthError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthErrorState] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthErrorState(null);
  }, []);

  const setAuthError = useCallback((err: string | null) => {
    setAuthErrorState(err);
  }, []);

  useEffect(() => {
    // Intercept OAuth error hash/query parameter on page load
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash.includes('error=') || search.includes('error=')) {
        const rawStr = hash || search;
        let friendlyMsg = 'Unable to sign in with Google. Please try again.';

        if (
          rawStr.includes('unsupported_provider') ||
          rawStr.includes('provider+is+not+enabled') ||
          rawStr.includes('not_enabled') ||
          rawStr.includes('validation_failed')
        ) {
          friendlyMsg = 'Unable to sign in with Google. Please try again or sign in with your email.';
        } else if (rawStr.includes('access_denied') || rawStr.includes('user_cancelled')) {
          friendlyMsg = 'Sign in was cancelled. Please try again.';
        }

        setAuthErrorState(friendlyMsg);

        // Sanitize URL hash/search to prevent raw error page or black screen from displaying
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, document.title, cleanUrl);
        } catch (e) {
          console.warn('Could not clean URL state:', e);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setAuthErrorState(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, authError, setAuthError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
