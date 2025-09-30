import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Group = { id: string; name: string; code?: string | null; created_at?: string | null };

export default function GroupBrowser() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session?.user);
        if (!session?.user) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('groups')
          .select('id,name,code,created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGroups(data ?? []);
      } catch (e: any) {
        Alert.alert('Groups error', e.message ?? 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading groups…</Text>
      </View>
    );
  }

  if (!hasSession) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Browse Groups</Text>
        <Text style={styles.muted}>Please log in to view groups.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/auth')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Browse Groups</Text>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {item.created_at ? (
              <Text style={styles.meta}>Created {new Date(item.created_at).toLocaleDateString()}</Text>
            ) : null}
            <View style={styles.row}>
              <TouchableOpacity
  style={styles.viewButton}
  onPress={() => router.push(`/group-details?groupId=${group.id}`)}
>
  <Text style={styles.viewButtonText}>View</Text>
</TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.muted}>No groups yet</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  center: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#94a3b8', marginTop: 8 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  meta: { color: '#94a3b8', marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { backgroundColor: '#0EA5E9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
