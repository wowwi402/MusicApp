// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './theme';

function ThemedTabs() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.primary as string,
          tabBarInactiveTintColor: colors.sub as string,
        }}
      >
        {/* ... các Tabs.Screen ... */}
      </Tabs>
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemedTabs />
    </ThemeProvider>
  );
}
