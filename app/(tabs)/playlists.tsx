// app/(tabs)/playlists.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MiniPlayer from '../components/MiniPlayer';
import { colors } from './theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const PLAYLIST_KEY = 'playlist:default';

export default function PlaylistsScreen() {
  const [items, setItems] = useState<Song[]>([]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(PLAYLIST_KEY);
      setItems(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch {
      setItems([]);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const playFromPlaylist = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(items), index: String(index) } });
  };

  const removeOne = async (id: string) => {
    const next = items.filter(s => s.id !== id);
    await AsyncStorage.setItem(PLAYLIST_KEY, JSON.stringify(next));
    setItems(next);
  };

  const clearAll = () => {
    Alert.alert('Xóa Playlist', 'Bạn có chắc muốn xóa toàn bộ Playlist?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(PLAYLIST_KEY);
        setItems([]);
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Playlist ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: '#777' }}>Chưa có bài nào trong Playlist. Hãy mở Player và bấm nút ➕.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => it.id + '-' + idx}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', flex:1, gap:12 }} onPress={() => playFromPlaylist(index)}>
                <Image source={{ uri: item.cover }} style={styles.cover} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <Ionicons name="play" size={18} color="#fff" style={styles.playBtn} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeOne(item.id)} style={styles.removeBtn}>
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
              <MiniPlayer />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: '#0b1220' },
  headerRow: { padding: 16, paddingBottom: 8, flexDirection: 'row', justifyContent:'space-between', alignItems:'center' },
  header: { color: '#fff', fontSize: 22, fontWeight: '800' },
  clearBtn: { backgroundColor: '#e0245e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  empty: { flex:1, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: '#ffffff10', marginHorizontal: 16, padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color: '#fff', fontWeight:'700' },
  artist: { color: '#9ca3af' },
  playBtn: { backgroundColor: colors.primary, padding: 8, borderRadius: 10 },
  removeBtn: { marginLeft: 10, backgroundColor: '#ef4444', padding: 8, borderRadius: 10 },
});
