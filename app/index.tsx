import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function Index() {
  const router = useRouter();
  const { userId, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (loading) return;

    hasRedirected.current = true;
    if (userId) {
      router.replace('/profile'); // safer on web than /(tabs)/home
    } else {
      router.replace('/auth');
    }
  }, [userId, loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0EA5E9" />
      <Text style={styles.loadingText}>{loading ? 'Checking session…' : 'Redirecting…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#64748B', marginTop: 16, fontSize: 16 },
});
