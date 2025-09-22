// app/(tabs)/history.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const HISTORY_KEY = 'history:list';

export default function HistoryScreen() {
  const [items, setItems] = useState<Song[]>([]);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      setItems(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch {
      setItems([]);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const playFromHistory = (index: number) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(items), index: String(index) },
    });
  };

  const clearAll = async () => {
    Alert.alert('Xóa lịch sử', 'Bạn có chắc muốn xóa toàn bộ lịch sử?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(HISTORY_KEY);
          setItems([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>History ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ opacity: 0.6 }}>Chưa có lịch sử. Mở Player để nghe nhạc nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => it.id + '-' + idx}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.card} onPress={() => playFromHistory(index)}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <Text style={styles.play}>▶</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  header: { fontSize: 22, fontWeight: '700' },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#e0245e' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f4f6f8', padding: 12, borderRadius: 12 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { opacity: 0.6 },
  play: { fontSize: 20, width: 24, textAlign: 'right' },
});
