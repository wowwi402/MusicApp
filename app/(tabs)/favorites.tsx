import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // ✅ thêm dòng này
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


type Song = { id: string; title: string; artist: string; url: string; cover: string };
const KEY = 'favorites';

export default function FavoritesScreen() {
  const [data, setData] = useState<Song[]>([]);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setData(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch {
      setData([]);
    }
  }

 useFocusEffect(
  useCallback(() => {
    load();            // chạy mỗi lần màn hình được focus
  }, [])
);

  const openPlayer = (song: Song) => {
    // Mở player với 1 danh sách chỉ có bài này (đơn giản)
    router.push({ pathname: '/player', params: { queue: JSON.stringify([song]), index: '0' } });
  };

  if (data.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, opacity: 0.6 }}>Chưa có bài nào ❤️. Hãy thêm từ Player!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openPlayer(item)}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
            <Text style={styles.play}>▶</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f4f6f8', padding: 12, borderRadius: 12 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { opacity: 0.6 },
  play: { fontSize: 20, width: 24, textAlign: 'right' },
});
