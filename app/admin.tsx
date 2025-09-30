import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionUser } from '@/hooks/use-session-user';
import { isSuperAdmin, adminListGroups, adminListJoinRequests, adminListProfiles, adminApproveRequest, adminRejectRequest } from '@/lib/admin';

export default function AdminScreen() {
  const router = useRouter();
  const { loading: authLoading, userId } = useSessionUser();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);
      const [g, p, r] = await Promise.all([
        adminListGroups(),
        adminListProfiles(),
        adminListJoinRequests(),
      ]);
      setGroups(g);
      setProfiles(p);
      setRequests(r);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const gate = async () => {
      if (authLoading) return;
      if (!userId) { setAllowed(false); setChecking(false); return; }
      const ok = await isSuperAdmin();
      setAllowed(ok);
      setChecking(false);
      if (ok) load();
    };
    gate();
  }, [authLoading, userId]);

  if (checking) {
    return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Checking access…</Text></View>;
  }
  if (!allowed) {
    return <View style={styles.center}><Text style={styles.muted}>No access. Use Settings → Super Admin.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.card}>
        <View style={styles.rowHead}>
          <Text style={styles.cardTitle}>Groups</Text>
          <TouchableOpacity style={styles.btnSmall} onPress={load}><Text style={styles.btnSmallText}>Refresh</Text></TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : err ? (
          <Text style={styles.error}>{err}</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.muted}>No groups.</Text>
        ) : (
          groups.map(g => (
            <View key={g.id} style={styles.row}>
              <Text style={styles.rowMain}>{g.name}</Text>
              <Text style={styles.rowSub}>{g.members_count} members • {g.pending_requests} pending</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Join Requests</Text>
        {loading ? (
          <ActivityIndicator />
        ) : requests.length === 0 ? (
          <Text style={styles.muted}>No pending requests.</Text>
        ) : (
          requests.map(r => (
            <View key={`${r.group_id}-${r.user_id}`} style={[styles.row, { alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowMain}>{r.username ?? r.user_id.slice(0,8)}</Text>
                <Text style={styles.rowSub}>{r.group_name}</Text>
              </View>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={async () => { await adminApproveRequest(r.group_id, r.user_id); load(); }}>
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={async () => { await adminRejectRequest(r.group_id, r.user_id); load(); }} >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profiles</Text>
        {loading ? (
          <ActivityIndicator />
        ) : profiles.length === 0 ? (
          <Text style={styles.muted}>No profiles yet.</Text>
        ) : (
          profiles.map(p => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.rowMain}>{p.username ?? p.name ?? p.gamehandle ?? p.id.slice(0,8)}</Text>
              <Text style={styles.rowSub}>{new Date(p.created_at ?? Date.now()).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginBottom: 12 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' as const, marginBottom: 8 },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#334155' },
  rowMain: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
  rowSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnSmall: { backgroundColor: '#0EA5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnSmallText: { color: '#fff', fontWeight: '700' as const },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  muted: { color: '#94A3B8', marginTop: 8 },
  error: { color: '#F87171' },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' as const },
});
