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

  // Sign up with email+password, then set username into profiles
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If email confirmation is off or already confirmed, session is present; upsert username
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id);
      if (upErr) throw upErr;
    }
    return true;
  }, []);

  // Sign in with email OR username + password
  const signIn = useCallback(async (identifier: string, password: string) => {
    let emailToUse = identifier.trim();

    if (!emailToUse.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_for_username', {
        p_username: emailToUse,
      });
      if (error) throw error;
      if (!data) throw new Error('Username not found');
      emailToUse = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
    if (error) throw error;
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { loading, userId, email, signUp, signIn, signOut };
}
