// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from './theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string; genre: string; duration: number };

const DATA: Song[] = [
  { id: '1', title: 'SoundHelix Song 1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/s1/300', genre: 'Pop',   duration: 360 },
  { id: '2', title: 'SoundHelix Song 2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/seed/s2/300', genre: 'Chill', duration: 280 },
  { id: '3', title: 'SoundHelix Song 3', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/seed/s3/300', genre: 'Indie', duration: 300 },
];

const GENRES = ['All', 'Pop', 'Chill', 'Indie'] as const;
type SortKey = 'az' | 'za' | 'dur_asc' | 'dur_desc';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<(typeof GENRES)[number]>('All');
  const [sortKey, setSortKey] = useState<SortKey>('az');

  const list = useMemo(() => {
    let arr = [...DATA];
    if (genre !== 'All') arr = arr.filter(s => s.genre === genre);
    const q = query.trim().toLowerCase();
    if (q) arr = arr.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    switch (sortKey) {
      case 'az':       arr.sort((a,b) => a.title.localeCompare(b.title)); break;
      case 'za':       arr.sort((a,b) => b.title.localeCompare(a.title)); break;
      case 'dur_asc':  arr.sort((a,b) => a.duration - b.duration); break;
      case 'dur_desc': arr.sort((a,b) => b.duration - a.duration); break;
    }
    return arr;
  }, [query, genre, sortKey]);

  const openPlayer = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(list), index: String(index) } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover</Text>

      {/* Search */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm bài hát / nghệ sĩ…"
        placeholderTextColor="#9ca3af"
        style={styles.search}
      />

      {/* Genres */}
      <FlatList
        data={[...GENRES]}
        keyExtractor={(g) => g}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ marginBottom: 8 }}
        renderItem={({ item }) => (
          <Chip label={item} selected={genre === item} onPress={() => setGenre(item)} />
        )}
      />

      {/* Sort */}
      <FlatList
        data={['A→Z','Z→A','Thời lượng ↑','Thời lượng ↓']}
        keyExtractor={(s) => s}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ marginBottom: 12 }}
        renderItem={({ item }) => {
          const map: Record<string, SortKey> = { 'A→Z':'az','Z→A':'za','Thời lượng ↑':'dur_asc','Thời lượng ↓':'dur_desc' };
          const key = map[item];
          return <Chip label={item} selected={sortKey === key} onPress={() => setSortKey(key)} />;
        }}
      />

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={(it, idx) => it.id + '-' + idx}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => openPlayer(index)}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <View style={styles.playBtn}><Ionicons name="play" size={18} color="#fff" /></View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color:'#9aa3af', padding:16 }}>Không có bài phù hợp.</Text>}
      />
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive, { marginRight: 8 }]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0b1220' },
  header: { color:'#fff', fontSize:22, fontWeight:'800', padding:16, paddingBottom:8 },
  search: { marginHorizontal:16, backgroundColor:'#1a2032', color:'#fff', borderRadius:12, paddingHorizontal:12, paddingVertical:10, marginBottom:8 },
  chip: { paddingVertical:6, paddingHorizontal:14, backgroundColor:'#1a2032', borderRadius:20 },
  chipActive: { backgroundColor:'#2a3350' },
  chipText: { color:'#aab', fontWeight:'600', fontSize:13 },
  chipTextActive: { color:'#fff' },
  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#ffffff10', padding:12, borderRadius:14 },
  cover: { width:56, height:56, borderRadius:8, backgroundColor:'#111' },
  title: { color:'#fff', fontWeight:'700' },
  artist: { color:'#9ca3af' },
  playBtn: { backgroundColor: colors.primary, padding:8, borderRadius:10, marginLeft: 10 },
});
