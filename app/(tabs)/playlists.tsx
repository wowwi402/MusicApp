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
  View,
} from 'react-native';

import * as PL from '../lib/playlists';
import { useAppTheme } from './theme';

// kiểu bài hát trong playlist
import type { Song } from '../lib/playlists';

type SortKey = 'added' | 'title' | 'artist';

export default function PlaylistsScreen() {
  const { colors } = useAppTheme();

  const [names, setNames] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [rawSongs, setRawSongs] = useState<Song[]>([]);
  const [creating, setCreating] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('added');

  // load tất cả playlists + chọn playlist cuối cùng user dùng
  const load = useCallback(async () => {
    const list = await PL.getAllNames(); // ['My Playlist', 'Chill', ...]
    setNames(list);

    const last = (await PL.getLastUsed()) || list[0] || null;
    setActive(last);

    if (last) {
      const songsOfLast = await PL.getSongs(last);
      setRawSongs(songsOfLast);
    } else {
      setRawSongs([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // sort danh sách bài hát trong playlist theo sortBy
  const songs = useMemo(() => {
    if (sortBy === 'title') {
      return [...rawSongs].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'artist') {
      return [...rawSongs].sort((a, b) => a.artist.localeCompare(b.artist));
    }
    // 'added' => giữ nguyên thứ tự đã lưu
    return rawSongs;
  }, [rawSongs, sortBy]);

  // chọn playlist (tap vào tag)
  const select = async (name: string) => {
    setActive(name);
    await PL.setLastUsed(name);
    const list = await PL.getSongs(name);
    setRawSongs(list);
  };

  // tạo playlist mới
  const addNew = async () => {
    const name = creating.trim();
    if (!name) return;
    await PL.createPlaylist(name);
    setCreating('');
    await load();
    setActive(name);
  };

  // đổi tên playlist (long press tag)
  const rename = async (oldName: string) => {
    // iOS có Alert.prompt, Android không. Nếu Alert.prompt không tồn tại thì ta fallback báo alert.
    if (Alert.prompt) {
      Alert.prompt('Đổi tên playlist', oldName, async (newName) => {
        const n = (newName || '').trim();
        if (!n) return;
        await PL.renamePlaylist(oldName, n);
        await load();
        setActive(n);
      });
    } else {
      Alert.alert(
        'Không hỗ trợ đổi tên',
        'Thiết bị này không hỗ trợ Alert.prompt(). Bạn có thể tự sửa logic rename để mở 1 modal nhập tên mới.'
      );
    }
  };

  // xoá playlist
  const removeList = async (name: string) => {
    Alert.alert('Xoá playlist', `Xoá "${name}"?`, [
      { text: 'Huỷ' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await PL.deletePlaylist(name);
          await load();
        },
      },
    ]);
  };

  // phát nhạc từ bài X trong playlist hiện tại
  const playFrom = (index: number) => {
    if (!active) return;
    router.replace({
      pathname: '/player',
      params: {
        queue: JSON.stringify(songs),
        index: String(index),
      },
    });
  };

  // xoá 1 bài khỏi playlist hiện tại
  const removeSongFrom = async (id: string) => {
    if (!active) return;
    await PL.removeSong(active, id);
    const updated = await PL.getSongs(active);
    setRawSongs(updated);
  };

  // xoá toàn bộ playlists (Clear All)
  const clearAllPlaylists = async () => {
    Alert.alert('Xoá tất cả', 'Bạn chắc chắn muốn xoá toàn bộ playlists?', [
      { text: 'Huỷ' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await PL.clearAll();
          await load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>
          Playlists ({names.length})
        </Text>
      </View>

      {/* Ô tạo playlist mới */}
      <View style={styles.newRow}>
        <TextInput
          placeholder="Tên playlist mới..."
          placeholderTextColor={colors.sub as string}
          value={creating}
          onChangeText={setCreating}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary },
          ]}
          onPress={addNew}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Thanh sort + nút Clear All */}
      <View style={styles.toolbarRow}>
        {/* Sort chips */}
        <View style={styles.sortGroup}>
          <Text style={{ color: colors.sub, marginRight: 8 }}>Sort:</Text>

          {(['added', 'title', 'artist'] as SortKey[]).map((k) => {
            const activeChip = sortBy === k;
            return (
              <TouchableOpacity
                key={k}
                onPress={() => setSortBy(k)}
                style={[
                    styles.sortChip,
                    {
                      backgroundColor: activeChip
                        ? colors.primary
                        : colors.card,
                      borderColor: colors.border,
                      borderWidth: activeChip ? 0 : 1,
                    },
                ]}
              >
                <Text
                  style={{
                    color: activeChip ? '#fff' : colors.text,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {k === 'added'
                    ? 'Ngày thêm'
                    : k === 'title'
                    ? 'Tên bài'
                    : 'Nghệ sĩ'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clear All playlists */}
        {!!names.length && (
          <TouchableOpacity
            onPress={clearAllPlaylists}
            style={[
              styles.clearBtn,
              { backgroundColor: '#e0245e' },
            ]}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách playlist (tên playlist) */}
      <FlatList
        horizontal
        data={names}
        keyExtractor={(n) => n}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => select(item)}
              onLongPress={() => rename(item)}
              style={[
                styles.tag,
                {
                  backgroundColor:
                    active === item ? colors.primary : colors.card,
                  borderColor: colors.border,
                  borderWidth: active === item ? 0 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: active === item ? '#fff' : colors.text,
                  fontWeight: '600',
                }}
              >
                {item}
              </Text>

              <TouchableOpacity
                onPress={() => removeList(item)}
                style={[
                  styles.tagDel,
                  {
                    backgroundColor:
                      active === item
                        ? 'rgba(0,0,0,0.25)'
                        : 'rgba(0,0,0,0.15)',
                  },
                ]}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
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
            Chưa có playlist. Tạo mới ở trên.
          </Text>
        }
      />

      {/* Danh sách bài hát trong playlist đang chọn */}
      {active && (
        <>
          <Text
            style={[
              styles.subHeader,
              { color: colors.text },
            ]}
          >
            Playlist: {active}
          </Text>

          <FlatList
            data={songs}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            showsVerticalScrollIndicator={false}
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
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardLeft}
                  onPress={() => playFrom(index)}
                >
                  <Image
                    source={{ uri: item.cover }}
                    style={[
                      styles.cover,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.title,
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
                  onPress={() => removeSongFrom(item.id)}
                  style={[
                    styles.removeBtn,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerRow: {
    padding: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  header: {
    fontSize: 18,
    fontWeight: '800',
  },

  // tạo playlist
  newRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  input: {
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

  // thanh sort + clear all
  toolbarRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  // list playlist names (tags)
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginVertical: 4,
  },
  tagDel: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
