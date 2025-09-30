import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { isSuperAdmin } from '@/lib/admin';
import { useSessionUser } from '@/hooks/use-session-user';

export default function SuperAdminLogin() {
  const router = useRouter();
  const { loading: authLoading, userId } = useSessionUser();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = async () => {
    try {
      setError(null);
      setChecking(true);
      const ok = await isSuperAdmin();
      if (!ok) {
        setError('Your account is not a super admin.');
        return;
      }
      router.replace('/admin');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to verify access');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // If already logged in and super admin, shortcut
    const auto = async () => {
      if (!userId || authLoading) return;
      try {
        const ok = await isSuperAdmin();
        if (ok) router.replace('/admin');
      } catch {}
    };
    auto();
  }, [userId, authLoading]);

  if (authLoading) {
    return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Checking session…</Text></View>;
  }

  if (!userId) {
    return <View style={styles.center}><Text style={styles.muted}>Please sign in first.</Text></View>;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Super Admin Access</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={enter} disabled={checking}>
        {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enter Admin</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginBottom: 12 },
  muted: { color: '#94A3B8', marginTop: 8 },
  error: { color: '#F87171', marginVertical: 8, textAlign: 'center' },
  btn: { backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' as const },
});
