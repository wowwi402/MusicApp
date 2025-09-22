// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MiniPlayer from '../components/MiniPlayer';
import { colors } from './theme';


const SONGS = [
  { id: '1', title: 'SoundHelix Song 1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/1/600' },
  { id: '2', title: 'SoundHelix Song 2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/seed/2/600' },
  { id: '3', title: 'SoundHelix Song 3', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/seed/3/600' },
];

export default function HomeScreen() {
  const openPlayer = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(SONGS), index: String(index) } });
  };

  return (
    <LinearGradient colors={[colors.bgFrom, colors.bgTo]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Ionicons name="musical-notes" size={20} color={colors.sub} />
      </View>

      <FlatList
        data={SONGS}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => openPlayer(index)}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <View style={styles.playBtn}><Ionicons name="play" size={18} color="#fff" /></View>
          </TouchableOpacity>
        )}
      />
      <MiniPlayer />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff10', padding: 12, borderRadius: 16 },
  cover: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#111' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  artist: { color: colors.sub, marginTop: 2 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
