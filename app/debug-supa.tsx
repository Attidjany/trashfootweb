import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function DebugSupa() {
  const [status, setStatus] = useState<'checking'|'ok'|'fail'>('checking');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        // 1) Confirm we can read the current session (never throws if env is set)
        const { data: { session } } = await supabase.auth.getSession();

        // 2) Do a harmless query (may return 0 rows due to RLS, that's fine)
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;

        setStatus('ok');
        setDetails(`Connected. Session user: ${session?.user?.email ?? 'none'}`);
      } catch (e: any) {
        setStatus('fail');
        setDetails(e.message || String(e));
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase connection</Text>
      <Text style={{ color: status === 'ok' ? '#22c55e' : status === 'fail' ? '#ef4444' : '#eab308' }}>
        {status === 'checking' ? 'Checking…' : status === 'ok' ? 'OK' : 'FAILED'}
      </Text>
      <Text style={styles.details}>{details}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  details: { color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});
