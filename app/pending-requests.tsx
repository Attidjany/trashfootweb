import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { listPendingRequests, approveJoinRequest } from '@/lib/groups';

export default function PendingRequestsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const rows = await listPendingRequests();
      setItems(rows);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onApprove = async (id: string) => {
    try {
      await approveJoinRequest(id);
      Alert.alert('Approved', 'User added as member.');
      await load();
    } catch (e: any) {
      Alert.alert('Approve failed', e.message ?? 'Not authorized or invalid request.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Pending Requests</Text>
        <Text style={styles.muted}>No pending requests</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Pending Requests</Text>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.groups?.name ?? 'Unknown group'}</Text>
            <Text style={styles.meta}>
              Requested by {item.requester?.username ?? item.user_id.slice(0, 8)} • {new Date(item.requested_at).toLocaleString()}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.id)}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  center: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  muted: { color: '#94a3b8', marginTop: 8 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  meta: { color: '#94a3b8', marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  approveBtn: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  approveText: { color: '#fff', fontWeight: '700' },
  linkBtn: { marginTop: 12 },
  link: { color: '#60a5fa' },
});
