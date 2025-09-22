// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import MiniPlayer from '../components/MiniPlayer';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="player" options={{ title: 'Player' }} />
      <Tabs.Screen name="playlists" options={{ title: 'Playlists' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <MiniPlayer />
    </Tabs>
  );
}
