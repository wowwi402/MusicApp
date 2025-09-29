// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';


type Song = { id: string; title: string; artist: string; url: string; cover: string };

// Demo data — thay bằng dữ liệu thật nếu bạn có
const CATALOG: Song[] = [
  { id: '1', title: 'Song 1', artist: 'Artist A', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/a/800' },
  { id: '2', title: 'Song 2', artist: 'Artist B', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/seed/b/800' },
  { id: '3', title: 'Song 3', artist: 'Artist C', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/seed/c/800' },
  { id: '4', title: 'Song 4', artist: 'Artist D', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://picsum.photos/seed/d/800' },
  { id: '5', title: 'Song 5', artist: 'Artist E', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', cover: 'https://picsum.photos/seed/e/800' },
  { id: '6', title: 'Song 6', artist: 'Artist F', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', cover: 'https://picsum.photos/seed/f/800' },
];

const COLS = 2;
const GAP = 12;
const SCREEN_W = Dimensions.get('window').width;
const ITEM_W = Math.floor((SCREEN_W - GAP * (COLS + 1)) / COLS);
const ITEM_H = ITEM_W + 56; // ảnh vuông + dòng text

export default function ExploreScreen() {
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return CATALOG;
    return CATALOG.filter(s => s.title.toLowerCase().includes(k) || s.artist.toLowerCase().includes(k));
  }, [q]);

  const playFrom = (index: number) => {
    router.replace({ pathname: '/player', params: { queue: JSON.stringify(data), index: String(index) } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Explore</Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.sub} />
          <TextInput
            placeholder="Tìm bài / nghệ sĩ..."
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

        {/* Grid */}
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: GAP }}
          contentContainerStyle={{ gap: GAP, paddingVertical: GAP }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={[styles.card, { width: ITEM_W, height: ITEM_H }]} onPress={() => playFrom(index)}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color:'#9ca3af', paddingHorizontal:12 }}>Không có bài phù hợp.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1220' },
  container: { flex:1, backgroundColor:'#0b1220' },

  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { color:'#fff', fontSize:18, fontWeight:'800' },

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

  card: { backgroundColor:'#ffffff10', borderRadius:14, padding:10 },
  cover: { width: '100%', aspectRatio: 1, borderRadius: 10, marginBottom: 8, backgroundColor:'#111' },
  title: { color:'#fff', fontWeight:'700' },
  artist: { color:'#9ca3af' },
});
