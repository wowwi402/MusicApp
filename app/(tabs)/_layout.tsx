// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import MiniPlayer from '../components/MiniPlayer'; // từ (tabs) đi ra components
import { colors } from './theme'; // nếu theme ở ngoài (tabs) thì đổi thành ../theme

export default function TabsLayout() {
  const pathname = usePathname();
  // ẩn MiniPlayer khi đang ở màn hình Player
  const hideMini = pathname?.endsWith('/player') || pathname === '/player';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.sub,
          tabBarStyle: {
            backgroundColor: '#0b1220',
            borderTopColor: '#0b1220',
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'albums' : 'albums-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={20} color={color} />
            ),
          }}
        />

        {/* Ẩn Player khỏi thanh Tab */}
        <Tabs.Screen
          name="player"
          options={{
            href: null, // ẩn khỏi tab bar
            title: 'Player',
          }}
        />
      </Tabs>

      {/* MiniPlayer chỉ hiện khi KHÔNG ở màn hình Player */}
      {!hideMini && <MiniPlayer />}
    </View>
  );
}
