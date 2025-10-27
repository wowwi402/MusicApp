// app/(tabs)/playlists.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppTheme } from './theme';

import type { Song } from '../lib/playlists';
import * as PL from '../lib/playlists';

type SortKey = 'added' | 'title' | 'artist';

export default function PlaylistsScreen() {
  const { colors } = useAppTheme();

  const [allNames, setAllNames] = useState<string[]>([]);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [rawSongs, setRawSongs] = useState<Song[]>([]);
  const [newName, setNewName] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('added');

  // tải lại toàn bộ playlists + playlist đang active
  const reloadAll = useCallback(async () => {
    const names = await PL.getAllNames();
    const last = (await PL.getLastUsed()) || names[0] || null;

    setAllNames(names);
    setActiveName(last ?? null);

    if (last) {
      const listSongs = await PL.getSongs(last);
      setRawSongs(listSongs);
    } else {
      setRawSongs([]);
    }
  }, []);

  // reload mỗi lần tab này focus
  useFocusEffect(
    useCallback(() => {
      reloadAll();
    }, [reloadAll])
  );

  // sắp xếp bài trong playlist đang active
  const songs = useMemo(() => {
    if (sortBy === 'title') {
      return [...rawSongs].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'artist') {
      return [...rawSongs].sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return rawSongs;
  }, [rawSongs, sortBy]);

  // chọn / rename / xoá playlist
  const handleSelectPlaylist = async (name: string) => {
    await PL.setLastUsed(name);
    setActiveName(name);
    const listSongs = await PL.getSongs(name);
    setRawSongs(listSongs);
  };

  const handleRenamePlaylist = (oldName: string) => {
    Alert.prompt?.(
      'Đổi tên playlist',
      oldName,
      async (typed) => {
        const clean = (typed || '').trim();
        if (!clean) return;
        await PL.renamePlaylist(oldName, clean);
        await reloadAll();
      }
    );
  };

  const handleDeletePlaylist = (name: string) => {
    Alert.alert('Xoá playlist', `Xoá "${name}"?`, [
      { text: 'Huỷ' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await PL.deletePlaylist(name);
          await reloadAll();
        },
      },
    ]);
  };

  // tạo playlist mới
  const handleCreatePlaylist = async () => {
    const name = newName.trim();
    if (!name) return;

    await PL.createPlaylist(name);
    await PL.setLastUsed(name);

    setNewName('');
    await reloadAll();
  };

  // clear tất cả playlists
  const handleClearAll = () => {
    Alert.alert('Xoá tất cả', 'Bạn muốn xoá TẤT CẢ playlists?', [
      { text: 'Huỷ' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await PL.clearAll();
          await reloadAll();
        },
      },
    ]);
  };

  // phát nhạc trong playlist hiện tại
  const handlePlayFrom = (index: number) => {
    if (!activeName) return;
    router.replace({
      pathname: '/player',
      params: {
        queue: JSON.stringify(songs),
        index: String(index),
      },
    });
  };

  // xoá 1 bài khỏi playlist hiện tại
  const handleRemoveSong = async (songId: string) => {
    if (!activeName) return;
    await PL.removeSong(activeName, songId);
    const nextList = await PL.getSongs(activeName);
    setRawSongs(nextList);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View
        style={[
          styles.headerRow,
          { borderBottomColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Playlists ({allNames.length})
        </Text>

        {!!allNames.length && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={[
              styles.clearBtn,
              { backgroundColor: '#e0245e' },
            ]}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: '700',
              }}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ô tạo playlist */}
      <View style={styles.createRow}>
        <TextInput
          placeholder="Tên playlist mới..."
          placeholderTextColor={colors.sub as string}
          value={newName}
          onChangeText={setNewName}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleCreatePlaylist}
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SORT ROW */}
      <View style={styles.sortRow}>
        <Text style={{ color: colors.sub, fontSize: 14 }}>
          Sort:
        </Text>

        {(['added', 'title', 'artist'] as SortKey[]).map(
          (key) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSortBy(key)}
              style={[
                styles.sortChip,
                {
                  backgroundColor:
                    sortBy === key
                      ? colors.primary
                      : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                {key === 'added'
                  ? 'Ngày thêm'
                  : key === 'title'
                  ? 'Tên bài'
                  : 'Nghệ sĩ'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* DANH SÁCH PLAYLIST NGANG */}
      <FlatList
        horizontal
        data={allNames}
        keyExtractor={(n) => n}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.playlistChipWrap}>
            <TouchableOpacity
              onPress={() => handleSelectPlaylist(item)}
              onLongPress={() => handleRenamePlaylist(item)}
              style={[
                styles.playlistChip,
                {
                  backgroundColor:
                    activeName === item
                      ? colors.primary
                      : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '600',
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeletePlaylist(item)}
              style={[
                styles.delChip,
                { backgroundColor: '#00000040' },
              ]}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{
              color: colors.sub,
              paddingHorizontal: 12,
              fontSize: 14,
            }}
          >
            Chưa có playlist. Tạo mới ở trên.
          </Text>
        }
      />

      {/* BÀI TRONG PLAYLIST ACTIVE */}
      {activeName && (
        <>
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.text },
            ]}
          >
            Playlist: {activeName}
          </Text>

          <FlatList
            data={songs}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{
              padding: 12,
              gap: 12,
            }}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.songRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.songLeft}
                  onPress={() => handlePlayFrom(index)}
                >
                  <Image
                    source={{ uri: item.cover }}
                    style={styles.cover}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.songTitle,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{ color: colors.sub }}
                      numberOfLines={1}
                    >
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemoveSong(item.id)}
                  style={[
                    styles.removeBtn,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Ionicons
                    name="trash"
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text
                style={{
                  color: colors.sub,
                  paddingHorizontal: 12,
                }}
              >
                Playlist trống.
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  createRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  textInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    fontSize: 15,
  },

  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sortRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  playlistChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playlistChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 4,
  },

  delChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'center',
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },

  songLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#111',
  },

  songTitle: {
    fontWeight: '700',
  },

  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
