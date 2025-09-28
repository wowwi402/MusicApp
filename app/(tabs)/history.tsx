// app/(tabs)/history.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const HISTORY_KEY = 'history:list';

export default function HistoryScreen() {
  const [items, setItems] = useState<Song[]>([]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      setItems(raw ? (JSON.parse(raw) as Song[]) : []);
    } catch { setItems([]); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const open = (index: number) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(items), index: String(index) } });
  };

  const clearAll = () => {
    Alert.alert('Xóa lịch sử', 'Bạn chắc chắn muốn xóa lịch sử?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(HISTORY_KEY);
        setItems([]);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>History ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={{ color:'#fff', fontWeight:'700' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}><Text style={{ color:'#777' }}>Chưa có lịch sử nghe.</Text></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => it.id + '-' + idx}
          contentContainerStyle={{ padding:16, gap:12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.card} onPress={() => open(index)}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={{ flex:1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <View style={styles.playBtn}><Ionicons name="play" size={18} color="#fff" /></View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0b1220' },
  headerRow: { padding:16, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { color:'#fff', fontSize:22, fontWeight:'800' },
  clearBtn: { backgroundColor:'#e0245e', paddingHorizontal:12, paddingVertical:8, borderRadius:10 },
  empty: { flex:1, alignItems:'center', justifyContent:'center' },
  card: { flexDirection:'row', alignItems:'center', backgroundColor:'#ffffff10', padding:12, borderRadius:14 },
  cover: { width:56, height:56, borderRadius:8, backgroundColor:'#111', marginRight:12 },
  title: { color:'#fff', fontWeight:'700' },
  artist: { color:'#9ca3af' },
  playBtn: { backgroundColor:'#5865f2', padding:8, borderRadius:10, marginLeft:10 },
});
