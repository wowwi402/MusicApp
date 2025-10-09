// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ThemeProvider, useAppTheme } from './theme';

function TabsInner() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.bgFrom, borderTopColor: '#00000022' },
        headerStyle: { backgroundColor: colors.bgFrom },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />
      }} />
      <Tabs.Screen name="explore" options={{
        title: 'Explore',
        tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />
      }} />
      <Tabs.Screen name="favorites" options={{
        title: 'Favorites',
        tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />
      }} />
      <Tabs.Screen name="playlists" options={{
        title: 'Playlists',
        tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />
      }} />
      <Tabs.Screen name="history" options={{
        title: 'History',
        tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />
      }} />
      <Tabs.Screen name="player" options={{ href: null }} />
    </Tabs>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <TabsInner />
    </ThemeProvider>
  );
}
