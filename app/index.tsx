import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/hooks/use-game-store';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading, isHydrated } = useGameStore();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }

    // Normal redirect after hydration
    if (isHydrated && !isLoading) {
      hasRedirected.current = true;

      if (currentUser) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    } else {
      // Safety net: if hydration takes too long, redirect to onboarding
      const timeout = setTimeout(() => {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/onboarding');
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [currentUser, isLoading, isHydrated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0EA5E9" />
      <Text style={styles.loadingText}>
        {!isHydrated
          ? 'Initializing...'
          : isLoading
          ? 'Loading...'
          : 'Redirecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 16,
    fontSize: 16,
  },
});
