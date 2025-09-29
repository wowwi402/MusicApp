// app/(tabs)/favorites.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FAV from '../lib/favorites';
import { colors } from './theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string };

export default function FavoritesScreen() {
  const [items, setItems] = useState<Song[]>([]);
  const [q, setQ] = useState('');

  const load = async () => setItems(await FAV.getFavorites());
  useFocusEffect(useCallback(() => { load(); }, []));

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return items;
    return items.filter(s =>
      s.title.toLowerCase().includes(k) || s.artist.toLowerCase().includes(k)
    );
  }, [items, q]);

  const playFromFav = (index: number) => {
    router.replace({ pathname: '/player', params: { queue: JSON.stringify(data), index: String(index) } });
  };

  const removeOne = async (id: string) => {
    await FAV.removeFavorite(id);
    await load();
  };

  const clearAll = () => {
    Alert.alert('Xoá Favorites', 'Bạn chắc chắn muốn xoá tất cả?', [
      { text: 'Hủy' },
      { text: 'Xoá', style: 'destructive', onPress: async () => { await FAV.clearFavorites(); await load(); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header + Clear */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Favorites ({items.length})</Text>
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search trong Favorites */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.sub} />
          <TextInput
            placeholder="Tìm trong favorites..."
            placeholderTextColor="#94a3b8"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={18} color={colors.sub} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* List */}
        {data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: '#777' }}>
              {items.length === 0 ? 'Chưa có bài nào ❤️.' : 'Không tìm thấy bài phù hợp.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={{ flexDirection:'row', alignItems:'center', flex:1, gap:12 }}
                  onPress={() => playFromFav(index)}
                >
                  <Image source={{ uri: item.cover }} style={styles.cover} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection:'row', gap:6 }}>
                  <TouchableOpacity onPress={() => playFromFav(index)} style={styles.playBtn}>
                    <Ionicons name="play" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeOne(item.id)} style={styles.removeBtn}>
                    <Ionicons name="trash" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1220' },        // ✅ safe area với nền
  container: { flex:1, backgroundColor: '#0b1220' },

  headerRow: { padding: 12, paddingBottom: 8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { color: '#fff', fontSize: 18, fontWeight: '800' },
  clearBtn: { backgroundColor: '#e0245e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  searchRow: {
    marginHorizontal: 12,
    backgroundColor: '#ffffff12',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text },

  empty: { flex:1, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: '#ffffff10', padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color: '#fff', fontWeight:'700' },
  artist: { color: '#9ca3af' },

  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems:'center', justifyContent:'center' },
});
