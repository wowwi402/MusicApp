// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './theme';

import type { Song } from '../lib/catalog';
import { SONGS } from '../lib/catalog';
import * as FAV from '../lib/favorites';
import * as PL from '../lib/playlists';

// NEW: recent search helper
import * as SR from '../lib/searches';

export default function ExploreScreen() {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  // load recent at mount
  useEffect(() => {
    (async () => setRecent(await SR.getAll()))();
  }, []);

  // data filtered
  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return SONGS;
    return SONGS.filter(
      (s) => s.title.toLowerCase().includes(k) || s.artist.toLowerCase().includes(k),
    );
  }, [q]);

  const openPlayer = (index: number) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(data), index: String(index) },
    });
  };

  const onLongPress = (item: Song, index: number) => {
    Alert.alert(item.title, item.artist, [
      { text: 'Play', onPress: () => openPlayer(index) },
      {
        text: 'Add to Favorites',
        onPress: async () => {
          await FAV.toggleFavorite(item);
          Alert.alert('✅', 'Đã cập nhật Favorites');
        },
      },
      {
        text: 'Add to Playlist',
        onPress: async () => {
          try {
            let target = (await PL.getLastUsed()) || (await PL.getAllNames())[0];
            if (!target) {
              target = 'My Playlist';
              await PL.createPlaylist(target);
            }
            await PL.addSong(target, item);
            await PL.setLastUsed(target);
            Alert.alert('✅', `Đã thêm vào "${target}"`);
          } catch {
            Alert.alert('Lỗi', 'Không thể thêm vào playlist');
          }
        },
      },
      { text: 'Đóng', style: 'cancel' },
    ]);
  };

  // when user submits a term → save recent
  const submitSearch = async () => {
    const term = q.trim();
    if (!term) return;
    await SR.add(term);
    setRecent(await SR.getAll());
  };

  const applyRecent = async (term: string) => {
    setQ(term);
  };

  const removeRecent = async (term: string) => {
    await SR.remove(term);
    setRecent(await SR.getAll());
  };

  const clearAllRecent = async () => {
    await SR.clear();
    setRecent([]);
  };

  return (
    <View style={styles.container}>
      {/* Search box */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.sub} />
        <TextInput
          placeholder="Tìm bài hát, nghệ sĩ…"
          placeholderTextColor="#94a3b8"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
          style={styles.input}
        />
        {q ? (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={colors.sub} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Recent chips */}
      {recent.length > 0 && (
        <View style={styles.recentWrap}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Tìm gần đây</Text>
            <TouchableOpacity onPress={clearAllRecent}>
              <Text style={styles.recentClear}>Xoá hết</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          >
            {recent.map((term) => (
              <View key={term} style={styles.chip}>
                <TouchableOpacity onPress={() => applyRecent(term)}>
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipDel} onPress={() => removeRecent(term)}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Result list */}
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => openPlayer(index)}
            onLongPress={() => onLongPress(item, index)}
            style={styles.card}
          >
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: colors.sub }}>Không có kết quả phù hợp.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },

  searchRow: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff12',
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },

  recentWrap: { marginBottom: 4 },
  recentHeader: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTitle: { color: colors.sub, fontWeight: '700' },
  recentClear: { color: '#93c5fd' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff12',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  chipText: { color: '#fff' },
  chipDel: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000033',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff10',
    borderRadius: 14,
  },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color: colors.text, fontWeight: '700' },
  artist: { color: colors.sub },
});
