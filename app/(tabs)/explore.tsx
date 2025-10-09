// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SONGS } from '../lib/catalog';
import { useAppTheme } from './theme';

export default function ExploreScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return SONGS;
    return SONGS.filter(s => s.title.toLowerCase().includes(k) || s.artist.toLowerCase().includes(k));
  }, [q]);

  const openPlayer = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(data), index: String(index) } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgFrom }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>Explore</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.card }]}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.sub} />
        <TextInput
          placeholder="Tìm bài hát, nghệ sĩ…"
          placeholderTextColor={colors.sub}
          value={q}
          onChangeText={setQ}
          style={[styles.input, { color: colors.text, backgroundColor: colors.input }]}
        />
        {!!q && (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={colors.sub} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => openPlayer(index)} style={[styles.card, { backgroundColor: colors.card }]}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: colors.sub }} numberOfLines={1}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: colors.sub, paddingHorizontal:12 }}>Không có kết quả phù hợp.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },
  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  header: { fontSize:18, fontWeight:'800' },
  themeBtn: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },

  searchRow: {
    marginHorizontal: 12, marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  input: { flex:1, borderRadius:12, paddingHorizontal:12, height:40 },

  card: { flexDirection:'row', alignItems:'center', gap: 12, padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { fontWeight:'700' },
});
