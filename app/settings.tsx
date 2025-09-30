import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { userId, email, signOut } = useAuth();

  const onLogout = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (e: any) {
      Alert.alert('Logout error', e?.message ?? 'Failed to logout');
    }
  };

  return (
    <View style={s.page}>
      <Text style={s.title}>Settings</Text>

      <View style={s.card}>
        <Text style={s.label}>Signed in as</Text>
        <Text style={s.value}>{email ?? 'Unknown email'}</Text>
        <Text style={s.subtle}>User ID: {userId?.slice(0, 8) ?? '—'}</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={onLogout}>
        <Text style={s.btnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { color: '#94a3b8', marginBottom: 4 },
  value: { color: '#fff', fontWeight: '700' },
  subtle: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
  btn: { backgroundColor: '#0EA5E9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
