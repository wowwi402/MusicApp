// app/(tabs)/playlists.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const PLAYLIST_KEY = 'playlist:default'; // "My Playlist"

export default function PlaylistsScreen() {
  const [songs, setSongs] = useState<Song[]>([]);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(PLAYLIST_KEY);
      setSongs(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch {
      setSongs([]);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function removeSong(id: string) {
    const next = songs.filter((s) => s.id !== id);
    setSongs(next);
    await AsyncStorage.setItem(PLAYLIST_KEY, JSON.stringify(next));
  }

  const openPlayer = (index: number) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(songs), index: String(index) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Playlist ({songs.length})</Text>

      {songs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ opacity: 0.6 }}>Chưa có bài nào. Vào Player → “+ Add to Playlist”.</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <TouchableOpacity style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }} onPress={() => openPlayer(index)}>
                <Image source={{ uri: item.cover }} style={styles.cover} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.artist}>{item.artist}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeSong(item.id)} style={styles.removeBtn}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: '700', padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
    padding: 12,
    borderRadius: 12,
  },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { opacity: 0.6 },
  removeBtn: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0245e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
