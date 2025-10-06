// app/(tabs)/history.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from './theme';

import type { Song } from '../lib/history';
import * as History from '../lib/history';

export default function HistoryScreen() {
  const [items, setItems] = useState<Song[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const list = await History.getAll();
    setItems(list);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return items;
    return items.filter(s =>
      s.title.toLowerCase().includes(k) || s.artist.toLowerCase().includes(k)
    );
  }, [items, q]);

  const playFrom = (index: number) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(data), index: String(index) },
    });
  };

  const removeOne = async (id: string) => {
    await History.remove(id);
    await load();
  };

  const clearAll = () => {
    Alert.alert('Xoá lịch sử', 'Bạn muốn xoá toàn bộ lịch sử nghe?', [
      { text: 'Hủy' },
      { text: 'Xoá', style: 'destructive', onPress: async () => { await History.clear(); await load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>History ({items.length})</Text>
        {!!items.length && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={{ color:'#fff', fontWeight:'700' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.sub} />
        <TextInput
          placeholder="Tìm trong lịch sử…"
          placeholderTextColor="#94a3b8"
          value={q}
          onChangeText={setQ}
          style={styles.input}
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
          <Text style={{ color:'#9aa4b2' }}>
            {items.length === 0 ? 'Chưa có lịch sử.' : 'Không thấy kết quả phù hợp.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it, idx) => it.id + '-' + idx}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => playFrom(index)} style={styles.left}>
                <Image source={{ uri: item.cover }} style={styles.cover} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection:'row', gap:6 }}>
                <TouchableOpacity onPress={() => playFrom(index)} style={styles.playBtn}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0b1220' },

  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  header: { color:'#fff', fontSize:18, fontWeight:'800' },
  clearBtn: { backgroundColor:'#e11d48', paddingHorizontal:12, paddingVertical:8, borderRadius:10 },

  searchRow: {
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor:'#ffffff12', borderRadius:12,
    flexDirection:'row', alignItems:'center', gap:8,
    paddingHorizontal:10, paddingVertical:6,
  },
  input: { flex:1, color: colors.text },

  empty: { flex:1, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#ffffff10', borderRadius:14, padding:12 },
  left: { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  cover: { width:56, height:56, borderRadius:8, backgroundColor:'#111' },
  title: { color:'#fff', fontWeight:'700' },
  artist: { color:'#9ca3af' },

  playBtn: { width:36, height:36, borderRadius:18, backgroundColor:colors.primary, alignItems:'center', justifyContent:'center' },
  removeBtn: { width:36, height:36, borderRadius:18, backgroundColor:'#ef4444', alignItems:'center', justifyContent:'center' },
});
