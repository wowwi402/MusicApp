// app/_layout.tsx
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  React.useEffect(() => {
    if (!loaded) return;
    // ✅ Ép kiểu để TS không báo lỗi
    const RNText = Text as any;
    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.style = [{ fontFamily: 'Inter_500Medium' }];
  }, [loaded]);

  if (!loaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
