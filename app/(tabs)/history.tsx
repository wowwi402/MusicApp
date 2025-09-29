// app/(tabs)/history.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as H from '../lib/history';

type Song = { id: string; title: string; artist: string; url: string; cover: string };

export default function HistoryScreen() {
  const [items, setItems] = useState<Song[]>([]);

  const load = async () => setItems(await H.getHistory());
  useFocusEffect(useCallback(() => { load(); }, []));

  const playFromHistory = (index: number) => {
    router.replace({
      pathname: '/player',
      params: { queue: JSON.stringify(items), index: String(index) }
    });
  };

  const removeOne = async (id: string) => {
    await H.removeFromHistory(id);
    await load();
  };

  const clearAll = () => {
    Alert.alert('Xoá lịch sử', 'Bạn chắc muốn xoá tất cả?', [
      { text: 'Huỷ' },
      { text: 'Xoá', style: 'destructive', onPress: async () => { await H.clearHistory(); await load(); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <View style={styles.empty}><Text style={{ color:'#999' }}>Chưa nghe bài nào.</Text></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{ padding:12, gap:12 }}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={{ flexDirection:'row', flex:1, alignItems:'center', gap:12 }}
                  onPress={() => playFromHistory(index)}
                >
                  <Image source={{ uri: item.cover }} style={styles.cover} />
                  <View style={{ flex:1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeOne(item.id)} style={styles.removeBtn}>
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b1220' },
  container: { flex:1, backgroundColor:'#0b1220' },

  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { color:'#fff', fontSize:18, fontWeight:'800' },
  clearBtn: { backgroundColor:'#e0245e', paddingHorizontal:12, paddingVertical:8, borderRadius:10 },

  empty: { flex:1, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#ffffff10', padding:12, borderRadius:14 },
  cover: { width:56, height:56, borderRadius:8, backgroundColor:'#111' },
  title: { color:'#fff', fontWeight:'700' },
  artist: { color:'#9ca3af' },
  removeBtn: { width:36, height:36, borderRadius:18, backgroundColor:'#ef4444', alignItems:'center', justifyContent:'center' },
});
