import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function DebugAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) { setSession(session); setLoading(false); }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return <View style={s.center}><ActivityIndicator /><Text style={s.muted}>Checking session…</Text></View>;
  }

  return (
    <View style={s.page}>
      <Text style={s.title}>Debug Auth</Text>
      <Text style={s.mono}>userId: {session?.user?.id ?? 'null'}</Text>
      <Text style={s.mono}>email: {session?.user?.email ?? 'null'}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#0F172A',padding:16},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0F172A'},
  muted:{color:'#94a3b8',marginTop:8},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:8},
  mono:{color:'#e5e7eb',fontFamily:'monospace',marginTop:6},
});
