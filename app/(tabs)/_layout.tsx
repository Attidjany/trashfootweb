// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Home, Trophy, BarChart3, MessageCircle, User, ListChecks } from 'lucide-react-native';

export default function TabsLayout() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0EA5E9',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
      }}
    >
      {/* Edit these to match your files in app/(tabs)/ */}
      <Tabs.Screen
        name="home"         // must match app/(tabs)/home.tsx
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="matches"           // must match app/(tabs)/matches.tsx
        options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="stats"      // remove this line if you don’t have the file
        options={{ title: 'Stats', tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="chat"              // must match app/(tabs)/chat.tsx
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"           // must match app/(tabs)/profile.tsx
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }});
