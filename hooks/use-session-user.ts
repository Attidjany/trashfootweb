// hooks/use-session-user.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  username?: string | null;
  name?: string | null;
  gamehandle?: string | null;
  created_at?: string | null;
};

export function useSessionUser() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // load session + profile
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      const eml = session?.user?.email ?? null;

      if (!mounted) return;
      setUserId(uid);
      setEmail(eml);

      if (uid) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, username, name, gamehandle, created_at')
          .eq('id', uid)
          .maybeSingle();
        if (!mounted) return;
        setProfile(prof ?? null);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      // profile will be reloaded lazily next time the screen mounts; keep it simple
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // convenient display name
  const displayName =
    profile?.username ??
    profile?.name ??
    profile?.gamehandle ??
    email ??
    (userId ? userId.slice(0, 8) : null);

  return {
    loading,
    userId,
    email,
    profile,
    displayName,
    signOut,
  };
}
