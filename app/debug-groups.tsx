import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';

type Group = { id: string; name: string; code?: string|null; created_at?: string|null };

export default function DebugGroups() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setError('No session'); setLoading(false); return; }

        const { data, error } = await supabase
          .from('groups')
          .select('id,name,code,created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGroups(data ?? []);
      } catch (e:any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator/><Text style={s.muted}>Loading…</Text></View>;
  if (error) return <View style={s.page}><Text style={s.title}>Debug Groups</Text><Text style={s.err}>{error}</Text></View>;

  return (
    <View style={s.page}>
      <Text style={s.title}>Debug Groups</Text>
      <FlatList
        data={groups}
        keyExtractor={(g)=>g.id}
        renderItem={({item})=>(
          <View style={s.card}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.meta}>code: {item.code ?? '—'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.muted}>No groups found</Text>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#0F172A',padding:16},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0F172A'},
  muted:{color:'#94a3b8',marginTop:8},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:8},
  card:{backgroundColor:'#1E293B',padding:12,borderRadius:10,marginBottom:8},
  name:{color:'#fff',fontWeight:'700'},
  meta:{color:'#94a3b8',marginTop:4},
  err:{color:'#fca5a5'}
});
