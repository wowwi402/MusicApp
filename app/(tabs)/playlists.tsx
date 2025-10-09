// app/(tabs)/playlists.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Song } from '../lib/playlists';
import * as PL from '../lib/playlists';
import { useAppTheme } from './theme';

type SortKey = 'added' | 'title' | 'artist';

export default function PlaylistsScreen() {
  const { colors } = useAppTheme();
  const [names, setNames] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [rawSongs, setRawSongs] = useState<Song[]>([]);
  const [creating, setCreating] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('added');

  const load = useCallback(async () => {
    const list = await PL.getAllNames();
    setNames(list);
    const last = (await PL.getLastUsed()) || list[0] || null;
    setActive(last);
    if (last) setRawSongs(await PL.getSongs(last));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const songs = useMemo(() => {
    if (sortBy === 'title') return [...rawSongs].sort((a,b) => a.title.localeCompare(b.title));
    if (sortBy === 'artist') return [...rawSongs].sort((a,b) => a.artist.localeCompare(b.artist));
    return rawSongs; // 'added' = giữ nguyên thứ tự lưu
  }, [rawSongs, sortBy]);

  const select = async (name: string) => {
    setActive(name);
    await PL.setLastUsed(name);
    setRawSongs(await PL.getSongs(name));
  };

  const addNew = async () => {
    const name = creating.trim(); if (!name) return;
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
    Alert.alert('Xoá playlist', `Xoá "${name}"?`, [
      { text: 'Huỷ' },
      { text: 'Xoá', style: 'destructive', onPress: async () => { await PL.deletePlaylist(name); await load(); } }
    ]);
  };

  const playFrom = (index: number) => {
    if (!active) return;
    router.replace({ pathname: '/player', params: { queue: JSON.stringify(songs), index: String(index) } });
  };

  const removeSongFrom = async (id: string) => {
    if (!active) return;
    await PL.removeSong(active, id);
    setRawSongs(await PL.getSongs(active));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgFrom }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>Playlists ({names.length})</Text>
      </View>

      {/* Tạo playlist */}
      <View style={styles.newRow}>
        <TextInput
          placeholder="Tên playlist mới..."
          placeholderTextColor={colors.sub}
          value={creating}
          onChangeText={setCreating}
          style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addNew}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Thanh sort + clear */}
      <View style={styles.toolbarRow}>
        <View style={styles.sortGroup}>
          <Text style={{ color: colors.sub, marginRight: 8 }}>Sort:</Text>
          {(['added','title','artist'] as SortKey[]).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setSortBy(k)}
              style={[
                styles.sortChip,
                { backgroundColor: sortBy === k ? colors.primary : colors.card }
              ]}
            >
              <Text style={{ color: '#fff', fontWeight:'700', fontSize:12 }}>
                {k === 'added' ? 'Ngày thêm' : k === 'title' ? 'Tên bài' : 'Nghệ sĩ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!names.length && (
          <TouchableOpacity
            onPress={async () => { await PL.clearAll(); await load(); }}
            style={[styles.clearBtn, { backgroundColor: '#e0245e' }]}
          >
            <Text style={{ color:'#fff', fontWeight:'700' }}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách playlist */}
      <FlatList
        horizontal
        data={names}
        keyExtractor={(n) => n}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => select(item)}
            onLongPress={() => rename(item)}
            style={[
              styles.tag,
              { backgroundColor: colors.card },
              active === item && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={{ color:'#fff' }}>{item}</Text>
            <TouchableOpacity onPress={() => removeList(item)} style={styles.tagDel}>
              <Ionicons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: colors.sub, paddingHorizontal:12 }}>Chưa có playlist. Tạo mới ở trên.</Text>}
      />

      {/* Bài trong playlist */}
      {active && (
        <>
          <Text style={[styles.subHeader, { color: colors.text }]}>Playlist: {active}</Text>
          <FlatList
            data={songs}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item, index }) => (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', flex:1, gap:12 }} onPress={() => playFrom(index)}>
                  <Image source={{ uri: item.cover }} style={styles.cover} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: colors.sub }} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSongFrom(item.id)} style={[styles.removeBtn, { backgroundColor: '#ef4444' }]}>
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: colors.sub, paddingHorizontal:12 }}>Playlist trống.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },

  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { fontSize:18, fontWeight:'800' },

  newRow: { flexDirection:'row', gap:8, padding:12 },
  input: { flex:1, borderRadius:12, paddingHorizontal:12, height:40 },
  addBtn: { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },

  toolbarRow: { paddingHorizontal:12, flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:8 },
  sortGroup: { flexDirection:'row', alignItems:'center', gap:8 },
  sortChip: { paddingHorizontal:10, paddingVertical:6, borderRadius:999 },

  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

  tag: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:999 },
  tagDel: { marginLeft:6, backgroundColor:'#00000022', width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },

  subHeader: { fontSize:16, fontWeight:'700', paddingHorizontal:12, paddingTop:10 },

  card: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { fontWeight:'700' },
  removeBtn: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
});
