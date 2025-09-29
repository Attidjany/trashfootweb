import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
    });
    init();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Sign up with email + password, then set username on the profile
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // if sign-up requires email confirmation, profile row may not exist yet until confirmed.
    // We'll try to upsert the username; if the session isn't present yet, this will no-op.
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user?.id) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', sess.session.user.id);
    }
    return true;
  }, []);

  // Sign in with email OR username + password
  const signIn = useCallback(async (identifier: string, password: string) => {
  let id = identifier.trim();

  // If the input doesn't look like an email, try resolving as username
  if (!id.includes('@')) {
    const { data, error } = await supabase.rpc('get_email_for_username', { p_username: id.toLowerCase() });
    if (error) throw error;
    if (!data) {
      // Fall back to trying it as email anyway, in case user typed an email without '@'
      throw new Error('Username not found. Try your email instead.');
    }
    id = String(data);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: id,
    password,
  });
  if (signInError) throw signInError;

  return true;
}, []);


  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { loading, userId, email, signUp, signIn, signOut };
}
