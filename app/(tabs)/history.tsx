import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const HISTORY_KEY = 'favorites:list';

export default function FavoritesScreen() {
  const [items, setItems] = useState<Song[]>([]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      setItems(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch { setItems([]); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const playFromFav = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(items), index: String(index) } });
  };

  const removeOne = async (id: string) => {
    const next = items.filter(s => s.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setItems(next);
  };

  const clearAll = () => {
    Alert.alert('Xóa tất cả', 'Bạn chắc chắn muốn xóa toàn bộ Favorites?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(HISTORY_KEY);
        setItems([]);
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Favorites ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: '#777' }}>Chưa có bài nào được ❤️. Vào Player bấm trái tim nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => it.id + '-' + idx}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', flex:1, gap:12 }} onPress={() => playFromFav(index)}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: '#0b1220' },
  headerRow: { padding: 16, paddingBottom: 8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  clearBtn: { backgroundColor: '#e0245e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  empty: { flex:1, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: '#ffffff10', padding: 12, borderRadius: 16 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color: '#fff', fontFamily:'Inter_700Bold' },
  artist: { color: '#9ca3af', fontFamily:'Inter_400Regular' },

  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center' },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems:'center', justifyContent:'center' },
});
