import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type AuthState = {
  loading: boolean;        // true until we know the auth state
  userId: string | null;   // current user id (or null)
  email: string | null;    // current user email (or null)
  justSignedIn: boolean;   // true right after returning from a magic link
};

export function useAuth(): {
  loading: boolean;
  userId: string | null;
  email: string | null;
  justSignedIn: boolean;
  signInWithEmail: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    loading: true,
    userId: null,
    email: null,
    justSignedIn: false,
  });

  useEffect(() => {
    let mounted = true;

    const detectMagicLinkReturn = () => {
      // If the URL contains auth params (magic link / oauth), mark as justSignedIn
      // We don't rely on a specific param name—cover the common ones.
      const url = new URL(window.location.href);
      const hasAuthParams =
        url.searchParams.has('code') ||
        url.searchParams.has('token_hash') ||
        url.hash.includes('access_token');

      if (hasAuthParams) {
        // Clean the URL so refreshes are nice
        try {
          window.history.replaceState({}, document.title, url.origin + url.pathname);
        } catch {}
        return true;
      }
      return false;
    };

    const init = async () => {
      const maybeJustSignedIn = detectMagicLinkReturn();

      // Supabase persists session in localStorage by default on web.
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;
      setState((s) => ({
        ...s,
        loading: false,
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        justSignedIn: maybeJustSignedIn, // we’ll flip this on the first load after redirect
      }));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({
        ...s,
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
      }));
    });

    init();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Passwordless email sign-in (magic link)
  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }, // back to your app
    });
    if (error) throw error;
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Optional: also clear justSignedIn
    setState((s) => ({ ...s, justSignedIn: false }));
  }, []);

  return {
    loading: state.loading,
    userId: state.userId,
    email: state.email,
    justSignedIn: state.justSignedIn,
    signInWithEmail,
    signOut,
  };
}
