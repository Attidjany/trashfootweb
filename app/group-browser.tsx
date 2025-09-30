// app/group-browser.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

type Group = { id: string; name: string; code?: string | null; created_at?: string | null };

export default function GroupBrowser() {
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    (async () => {
      try {
        if (!userId) {
          Alert.alert('Sign in required', 'Please log in to browse groups.');
          router.replace('/auth');
          return;
        }
        // keep the select minimal to avoid column mismatches
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
  }, [userId, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading groups…</Text>
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
                style={styles.button}
                onPress={() => router.push(`/group-details?groupId=${item.id}`)}
              >
                <Text style={styles.buttonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.muted}>No groups yet</Text></View>
        }
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
