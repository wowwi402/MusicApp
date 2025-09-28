import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as PL from '../lib/playlists';
type Song = PL.Song;

export default function PlaylistsScreen() {
  const [names, setNames] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [creating, setCreating] = useState('');

  const load = useCallback(async () => {
    const list = await PL.getAllNames();
    setNames(list);
    const last = (await PL.getLastUsed()) || list[0] || null;
    setActive(last);
    if (last) setSongs(await PL.getSongs(last));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

 const select = async (name: string) => {
  setActive(name);
  await PL.setLastUsed(name);          // ✅ nhớ playlist đang chọn
  setSongs(await PL.getSongs(name));
};

  const addNew = async () => {
    const name = creating.trim();
    if (!name) return;
    await PL.createPlaylist(name);
    setCreating('');
    await load();
    setActive(name);
  };

  const rename = async (oldName: string) => {
    Alert.prompt?.('Đổi tên playlist', oldName, async (newName) => {
      const n = (newName || '').trim(); if (!n) return;
      await PL.renamePlaylist(oldName, n);
      await load(); setActive(n);
    });
  };

  const removeList = async (name: string) => {
    Alert.alert('Xóa playlist', `Xóa "${name}"?`, [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { await PL.deletePlaylist(name); await load(); } }
    ]);
  };

  const playFrom = (index: number) => {
    if (!active) return;
    router.push({ pathname: '/player', params: { queue: JSON.stringify(songs), index: String(index) } });
  };

  const removeSongFrom = async (id: string) => {
    if (!active) return;
    await PL.removeSong(active, id);
    setSongs(await PL.getSongs(active));
  };

  return (
    <View style={styles.container}>
      {/* Hàng tạo playlist */}
      <View style={styles.newRow}>
        <TextInput
          placeholder="Tên playlist mới..."
          placeholderTextColor="#94a3b8"
          value={creating}
          onChangeText={setCreating}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addNew}><Ionicons name="add" size={18} color="#fff" /></TouchableOpacity>
      </View>

      {/* Danh sách playlist */}
      <FlatList
        horizontal
        data={names}
        keyExtractor={(n) => n}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => select(item)}
            onLongPress={() => rename(item)}
            style={[styles.tag, active === item && styles.tagActive]}
          >
            <Text style={{ color:'#fff' }}>{item}</Text>
            <TouchableOpacity onPress={() => removeList(item)} style={styles.tagDel}><Ionicons name="close" size={12} color="#fff" /></TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color:'#9ca3af', paddingHorizontal:12 }}>Chưa có playlist. Tạo mới ở trên.</Text>}
        showsHorizontalScrollIndicator={false}
      />

      {/* Bài trong playlist đang chọn */}
      {active && (
        <>
          <Text style={styles.header}>Playlist: {active}</Text>
          <FlatList
            data={songs}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', flex:1, gap:12 }} onPress={() => playFrom(index)}>
                  <Image source={{ uri: item.cover }} style={styles.cover} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSongFrom(item.id)} style={styles.removeBtn}>
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color:'#9ca3af', paddingHorizontal:12 }}>Playlist trống.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0b1220' },
  newRow: { flexDirection:'row', gap:8, padding:12 },
  input: { flex:1, backgroundColor:'#ffffff10', borderRadius:12, paddingHorizontal:12, color:'#fff', height:40 },
  addBtn: { width:40, height:40, borderRadius:12, backgroundColor:'#6366f1', alignItems:'center', justifyContent:'center' },

  tag: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, backgroundColor:'#ffffff10', borderRadius:999 },
  tagActive: { backgroundColor:'#4f46e5' },
  tagDel: { marginLeft:6, backgroundColor:'#00000022', width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },

  header: { color:'#fff', fontSize:16, fontWeight:'700', paddingHorizontal:12, paddingTop:10 },
  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#ffffff10', padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color:'#fff', fontWeight:'700' },
  artist:{ color:'#9ca3af' },
  removeBtn: { width:36, height:36, borderRadius:18, backgroundColor:'#ef4444', alignItems:'center', justifyContent:'center' },
});
